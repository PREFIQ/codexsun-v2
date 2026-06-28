import { createDatabaseConnector } from "@codexsun/framework/db";
import { env } from "../env.js";
import { hashPassword } from "../security/password.js";

type DbStatus = {
  masterDatabase: string;
  ready: boolean;
  tenantTestDatabase: string;
};

const superAdmin = {
  displayName: "SUNDAR",
  email: "sundar@sundar.com",
  password: "Kalarani1@@"
};

const tenantAdmin = {
  email: "admin@tenant.com",
  password: "admin@123"
};

const staffAdmin = {
  displayName: "Staff Admin",
  email: "admin@codexsun.com",
  password: "admin@123"
};

export async function createServerConnection(database?: string) {
  const connector = createDatabaseConnector({
    driver: env.DB_DRIVER,
    host: env.DB_HOST,
    password: env.DB_PASSWORD,
    port: env.DB_PORT,
    user: env.DB_USER
  });

  return database ? connector.connect({ database }) : connector.connect();
}

export async function bootstrapDatabases(): Promise<DbStatus> {
  const server = await createServerConnection();

  await server.execute(`CREATE DATABASE IF NOT EXISTS \`${env.DB_MASTER_NAME}\``);
  await server.execute(`CREATE DATABASE IF NOT EXISTS \`${env.TENANT_TEST_DB_NAME}\``);
  await server.end();

  await migrateMasterDatabase();
  await migrateTenantDatabase();

  return {
    masterDatabase: env.DB_MASTER_NAME,
    ready: true,
    tenantTestDatabase: env.TENANT_TEST_DB_NAME
  };
}

async function migrateMasterDatabase() {
  const db = await createServerConnection(env.DB_MASTER_NAME);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS platform_migrations (
      id VARCHAR(80) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

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
      status VARCHAR(30) NOT NULL DEFAULT 'active',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tenant_databases (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      tenant_id BIGINT UNSIGNED NOT NULL,
      database_name VARCHAR(120) NOT NULL UNIQUE,
      status VARCHAR(30) NOT NULL DEFAULT 'ready',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_tenant_databases_tenant
        FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tenant_domain_mappings (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      tenant_id BIGINT UNSIGNED NOT NULL,
      domain_name VARCHAR(190) NOT NULL UNIQUE,
      status VARCHAR(30) NOT NULL DEFAULT 'active',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_domain_mappings_tenant
        FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS audit_events (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      actor_type VARCHAR(40) NOT NULL,
      actor_email VARCHAR(190) NULL,
      event_name VARCHAR(120) NOT NULL,
      event_payload JSON NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(
    `
    INSERT INTO super_admin_users (display_name, email, password_hash)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
      display_name = VALUES(display_name),
      password_hash = VALUES(password_hash),
      status = 'active'
  `,
    [superAdmin.displayName, superAdmin.email, hashPassword(superAdmin.password, "codexsun-super-admin")]
  );

  await db.execute(
    `
    INSERT INTO staff_users (display_name, email, password_hash)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
      display_name = VALUES(display_name),
      password_hash = VALUES(password_hash),
      status = 'active'
  `,
    [staffAdmin.displayName, staffAdmin.email, hashPassword(staffAdmin.password, "codexsun-staff-admin")]
  );

  await db.execute(
    `
    INSERT INTO tenants (tenant_code, tenant_name)
    VALUES ('test', 'Test Tenant')
    ON DUPLICATE KEY UPDATE tenant_name = VALUES(tenant_name), status = 'active'
  `
  );

  const [tenantRows] = await db.execute<Array<{ id: number | string }>>(
    "SELECT id FROM tenants WHERE tenant_code = 'test' LIMIT 1"
  );
  const tenantId = Number(tenantRows[0]?.id);

  await db.execute(
    `
    INSERT INTO tenant_databases (tenant_id, database_name)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE tenant_id = VALUES(tenant_id), status = 'ready'
  `,
    [tenantId, env.TENANT_TEST_DB_NAME]
  );

  await db.execute(
    `
    INSERT INTO tenant_domain_mappings (tenant_id, domain_name)
    VALUES (?, 'test.localhost')
    ON DUPLICATE KEY UPDATE tenant_id = VALUES(tenant_id), status = 'active'
  `,
    [tenantId]
  );

  await db.execute(
    `
    INSERT INTO platform_migrations (id)
    VALUES ('001_master_foundation')
    ON DUPLICATE KEY UPDATE id = id
  `
  );

  await db.end();
}

async function migrateTenantDatabase() {
  const db = await createServerConnection(env.TENANT_TEST_DB_NAME);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tenant_migrations (
      id VARCHAR(80) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
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

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tenant_audit_events (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      actor_email VARCHAR(190) NULL,
      event_name VARCHAR(120) NOT NULL,
      event_payload JSON NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(
    `
    INSERT INTO tenant_users (display_name, email, password_hash, role_key)
    VALUES ('Tenant Admin', ?, ?, 'owner')
    ON DUPLICATE KEY UPDATE
      password_hash = VALUES(password_hash),
      role_key = 'owner',
      status = 'active'
  `,
    [tenantAdmin.email, hashPassword(tenantAdmin.password, "codexsun-tenant-admin")]
  );

  await db.execute(
    `
    INSERT INTO tenant_migrations (id)
    VALUES ('001_tenant_foundation')
    ON DUPLICATE KEY UPDATE id = id
  `
  );

  await db.end();
}
