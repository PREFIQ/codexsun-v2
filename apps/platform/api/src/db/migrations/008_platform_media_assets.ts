import type { Migration } from "../migration-runner.js";

export const migration: Migration = {
  id: "008_platform_media_assets",
  description: "Platform and tenant media asset registry",
  up: async (db) => {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS platform_media_assets (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        asset_id VARCHAR(80) NOT NULL UNIQUE,
        scope VARCHAR(20) NOT NULL DEFAULT 'tenant',
        tenant_id VARCHAR(80) NULL,
        tenant_slug VARCHAR(120) NOT NULL,
        category VARCHAR(40) NOT NULL DEFAULT 'files',
        visibility VARCHAR(20) NOT NULL DEFAULT 'private',
        folder VARCHAR(240) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(160) NOT NULL,
        extension VARCHAR(20) NOT NULL,
        size_bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
        storage_path VARCHAR(600) NOT NULL,
        public_url VARCHAR(700) NULL,
        checksum VARCHAR(128) NULL,
        alt_text VARCHAR(240) NULL,
        caption VARCHAR(500) NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_by VARCHAR(190) NOT NULL,
        updated_by VARCHAR(190) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        KEY idx_platform_media_scope (scope, tenant_id, category, visibility),
        KEY idx_platform_media_storage (tenant_slug, visibility, folder)
      )
    `);
  }
};
