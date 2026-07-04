import type { CompatibleDbConnection } from "@codexsun/framework/db";

export type Migration = {
  id: string;
  description: string;
  up: (db: CompatibleDbConnection) => Promise<void>;
};

export class MigrationRunner {
  private readonly applied = new Set<string>();

  constructor(
    private readonly db: CompatibleDbConnection,
    private readonly tableName: string = "platform_migrations"
  ) {}

  async initialize(): Promise<void> {
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS \`${this.tableName}\` (
        id VARCHAR(80) PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const [rows] = await this.db.execute<Array<{ id: string }>>(
      `SELECT id FROM \`${this.tableName}\` ORDER BY id ASC`
    );
    for (const row of rows) {
      this.applied.add(row.id);
    }
  }

  isApplied(migrationId: string): boolean {
    return this.applied.has(migrationId);
  }

  async run(migration: Migration): Promise<boolean> {
    if (this.isApplied(migration.id)) {
      return false;
    }
    await migration.up(this.db);
    await this.db.execute(
      `INSERT IGNORE INTO \`${this.tableName}\` (id) VALUES (?)`,
      [migration.id]
    );
    this.applied.add(migration.id);
    return true;
  }

  async runAll(migrations: Migration[]): Promise<number> {
    let count = 0;
    for (const migration of migrations) {
      if (await this.run(migration)) {
        count++;
      }
    }
    return count;
  }

  listApplied(): string[] {
    return [...this.applied].sort();
  }

  listPending(migrations: Migration[]): Migration[] {
    return migrations.filter((m) => !this.isApplied(m.id));
  }
}
