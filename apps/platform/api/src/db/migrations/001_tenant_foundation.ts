import type { Migration } from "../migration-runner.js";

export const migration: Migration = {
  id: "001_tenant_foundation",
  description: "Foundation tenant database tables",
  up: async (conn) => {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS tenant_users (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        display_name VARCHAR(120) NOT NULL,
        email VARCHAR(190) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role_key VARCHAR(80) NOT NULL DEFAULT 'owner',
        status VARCHAR(30) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS tenant_audit_events (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        actor_email VARCHAR(190) NULL,
        event_name VARCHAR(120) NOT NULL,
        event_payload JSON NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
};
