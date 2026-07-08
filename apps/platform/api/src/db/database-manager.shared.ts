import { createHash } from "node:crypto";
import type { CompatibleDbConnection } from "@codexsun/framework/db";
import type { Migration } from "./migration-runner.js";

export type DatabaseCommand = "drop" | "migrate" | "migrate:fresh" | "migrate:rollback";

export type DatabaseCommandOptions = {
  actorEmail?: string | undefined;
  backupRunId?: number | null | undefined;
  confirm?: boolean | undefined;
  databaseName?: string | undefined;
};

export type DatabaseCommandResult = {
  command: DatabaseCommand;
  databaseName: string;
  droppedTables: string[];
  message: string;
  migrations: Array<{ id: string; status: string }>;
  scope: "master" | "tenant";
  tenantId?: string | null;
};

export async function createRunRecord(
  db: CompatibleDbConnection,
  input: {
    actorEmail?: string | undefined;
    backupRunId?: number | null | undefined;
    command: DatabaseCommand;
    databaseName: string;
    migration: Migration;
    scope: "master" | "tenant";
    status: string;
    tenantId?: string | null | undefined;
    versionBefore: string | null;
  },
) {
  if (!(await tableExists(db, "database_migration_runs"))) return null;
  const [result] = await db.execute<{ insertId?: number | string }>(
    `INSERT INTO database_migration_runs
       (scope, tenant_id, database_name, migration_id, checksum, app_version, database_version_before, status, backup_run_id, actor_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.scope,
      input.tenantId ?? null,
      input.databaseName,
      input.migration.id,
      migrationChecksum(input.migration, input.command),
      currentAppVersion(),
      input.versionBefore,
      input.status,
      input.backupRunId ?? null,
      input.actorEmail ?? null,
    ],
  );
  return Number(result.insertId ?? 0) || null;
}

export async function finishRunRecord(db: CompatibleDbConnection, runId: number | null, status: string, versionAfter: string | null, error?: string) {
  if (!runId || !(await tableExists(db, "database_migration_runs"))) return;
  await db.execute(
    `UPDATE database_migration_runs
     SET status = ?, database_version_after = ?, error_message = ?, finished_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [status, versionAfter, error ?? null, runId],
  );
}

export async function upsertDatabaseVersion(
  db: CompatibleDbConnection,
  input: { databaseName: string; migrationId: string; scope: "master" | "tenant"; tenantId?: string | null },
) {
  if (!(await tableExists(db, "database_versions"))) return;
  await db.execute(
    `INSERT INTO database_versions
       (scope, tenant_id, database_name, app_version, database_version, last_migration_id, status)
     VALUES (?, ?, ?, ?, ?, ?, 'current')
     ON DUPLICATE KEY UPDATE
       app_version = VALUES(app_version),
       database_version = VALUES(database_version),
       last_migration_id = VALUES(last_migration_id),
       status = 'current',
       checked_at = CURRENT_TIMESTAMP`,
    [
      input.scope,
      input.tenantId ?? null,
      input.databaseName,
      currentAppVersion(),
      input.migrationId,
      input.migrationId === "unversioned" ? null : input.migrationId,
    ],
  );
}

export async function dropAllTables(db: CompatibleDbConnection) {
  const [rows] = await db.execute<Array<{ TABLE_NAME?: string; table_name?: string }>>(
    `SELECT TABLE_NAME
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_TYPE = 'BASE TABLE'
     ORDER BY TABLE_NAME`,
  );
  const tables = rows.map((row) => String(row.TABLE_NAME ?? row.table_name ?? "")).filter(Boolean);
  await dropTables(db, tables);
  return tables;
}

export async function dropTables(db: CompatibleDbConnection, tables: string[]) {
  const safeTables = [...new Set(tables)].filter((table) => /^[A-Za-z0-9_]+$/.test(table));
  if (!safeTables.length) return;
  await db.execute("SET FOREIGN_KEY_CHECKS = 0");
  try {
    for (const table of safeTables.reverse()) {
      await db.execute(`DROP TABLE IF EXISTS \`${table}\``);
    }
  } finally {
    await db.execute("SET FOREIGN_KEY_CHECKS = 1");
  }
}

export function createdTablesFromMigration(migration: Migration) {
  const text = String(migration.up);
  const tables = [...text.matchAll(/CREATE TABLE IF NOT EXISTS\s+`?([A-Za-z0-9_]+)`?/g)].map((match) => match[1] ?? "");
  return tables.filter(Boolean);
}

export function requireConfirmed(command: DatabaseCommand, options: DatabaseCommandOptions) {
  if (process.env.NODE_ENV === "test") return;
  if (!options.confirm) {
    throw new Error(`${command} requires confirm=true.`);
  }
}

export function migrationChecksum(input: { description: string; id: string }, command = "migrate") {
  return createHash("sha256").update(`${command}:${input.id}:${input.description}`).digest("hex");
}

export function currentAppVersion() {
  return process.env.npm_package_version || "1.0.71";
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function tableExists(db: CompatibleDbConnection, tableName: string) {
  const [rows] = await db.execute<Array<{ total: number | string }>>(
    `SELECT COUNT(*) AS total
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?`,
    [tableName],
  );
  return Number(rows[0]?.total ?? 0) > 0;
}
