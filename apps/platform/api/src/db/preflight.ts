import { env } from "../env.js";
import { bootstrapDatabases, createServerConnection } from "./bootstrap.js";
import { MigrationRunner } from "./migration-runner.js";
import { masterMigrations } from "./migrations/master-index.js";
import { tenantMigrations } from "./migrations/tenant-index.js";

type MigrationSummary = {
  applied: number;
  pending: string[];
  tableName: string;
  total: number;
};

function mark(ok: boolean) {
  return ok ? "ok" : "warn";
}

async function migrationSummary(databaseName: string, tableName: string, migrations: Array<{ id: string }>): Promise<MigrationSummary> {
  const db = await createServerConnection(databaseName);
  try {
    const runner = new MigrationRunner(db, tableName);
    await runner.initialize();
    const pending = runner.listPending(
      migrations.map((migration) => ({
        description: migration.id,
        id: migration.id,
        up: async () => {}
      }))
    );
    return {
      applied: runner.listApplied().length,
      pending: pending.map((migration) => migration.id),
      tableName,
      total: migrations.length
    };
  } finally {
    await db.end();
  }
}

async function run() {
  const startedAt = Date.now();
  console.log("  - Database bootstrap");
  const status = await bootstrapDatabases();

  if (!status.ready) {
    console.log(`  x Database not ready: ${status.error?.code ?? "DB_BOOTSTRAP_FAILED"}`);
    console.log(`    ${status.error?.message ?? "Unknown database error"}`);
    console.log(`    ${status.error?.hint ?? "Check database configuration."}`);
    process.exit(1);
  }

  const master = await migrationSummary(env.DB_MASTER_NAME, "platform_migrations", masterMigrations);
  const tenant = await migrationSummary(env.TENANT_TEST_DB_NAME, "tenant_migrations", tenantMigrations);
  const elapsedMs = Date.now() - startedAt;

  console.log(`  ok Master database: ${status.masterDatabase}`);
  console.log(`  ok Tenant test database: ${status.tenantTestDatabase}`);
  console.log(`  ${mark(master.pending.length === 0)} Platform migrations: ${master.applied}/${master.total} applied${master.pending.length ? `, pending ${master.pending.join(", ")}` : ""}`);
  console.log(`  ${mark(tenant.pending.length === 0)} Tenant migrations: ${tenant.applied}/${tenant.total} applied${tenant.pending.length ? `, pending ${tenant.pending.join(", ")}` : ""}`);
  console.log(`  ok Database preflight completed in ${elapsedMs}ms`);
}

await run();
