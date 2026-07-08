import type { CompatibleDbConnection } from "@codexsun/framework/db";
import { createServerConnection, migrateTenantDatabase } from "./bootstrap.js";
import { MigrationRunner } from "./migration-runner.js";
import { tenantMigrations } from "./migrations/tenant-index.js";
import {
  createRunRecord,
  createdTablesFromMigration,
  dropAllTables,
  dropTables,
  errorMessage,
  finishRunRecord,
  requireConfirmed,
  upsertDatabaseVersion,
  type DatabaseCommand,
  type DatabaseCommandOptions,
  type DatabaseCommandResult
} from "./database-manager.shared.js";

export type TenantDatabaseTarget = {
  databaseName: string;
  id?: string | number | null | undefined;
  tenantId?: string | number | null | undefined;
};

export type TenantDatabaseCommandOptions = DatabaseCommandOptions & {
  allTenants?: boolean | undefined;
  tenantDatabaseIds?: Array<number | string> | undefined;
  tenantDatabases?: TenantDatabaseTarget[] | undefined;
  tenantId?: string | number | null | undefined;
};

export type TenantDatabaseCommandBatchResult = {
  command: DatabaseCommand;
  results: DatabaseCommandResult[];
  scope: "tenant";
  total: number;
};

export async function runTenantDatabaseCommandBatch(
  masterDb: CompatibleDbConnection,
  command: DatabaseCommand,
  options: TenantDatabaseCommandOptions = {},
): Promise<TenantDatabaseCommandBatchResult> {
  const targets = await resolveTenantTargets(masterDb, options);
  const results: DatabaseCommandResult[] = [];
  for (const target of targets) {
    if (command === "drop") {
      results.push(await dropTenantDatabase(masterDb, target, options));
      continue;
    }
    await ensureTenantDatabase(target.databaseName);
    const tenantDb = await createServerConnection(target.databaseName);
    try {
      results.push(await runTenantDatabaseCommand(masterDb, tenantDb, command, target, options));
    } finally {
      await tenantDb.end();
    }
  }
  return {
    command,
    results,
    scope: "tenant",
    total: results.length,
  };
}

async function runTenantDatabaseCommand(
  masterDb: CompatibleDbConnection,
  tenantDb: CompatibleDbConnection,
  command: DatabaseCommand,
  target: TenantDatabaseTarget,
  options: TenantDatabaseCommandOptions,
): Promise<DatabaseCommandResult> {
  if (command === "drop") return dropTenantDatabase(masterDb, target, options);
  if (command === "migrate") return migrateTenant(masterDb, tenantDb, target, options);
  if (command === "migrate:rollback") return rollbackTenant(masterDb, tenantDb, target, options);
  return migrateFreshTenant(masterDb, tenantDb, target, options);
}

async function dropTenantDatabase(
  masterDb: CompatibleDbConnection,
  target: TenantDatabaseTarget,
  options: TenantDatabaseCommandOptions,
): Promise<DatabaseCommandResult> {
  requireConfirmed("drop", options);
  assertSafeDatabaseName(target.databaseName);
  const server = await createServerConnection();
  try {
    await server.execute(`DROP DATABASE IF EXISTS \`${target.databaseName}\``);
  } finally {
    await server.end();
  }
  if (target.id) {
    await masterDb.execute(
      "UPDATE tenant_databases SET status = 'dropped' WHERE id = ?",
      [target.id],
    );
  }
  await upsertDatabaseVersion(masterDb, {
    databaseName: target.databaseName,
    migrationId: "dropped",
    scope: "tenant",
    tenantId: stringifyOptional(target.tenantId),
  });
  return {
    command: "drop",
    databaseName: target.databaseName,
    droppedTables: [],
    message: `Dropped tenant database ${target.databaseName}.`,
    migrations: [],
    scope: "tenant",
    tenantId: stringifyOptional(target.tenantId),
  };
}

async function migrateTenant(
  masterDb: CompatibleDbConnection,
  tenantDb: CompatibleDbConnection,
  target: TenantDatabaseTarget,
  options: TenantDatabaseCommandOptions,
): Promise<DatabaseCommandResult> {
  const runner = new MigrationRunner(tenantDb, "tenant_migrations");
  await runner.initialize();
  const pending = runner.listPending(tenantMigrations);
  const migrations: Array<{ id: string; status: string }> = [];

  for (const migration of pending) {
    const runId = await createRunRecord(masterDb, {
      actorEmail: options.actorEmail,
      backupRunId: options.backupRunId,
      command: "migrate",
      databaseName: target.databaseName,
      migration,
      scope: "tenant",
      status: "running",
      tenantId: stringifyOptional(target.tenantId),
      versionBefore: runner.listApplied().at(-1) ?? null,
    });
    try {
      await runner.run(migration);
      await finishRunRecord(masterDb, runId, "succeeded", migration.id);
      await upsertDatabaseVersion(masterDb, {
        databaseName: target.databaseName,
        migrationId: migration.id,
        scope: "tenant",
        tenantId: stringifyOptional(target.tenantId),
      });
      migrations.push({ id: migration.id, status: "applied" });
    } catch (error) {
      await finishRunRecord(masterDb, runId, "failed", null, errorMessage(error));
      migrations.push({ id: migration.id, status: "error" });
      throw error;
    }
  }
  if (target.id) {
    await masterDb.execute("UPDATE tenant_databases SET status = 'ready' WHERE id = ?", [target.id]);
  }

  return {
    command: "migrate",
    databaseName: target.databaseName,
    droppedTables: [],
    message: pending.length ? `Applied ${pending.length} tenant migration(s).` : "Nothing to migrate.",
    migrations,
    scope: "tenant",
    tenantId: stringifyOptional(target.tenantId),
  };
}

