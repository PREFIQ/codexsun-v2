import type { Migration } from "../migration-runner.js";

export const migration: Migration = {
  id: "002_master_audit_sessions",
  description: "Audit events and sessions tables",
  up: async (db) => {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS audit_events (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        actor_type VARCHAR(40) NOT NULL,
        actor_email VARCHAR(190) NULL,
        correlation_id VARCHAR(80) NULL,
        event_name VARCHAR(120) NOT NULL,
        event_payload JSON NULL,
        tenant_id VARCHAR(80) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        token VARCHAR(255) NOT NULL PRIMARY KEY,
        email VARCHAR(190) NOT NULL,
        user_type VARCHAR(50) NOT NULL,
        tenant_id VARCHAR(80) NULL,
        tenant_code VARCHAR(80) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL
      )
    `);
  }
};
