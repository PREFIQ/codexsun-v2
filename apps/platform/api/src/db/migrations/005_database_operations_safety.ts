import type { Migration } from "../migration-runner.js";

export const migration: Migration = {
  id: "005_database_operations_safety",
  description: "Database operation safety metadata for migrations, backups, mirroring, and legacy imports",
  up: async (db) => {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS database_versions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        scope VARCHAR(30) NOT NULL,
        tenant_id BIGINT UNSIGNED NULL,
        database_name VARCHAR(120) NOT NULL,
        app_version VARCHAR(40) NOT NULL DEFAULT 'unknown',
        database_version VARCHAR(80) NOT NULL DEFAULT 'unversioned',
        last_migration_id VARCHAR(80) NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'current',
        checked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_database_versions_target (scope, database_name),
        INDEX ix_database_versions_tenant (tenant_id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS database_migration_runs (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        scope VARCHAR(30) NOT NULL,
        tenant_id BIGINT UNSIGNED NULL,
        database_name VARCHAR(120) NOT NULL,
        migration_id VARCHAR(80) NOT NULL,
        checksum VARCHAR(128) NOT NULL,
        app_version VARCHAR(40) NOT NULL DEFAULT 'unknown',
        database_version_before VARCHAR(80) NULL,
        database_version_after VARCHAR(80) NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'pending',
        backup_run_id BIGINT UNSIGNED NULL,
        actor_user_id VARCHAR(120) NULL,
        error_message TEXT NULL,
        log_path VARCHAR(500) NULL,
        started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        finished_at TIMESTAMP NULL,
        INDEX ix_database_migration_runs_target (scope, tenant_id, database_name),
        INDEX ix_database_migration_runs_status (status)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS database_backup_runs (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        scope VARCHAR(30) NOT NULL,
        tenant_id BIGINT UNSIGNED NULL,
        database_name VARCHAR(120) NOT NULL,
        backup_type VARCHAR(40) NOT NULL DEFAULT 'manual',
        storage_uri VARCHAR(500) NULL,
        checksum VARCHAR(128) NULL,
        size_bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
        encrypted TINYINT(1) NOT NULL DEFAULT 1,
        verified TINYINT(1) NOT NULL DEFAULT 0,
        status VARCHAR(30) NOT NULL DEFAULT 'requested',
        actor_user_id VARCHAR(120) NULL,
        error_message TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        finished_at TIMESTAMP NULL,
        INDEX ix_database_backup_runs_target (scope, tenant_id, database_name),
        INDEX ix_database_backup_runs_status (status)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS database_restore_tests (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        backup_run_id BIGINT UNSIGNED NULL,
        scope VARCHAR(30) NOT NULL,
        tenant_id BIGINT UNSIGNED NULL,
        source_database VARCHAR(120) NOT NULL,
        target_database VARCHAR(120) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'requested',
        validation_summary JSON NULL,
        actor_user_id VARCHAR(120) NULL,
        error_message TEXT NULL,
        started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        finished_at TIMESTAMP NULL,
        INDEX ix_database_restore_tests_backup (backup_run_id),
        INDEX ix_database_restore_tests_status (status)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS database_mirror_health (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        server_name VARCHAR(120) NOT NULL,
        source_database VARCHAR(120) NOT NULL,
        target_database VARCHAR(120) NOT NULL,
        last_sync_at TIMESTAMP NULL,
        last_success_at TIMESTAMP NULL,
        lag_seconds INT NOT NULL DEFAULT 0,
        status VARCHAR(30) NOT NULL DEFAULT 'unknown',
        error_message TEXT NULL,
        checked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_database_mirror_health_target (server_name, source_database, target_database)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS legacy_import_mappings (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        client_key VARCHAR(120) NOT NULL,
        source_table VARCHAR(120) NOT NULL,
        source_column VARCHAR(120) NOT NULL,
        target_module VARCHAR(120) NOT NULL,
        target_table VARCHAR(120) NOT NULL,
        target_column VARCHAR(120) NOT NULL,
        transform_rule TEXT NULL,
        conflict_rule VARCHAR(120) NOT NULL DEFAULT 'report',
        validation_rule TEXT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'draft',
        created_by VARCHAR(120) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX ix_legacy_import_mappings_client (client_key)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS legacy_import_batches (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        client_key VARCHAR(120) NOT NULL,
        tenant_id BIGINT UNSIGNED NULL,
        mode VARCHAR(40) NOT NULL DEFAULT 'dry_run',
        status VARCHAR(30) NOT NULL DEFAULT 'requested',
        source_row_count INT NOT NULL DEFAULT 0,
        created_count INT NOT NULL DEFAULT 0,
        updated_count INT NOT NULL DEFAULT 0,
        skipped_count INT NOT NULL DEFAULT 0,
        failed_count INT NOT NULL DEFAULT 0,
        actor_user_id VARCHAR(120) NULL,
        summary JSON NULL,
        error_message TEXT NULL,
        started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        finished_at TIMESTAMP NULL,
        INDEX ix_legacy_import_batches_client (client_key),
        INDEX ix_legacy_import_batches_tenant (tenant_id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS legacy_import_row_results (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        batch_id BIGINT UNSIGNED NOT NULL,
        source_system VARCHAR(120) NOT NULL,
        source_table VARCHAR(120) NOT NULL,
        source_id VARCHAR(190) NOT NULL,
        target_table VARCHAR(120) NULL,
        target_id VARCHAR(190) NULL,
        status VARCHAR(30) NOT NULL,
        message TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_legacy_import_row_source (batch_id, source_system, source_table, source_id),
        INDEX ix_legacy_import_row_results_batch (batch_id)
      )
    `);
  }
};
