export type BillingMigrationConnection = {
  execute: (sql: string, params?: unknown[]) => Promise<unknown>;
};

export type BillingMigration = {
  id: string;
  description: string;
  up: (db: BillingMigrationConnection) => Promise<void>;
};
