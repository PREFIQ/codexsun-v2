import { createDatabaseConnector } from "@codexsun/framework/db";
import { hashPassword } from "@codexsun/platform/auth";
import { env } from "../env.js";

type DbStatus = {
  error?: {
    code: string;
    message: string;
    hint: string;
  };
  masterDatabase: string;
  ready: boolean;
  tenantTestDatabase: string;
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
  try {
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
  } catch (error) {
    return {
      error: describeDatabaseBootstrapError(error),
      masterDatabase: env.DB_MASTER_NAME,
      ready: false,
      tenantTestDatabase: env.TENANT_TEST_DB_NAME
    };
  }
}

export function describeDatabaseBootstrapError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const maybeCode =
    typeof error === "object" && error && "code" in error ? String(error.code) : "DB_BOOTSTRAP_FAILED";

  if (message.includes("auth_gssapi_client")) {
    return {
      code: "DB_AUTH_PLUGIN_UNSUPPORTED",
      message,
      hint: "MariaDB is asking for auth_gssapi_client. Create a normal password user such as codexsun_app, then set DB_USER and DB_PASSWORD to that account."
    };
  }

  if (maybeCode === "ER_ACCESS_DENIED_ERROR" || message.includes("Access denied")) {
    return {
      code: "DB_ACCESS_DENIED",
      message,
      hint: "The configured MariaDB username/password was rejected. Check DB_USER and DB_PASSWORD or run the database user setup helper."
    };
  }

  return {
    code: maybeCode,
    message,
    hint: "MariaDB bootstrap failed. Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_DRIVER."
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
      tenant_id VARCHAR(80) NULL,
      event_name VARCHAR(120) NOT NULL,
      event_payload JSON NULL,
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

  if (hasSeedUser(env.SUPER_ADMIN_NAME, env.SUPER_ADMIN_EMAIL, env.SUPER_ADMIN_PASSWORD)) {
    await db.execute(
      `
      INSERT INTO super_admin_users (display_name, email, password_hash)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        display_name = VALUES(display_name),
        password_hash = VALUES(password_hash),
        status = 'active'
    `,
      [
        env.SUPER_ADMIN_NAME,
        env.SUPER_ADMIN_EMAIL,
        hashPassword(env.SUPER_ADMIN_PASSWORD, "codexsun-super-admin")
      ]
    );
  }

  if (hasSeedUser(env.SOFTWARE_ADMIN_NAME, env.SOFTWARE_ADMIN_EMAIL, env.SOFTWARE_ADMIN_PASSWORD)) {
    await db.execute(
      `
      INSERT INTO staff_users (display_name, email, password_hash)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        display_name = VALUES(display_name),
        password_hash = VALUES(password_hash),
        status = 'active'
    `,
      [
        env.SOFTWARE_ADMIN_NAME,
        env.SOFTWARE_ADMIN_EMAIL,
        hashPassword(env.SOFTWARE_ADMIN_PASSWORD, "codexsun-software-admin")
      ]
    );
  }

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

  if (hasSeedUser(env.TENANT_ADMIN_NAME, env.TENANT_ADMIN_EMAIL, env.TENANT_ADMIN_PASSWORD)) {
    await db.execute(
      `
      INSERT INTO tenant_users (display_name, email, password_hash, role_key)
      VALUES (?, ?, ?, 'owner')
      ON DUPLICATE KEY UPDATE
        display_name = VALUES(display_name),
        password_hash = VALUES(password_hash),
        role_key = 'owner',
        status = 'active'
    `,
      [
        env.TENANT_ADMIN_NAME,
        env.TENANT_ADMIN_EMAIL,
        hashPassword(env.TENANT_ADMIN_PASSWORD, "codexsun-tenant-admin")
      ]
    );
  }

  await db.execute(
    `
    INSERT INTO tenant_migrations (id)
    VALUES ('001_tenant_foundation')
    ON DUPLICATE KEY UPDATE id = id
  `
  );

  await db.end();
}

function hasSeedUser(name: string, email: string, password: string) {
  return Boolean(name.trim() && email.trim() && password.trim());
}
