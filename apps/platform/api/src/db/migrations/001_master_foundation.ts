import type { Migration } from "../migration-runner.js";

export const migration: Migration = {
  id: "001_master_foundation",
  description: "Foundation master database tables",
  up: async (db) => {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS super_admin_users (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        display_name VARCHAR(120) NOT NULL,
        email VARCHAR(190) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS staff_users (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        display_name VARCHAR(120) NOT NULL,
        email VARCHAR(190) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS tenants (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        tenant_code VARCHAR(80) NOT NULL UNIQUE,
        tenant_name VARCHAR(180) NOT NULL,
        corporate_id VARCHAR(120) NULL UNIQUE,
        mobile VARCHAR(30) NULL,
        slug VARCHAR(120) NOT NULL UNIQUE,
        payload_settings JSON NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS tenant_databases (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        tenant_id BIGINT UNSIGNED NOT NULL,
        db_type VARCHAR(40) NOT NULL DEFAULT 'mariadb',
        db_host VARCHAR(190) NOT NULL DEFAULT 'localhost',
        db_port INT NOT NULL DEFAULT 3306,
        database_name VARCHAR(120) NOT NULL UNIQUE,
        db_user VARCHAR(120) NOT NULL DEFAULT 'root',
        db_secret_ref VARCHAR(120) NOT NULL DEFAULT 'DB_PASSWORD',
        status VARCHAR(30) NOT NULL DEFAULT 'ready',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_tenant_databases_tenant (tenant_id),
        CONSTRAINT fk_tenant_databases_tenant
          FOREIGN KEY (tenant_id) REFERENCES tenants(id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS tenant_domain_mappings (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        tenant_id BIGINT UNSIGNED NOT NULL,
        domain_name VARCHAR(190) NOT NULL UNIQUE,
        landing_app VARCHAR(80) NULL,
        is_primary TINYINT(1) NOT NULL DEFAULT 0,
        status VARCHAR(30) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_domain_mappings_tenant
          FOREIGN KEY (tenant_id) REFERENCES tenants(id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS tenant_subscriptions (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        tenant_id BIGINT UNSIGNED NOT NULL,
        plan_name VARCHAR(120) NOT NULL,
        billing_cycle VARCHAR(40) NOT NULL DEFAULT 'Monthly',
        seats INT NOT NULL DEFAULT 1,
        starts_on DATE NULL,
        renews_on DATE NULL,
        amount DECIMAL(12,2) NULL,
        currency VARCHAR(8) NOT NULL DEFAULT 'INR',
        status VARCHAR(30) NOT NULL DEFAULT 'active',
        notes TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY ix_tenant_subscriptions_tenant (tenant_id),
        CONSTRAINT fk_tenant_subscriptions_tenant
          FOREIGN KEY (tenant_id) REFERENCES tenants(id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        plan_name VARCHAR(120) NOT NULL UNIQUE,
        billing_cycle VARCHAR(40) NOT NULL DEFAULT 'Monthly',
        seats INT NOT NULL DEFAULT 1,
        amount DECIMAL(12,2) NULL,
        currency VARCHAR(8) NOT NULL DEFAULT 'INR',
        status VARCHAR(30) NOT NULL DEFAULT 'active',
        description TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  }
};