async function migrateFreshTenant(
  masterDb: CompatibleDbConnection,
  tenantDb: CompatibleDbConnection,
  target: TenantDatabaseTarget,
  options: TenantDatabaseCommandOptions,
): Promise<DatabaseCommandResult> {
  requireConfirmed("migrate:fresh", options);
  const droppedTables = await dropAllTables(tenantDb);
  await migrateTenantDatabase(target.databaseName);
  const lastMigrationId = tenantMigrations.at(-1)?.id ?? "unversioned";
  await upsertDatabaseVersion(masterDb, {
    databaseName: target.databaseName,
    migrationId: lastMigrationId,
    scope: "tenant",
    tenantId: stringifyOptional(target.tenantId),
  });
  return {
    command: "migrate:fresh",
    databaseName: target.databaseName,
    droppedTables,
    message: `Fresh tenant migration completed. Dropped ${droppedTables.length} table(s).`,
    migrations: tenantMigrations.map((migration) => ({ id: migration.id, status: "applied" })),
    scope: "tenant",
    tenantId: stringifyOptional(target.tenantId),
  };
}

async function rollbackTenant(
  masterDb: CompatibleDbConnection,
  tenantDb: CompatibleDbConnection,
  target: TenantDatabaseTarget,
  options: TenantDatabaseCommandOptions,
): Promise<DatabaseCommandResult> {
  requireConfirmed("migrate:rollback", options);
  const runner = new MigrationRunner(tenantDb, "tenant_migrations");
  await runner.initialize();
  const applied = runner.listApplied();
  const migration = [...tenantMigrations].reverse().find((item) => applied.includes(item.id));
  if (!migration) {
    return {
      command: "migrate:rollback",
      databaseName: target.databaseName,
      droppedTables: [],
      message: "Nothing to rollback.",
      migrations: [],
      scope: "tenant",
      tenantId: stringifyOptional(target.tenantId),
    };
  }

  const runId = await createRunRecord(masterDb, {
    actorEmail: options.actorEmail,
    backupRunId: options.backupRunId,
    command: "migrate:rollback",
    databaseName: target.databaseName,
    migration,
    scope: "tenant",
    status: "running",
    tenantId: stringifyOptional(target.tenantId),
    versionBefore: migration.id,
  });
  const tables = createdTablesFromMigration(migration);
  try {
    await dropTables(tenantDb, tables);
    await tenantDb.execute("DELETE FROM tenant_migrations WHERE id = ?", [migration.id]);
    const versionAfter = applied.filter((id) => id !== migration.id).at(-1) ?? "unversioned";
    await finishRunRecord(masterDb, runId, "rolled_back", versionAfter);
  await upsertDatabaseVersion(masterDb, {
      databaseName: target.databaseName,
      migrationId: versionAfter,
      scope: "tenant",
      tenantId: stringifyOptional(target.tenantId),
  });
  if (target.id) {
    await masterDb.execute("UPDATE tenant_databases SET status = 'ready' WHERE id = ?", [target.id]);
  }
  return {
      command: "migrate:rollback",
      databaseName: target.databaseName,
      droppedTables: tables,
      message: `Rolled back ${migration.id}.`,
      migrations: [{ id: migration.id, status: "rolled_back" }],
      scope: "tenant",
      tenantId: stringifyOptional(target.tenantId),
    };
  } catch (error) {
    await finishRunRecord(masterDb, runId, "failed", null, errorMessage(error));
    throw error;
  }
}

async function resolveTenantTargets(masterDb: CompatibleDbConnection, options: TenantDatabaseCommandOptions): Promise<TenantDatabaseTarget[]> {
  if (options.tenantDatabases?.length) return normalizeTargets(options.tenantDatabases);
  if (options.databaseName) return [{ databaseName: options.databaseName, tenantId: options.tenantId }];

  const values: unknown[] = [];
  const where: string[] = [];
  if (!options.allTenants && options.tenantDatabaseIds?.length) {
    where.push(`td.id IN (${options.tenantDatabaseIds.map(() => "?").join(", ")})`);
    values.push(...options.tenantDatabaseIds);
  } else if (!options.allTenants && options.tenantId) {
    where.push("td.tenant_id = ?");
    values.push(options.tenantId);
  }

  if (!options.allTenants && !where.length) {
    throw new Error("Tenant migration requires allTenants=true, tenantDatabaseIds, tenantId, or databaseName.");
  }

  const [rows] = await masterDb.execute<Array<Record<string, unknown>>>(
    `SELECT td.id, td.tenant_id, td.database_name
     FROM tenant_databases td
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY td.created_at ASC`,
    values,
  );
  return normalizeTargets(rows.map((row) => ({
    databaseName: String(row.database_name ?? ""),
    id: String(row.id ?? ""),
    tenantId: String(row.tenant_id ?? ""),
  })));
}

async function ensureTenantDatabase(databaseName: string) {
  assertSafeDatabaseName(databaseName);
  const server = await createServerConnection();
  try {
    await server.execute(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
  } finally {
    await server.end();
  }
}

function assertSafeDatabaseName(databaseName: string) {
  if (!/^[A-Za-z0-9_]+$/.test(databaseName)) {
    throw new Error(`Unsafe tenant database name: ${databaseName}`);
  }
}

function normalizeTargets(targets: TenantDatabaseTarget[]) {
  const seen = new Set<string>();
  return targets
    .map((target) => ({ ...target, databaseName: target.databaseName.trim() }))
    .filter((target) => target.databaseName && !seen.has(target.databaseName) && seen.add(target.databaseName));
}

function stringifyOptional(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}
