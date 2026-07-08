import type { CompatibleDbConnection } from "@codexsun/framework/db";
import { env } from "../env.js";
import { migrateMasterDatabase } from "./bootstrap.js";
import { MigrationRunner } from "./migration-runner.js";
import { masterMigrations } from "./migrations/master-index.js";
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

export async function runMasterDatabaseCommand(
  db: CompatibleDbConnection,
  command: DatabaseCommand,
  options: DatabaseCommandOptions = {},
): Promise<DatabaseCommandResult> {
  if (command === "drop") throw new Error("Dropping the master database is not allowed from database manager.");
  const databaseName = options.databaseName ?? env.DB_MASTER_NAME;
  if (command === "migrate") return migrateMaster(db, databaseName, options);
  if (command === "migrate:rollback") return rollbackMaster(db, databaseName, options);
  return migrateFreshMaster(db, databaseName, options);
}

async function migrateMaster(db: CompatibleDbConnection, databaseName: string, options: DatabaseCommandOptions): Promise<DatabaseCommandResult> {
  const runner = new MigrationRunner(db, "platform_migrations");
  await runner.initialize();
  const pending = runner.listPending(masterMigrations);
  const migrations: Array<{ id: string; status: string }> = [];

  for (const migration of pending) {
    const runId = await createRunRecord(db, {
      actorEmail: options.actorEmail,
      backupRunId: options.backupRunId,
      command: "migrate",
      databaseName,
      migration,
      scope: "master",
      status: "running",
      versionBefore: runner.listApplied().at(-1) ?? null,
    });
    try {
      await runner.run(migration);
      await finishRunRecord(db, runId, "succeeded", migration.id);
      await upsertDatabaseVersion(db, { databaseName, migrationId: migration.id, scope: "master" });
      migrations.push({ id: migration.id, status: "applied" });
    } catch (error) {
      await finishRunRecord(db, runId, "failed", null, errorMessage(error));
      migrations.push({ id: migration.id, status: "error" });
      throw error;
    }
  }

  return {
    command: "migrate",
    databaseName,
    droppedTables: [],
    message: pending.length ? `Applied ${pending.length} master migration(s).` : "Nothing to migrate.",
    migrations,
    scope: "master",
  };
}

async function migrateFreshMaster(db: CompatibleDbConnection, databaseName: string, options: DatabaseCommandOptions): Promise<DatabaseCommandResult> {
  requireConfirmed("migrate:fresh", options);
  const droppedTables = await dropAllTables(db);
  await migrateMasterDatabase();
  return {
    command: "migrate:fresh",
    databaseName,
    droppedTables,
    message: `Fresh master migration completed. Dropped ${droppedTables.length} table(s).`,
    migrations: masterMigrations.map((migration) => ({ id: migration.id, status: "applied" })),
    scope: "master",
  };
}

async function rollbackMaster(db: CompatibleDbConnection, databaseName: string, options: DatabaseCommandOptions): Promise<DatabaseCommandResult> {
  requireConfirmed("migrate:rollback", options);
  const runner = new MigrationRunner(db, "platform_migrations");
  await runner.initialize();
  const applied = runner.listApplied();
  const migration = [...masterMigrations].reverse().find((item) => applied.includes(item.id));
  if (!migration) {
    return {
      command: "migrate:rollback",
      databaseName,
      droppedTables: [],
      message: "Nothing to rollback.",
      migrations: [],
      scope: "master",
    };
  }

  const runId = await createRunRecord(db, {
    actorEmail: options.actorEmail,
    backupRunId: options.backupRunId,
    command: "migrate:rollback",
    databaseName,
    migration,
    scope: "master",
    status: "running",
    versionBefore: migration.id,
  });
  const tables = createdTablesFromMigration(migration);
  try {
    await dropTables(db, tables);
    await db.execute("DELETE FROM platform_migrations WHERE id = ?", [migration.id]);
    const versionAfter = applied.filter((id) => id !== migration.id).at(-1) ?? "unversioned";
    await finishRunRecord(db, runId, "rolled_back", versionAfter);
    await upsertDatabaseVersion(db, { databaseName, migrationId: versionAfter, scope: "master" });
    return {
      command: "migrate:rollback",
      databaseName,
      droppedTables: tables,
      message: `Rolled back ${migration.id}.`,
      migrations: [{ id: migration.id, status: "rolled_back" }],
      scope: "master",
    };
  } catch (error) {
    await finishRunRecord(db, runId, "failed", null, errorMessage(error));
    throw error;
  }
}
