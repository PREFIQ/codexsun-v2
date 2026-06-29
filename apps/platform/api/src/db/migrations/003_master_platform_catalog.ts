import type { Migration } from "../migration-runner.js";

export const migration: Migration = {
  id: "003_master_platform_catalog",
  description: "Platform module catalog and tenant module activation tables",
  up: async (db) => {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS platform_modules (
        module_key VARCHAR(80) NOT NULL PRIMARY KEY,
        display_name VARCHAR(180) NOT NULL,
        scope VARCHAR(30) NOT NULL DEFAULT 'platform',
        version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS tenant_module_activation (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        tenant_id VARCHAR(80) NOT NULL,
        module_key VARCHAR(80) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'disabled',
        limits JSON NULL,
        provider_config JSON NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_tenant_module (tenant_id, module_key)
      )
    `);
  }
};
