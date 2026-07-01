import type { Migration } from "../migration-runner.js";

export const migration: Migration = {
  id: "006_platform_registry",
  description: "Project manager platform registry table",
  up: async (db) => {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS platform_registry (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(180) NOT NULL,
        platform VARCHAR(120) NOT NULL,
        description TEXT NULL,
        active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_platform_registry_platform_name (platform, name)
      )
    `);
  }
};
