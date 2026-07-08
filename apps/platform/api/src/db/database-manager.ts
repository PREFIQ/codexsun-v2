import type { CompatibleDbConnection } from "@codexsun/framework/db";
import { env } from "../env.js";
import { createServerConnection } from "./bootstrap.js";
import { runMasterDatabaseCommand } from "./master-database-manager.js";
import { runTenantDatabaseCommandBatch, type TenantDatabaseCommandBatchResult, type TenantDatabaseCommandOptions } from "./tenant-database-manager.js";
import type { DatabaseCommand, DatabaseCommandOptions, DatabaseCommandResult } from "./database-manager.shared.js";

export type { DatabaseCommand, DatabaseCommandOptions, DatabaseCommandResult } from "./database-manager.shared.js";
export type { TenantDatabaseCommandBatchResult, TenantDatabaseCommandOptions } from "./tenant-database-manager.js";

export type DatabaseCommandScope = "master" | "tenant";

export type ScopedDatabaseCommandOptions = DatabaseCommandOptions & TenantDatabaseCommandOptions & {
  scope?: DatabaseCommandScope;
};

export type ScopedDatabaseCommandResult = DatabaseCommandResult | TenantDatabaseCommandBatchResult;

export async function runPlatformDatabaseCommand(
  db: CompatibleDbConnection,
  command: DatabaseCommand,
  options: ScopedDatabaseCommandOptions = {},
): Promise<ScopedDatabaseCommandResult> {
  if (options.scope === "tenant") return runTenantDatabaseCommandBatch(db, command, options);
  return runMasterDatabaseCommand(db, command, options);
}

export async function runPlatformDatabaseCommandFromCli(command: DatabaseCommand, options: ScopedDatabaseCommandOptions = {}) {
  const db = await createServerConnection(env.DB_MASTER_NAME);
  try {
    return await runPlatformDatabaseCommand(db, command, {
      ...options,
      actorEmail: options.actorEmail ?? "cli",
      databaseName: options.scope === "tenant" ? options.databaseName : env.DB_MASTER_NAME,
    });
  } finally {
    await db.end();
  }
}
