import { createDatabaseConnector } from "@codexsun/framework/db";
import { hashPassword } from "@codexsun/platform/auth";
import { env } from "../env.js";
import { MigrationRunner } from "./migration-runner.js";
import { masterMigrations } from "./migrations/master-index.js";

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

  const runner = new MigrationRunner(db, "platform_migrations");
  await runner.initialize();
  await runner.runAll(masterMigrations);
  await repairMasterTenantSchema(db);

  if (hasSeedUser(env.SUPER_ADMIN_NAME, env.SUPER_ADMIN_EMAIL, env.SUPER_ADMIN_PASSWORD)) {
    await db.execute(
      `INSERT INTO super_admin_users (display_name, email, password_hash)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         display_name = VALUES(display_name),
         password_hash = VALUES(password_hash),
         status = 'active'`,
      [
        env.SUPER_ADMIN_NAME,
        env.SUPER_ADMIN_EMAIL,
        hashPassword(env.SUPER_ADMIN_PASSWORD, "codexsun-super-admin")
      ]
    );
  }

  if (hasSeedUser(env.SOFTWARE_ADMIN_NAME, env.SOFTWARE_ADMIN_EMAIL, env.SOFTWARE_ADMIN_PASSWORD)) {
    await db.execute(
      `INSERT INTO staff_users (display_name, email, password_hash)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         display_name = VALUES(display_name),
         password_hash = VALUES(password_hash),
         status = 'active'`,
      [
        env.SOFTWARE_ADMIN_NAME,
        env.SOFTWARE_ADMIN_EMAIL,
        hashPassword(env.SOFTWARE_ADMIN_PASSWORD, "codexsun-software-admin")
      ]
    );
  }

  await db.execute(
    `INSERT INTO tenants (tenant_code, tenant_name, corporate_id, mobile, slug, payload_settings)
     VALUES ('test', 'Test Tenant', 'TEST', '9655227738', 'test', ?)
     ON DUPLICATE KEY UPDATE
       tenant_name = VALUES(tenant_name),
       corporate_id = VALUES(corporate_id),
       mobile = VALUES(mobile),
       slug = VALUES(slug),
       payload_settings = VALUES(payload_settings),
       status = 'active'`,
    [JSON.stringify({ apps: { enabled: ["core", "business.billing"] } })]
  );

  const [tenantRows] = await db.execute<Array<{ id: number | string }>>(
    "SELECT id FROM tenants WHERE tenant_code = 'test' LIMIT 1"
  );
  const tenantId = Number(tenantRows[0]?.id);
  const seedTenantModuleKeys = ["core", "core.contact", "core.company", "core.product", "business.billing"];
  for (const moduleKey of seedTenantModuleKeys) {
    await db.execute(
      `INSERT INTO tenant_module_activation (tenant_id, module_key, status)
       VALUES (?, ?, 'enabled')
       ON DUPLICATE KEY UPDATE status = 'enabled'`,
      [tenantId, moduleKey]
    );
  }

  await db.execute(
    `INSERT INTO tenant_databases (tenant_id, db_type, db_host, db_port, database_name, db_user, db_secret_ref)
     VALUES (?, 'mariadb', 'localhost', 3306, ?, 'root', 'DB_PASSWORD')
     ON DUPLICATE KEY UPDATE
       tenant_id = VALUES(tenant_id),
       db_type = VALUES(db_type),
       db_host = VALUES(db_host),
       db_port = VALUES(db_port),
       db_user = VALUES(db_user),
       db_secret_ref = VALUES(db_secret_ref),
       status = 'ready'`,
    [tenantId, env.TENANT_TEST_DB_NAME]
  );

  await db.execute(
    `INSERT INTO tenant_domain_mappings (tenant_id, domain_name)
     VALUES (?, 'test.localhost')
     ON DUPLICATE KEY UPDATE tenant_id = VALUES(tenant_id), status = 'active'`,
    [tenantId]
  );

  await db.end();
}

type ServerConnection = Awaited<ReturnType<typeof createServerConnection>>;

async function repairMasterTenantSchema(db: ServerConnection) {
  await ensureColumn(db, "tenants", "corporate_id", "VARCHAR(120) NULL");
  await ensureColumn(db, "tenants", "mobile", "VARCHAR(30) NULL");
  await ensureColumn(db, "tenants", "slug", "VARCHAR(120) NULL");
  await ensureColumn(db, "tenants", "payload_settings", "JSON NULL");

  await db.execute(
    `UPDATE tenants
     SET slug = LOWER(REPLACE(tenant_code, ' ', '-'))
     WHERE slug IS NULL OR slug = ''`
  );
  await db.execute(
    `UPDATE tenants
     SET corporate_id = UPPER(REPLACE(tenant_code, '-', '_'))
     WHERE corporate_id IS NULL OR corporate_id = ''`
  );
  await db.execute(
    `UPDATE tenants
     SET payload_settings = ?
     WHERE payload_settings IS NULL`,
    [JSON.stringify({ apps: { enabled: ["core", "business.billing"] } })]
  );
  await db.execute("ALTER TABLE tenants MODIFY slug VARCHAR(120) NOT NULL");

  await ensureIndex(db, "tenants", "uq_tenants_corporate_id", "UNIQUE KEY uq_tenants_corporate_id (corporate_id)");
  await ensureIndex(db, "tenants", "uq_tenants_slug", "UNIQUE KEY uq_tenants_slug (slug)");

  await ensureColumn(db, "tenant_databases", "db_type", "VARCHAR(40) NOT NULL DEFAULT 'mariadb'");
  await ensureColumn(db, "tenant_databases", "db_host", "VARCHAR(190) NOT NULL DEFAULT 'localhost'");
  await ensureColumn(db, "tenant_databases", "db_port", "INT NOT NULL DEFAULT 3306");
  await ensureColumn(db, "tenant_databases", "db_user", "VARCHAR(120) NOT NULL DEFAULT 'root'");
  await ensureColumn(db, "tenant_databases", "db_secret_ref", "VARCHAR(120) NOT NULL DEFAULT 'DB_PASSWORD'");
  await ensureColumn(db, "tenant_databases", "updated_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
  await ensureIndex(db, "tenant_databases", "uq_tenant_databases_tenant", "UNIQUE KEY uq_tenant_databases_tenant (tenant_id)");

  await ensureColumn(db, "tenant_domain_mappings", "landing_app", "VARCHAR(80) NULL");
  await ensureColumn(db, "tenant_domain_mappings", "is_primary", "TINYINT(1) NOT NULL DEFAULT 0");
  await ensureColumn(db, "tenant_domain_mappings", "updated_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

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
  await ensureColumn(db, "tenant_subscriptions", "billing_cycle", "VARCHAR(40) NOT NULL DEFAULT 'Monthly'");
  await ensureColumn(db, "tenant_subscriptions", "seats", "INT NOT NULL DEFAULT 1");
  await ensureColumn(db, "tenant_subscriptions", "starts_on", "DATE NULL");
  await ensureColumn(db, "tenant_subscriptions", "renews_on", "DATE NULL");
  await ensureColumn(db, "tenant_subscriptions", "amount", "DECIMAL(12,2) NULL");
  await ensureColumn(db, "tenant_subscriptions", "currency", "VARCHAR(8) NOT NULL DEFAULT 'INR'");
  await ensureColumn(db, "tenant_subscriptions", "notes", "TEXT NULL");
  await ensureColumn(db, "tenant_subscriptions", "updated_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
  await ensureIndex(db, "tenant_subscriptions", "ix_tenant_subscriptions_tenant", "KEY ix_tenant_subscriptions_tenant (tenant_id)");

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
  await ensureColumn(db, "subscription_plans", "billing_cycle", "VARCHAR(40) NOT NULL DEFAULT 'Monthly'");
  await ensureColumn(db, "subscription_plans", "seats", "INT NOT NULL DEFAULT 1");
  await ensureColumn(db, "subscription_plans", "amount", "DECIMAL(12,2) NULL");
  await ensureColumn(db, "subscription_plans", "currency", "VARCHAR(8) NOT NULL DEFAULT 'INR'");
  await ensureColumn(db, "subscription_plans", "description", "TEXT NULL");
  await ensureColumn(db, "subscription_plans", "updated_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS platform_modules (
      module_key VARCHAR(80) NOT NULL PRIMARY KEY,
      display_name VARCHAR(180) NOT NULL,
      scope VARCHAR(30) NOT NULL DEFAULT 'platform',
      version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
      default_enabled TINYINT(1) NOT NULL DEFAULT 0,
      status VARCHAR(30) NOT NULL DEFAULT 'active',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  await ensureColumn(db, "platform_modules", "default_enabled", "TINYINT(1) NOT NULL DEFAULT 0");
  await ensureColumn(db, "platform_modules", "status", "VARCHAR(30) NOT NULL DEFAULT 'active'");
  await ensureColumn(db, "platform_modules", "updated_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS platform_industries (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      industry_name VARCHAR(160) NOT NULL,
      industry_code VARCHAR(80) NOT NULL UNIQUE,
      segment VARCHAR(80) NOT NULL DEFAULT 'General',
      default_template VARCHAR(180) NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'active',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  await ensureColumn(db, "platform_industries", "segment", "VARCHAR(80) NOT NULL DEFAULT 'General'");
  await ensureColumn(db, "platform_industries", "default_template", "VARCHAR(180) NULL");
  await ensureColumn(db, "platform_industries", "status", "VARCHAR(30) NOT NULL DEFAULT 'active'");
  await ensureColumn(db, "platform_industries", "updated_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
}

async function ensureColumn(db: ServerConnection, tableName: string, columnName: string, definition: string) {
  const [rows] = await db.execute<Array<{ found: number }>>(
    `SELECT COUNT(*) AS found
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );

  if (Number(rows[0]?.found ?? 0) === 0) {
    await db.execute(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`);
  }
}

async function ensureIndex(db: ServerConnection, tableName: string, indexName: string, definition: string) {
  const [rows] = await db.execute<Array<{ found: number }>>(
    `SELECT COUNT(*) AS found
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND INDEX_NAME = ?`,
    [tableName, indexName]
  );

  if (Number(rows[0]?.found ?? 0) === 0) {
    try {
      await db.execute(`ALTER TABLE \`${tableName}\` ADD ${definition}`);
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      if (code !== "ER_DUP_KEYNAME" && code !== "ER_DUP_ENTRY") {
        throw error;
      }
    }
  }
}

async function migrateTenantDatabase() {
  const db = await createServerConnection(env.TENANT_TEST_DB_NAME);

  const runner = new MigrationRunner(db, "tenant_migrations");
  await runner.initialize();

  const tenantFoundationMigration = {
    id: "001_tenant_foundation",
    description: "Foundation tenant database tables",
    up: async (conn: typeof db) => {
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

  await runner.run(tenantFoundationMigration);

  if (hasSeedUser(env.TENANT_ADMIN_NAME, env.TENANT_ADMIN_EMAIL, env.TENANT_ADMIN_PASSWORD)) {
    await db.execute(
      `INSERT INTO tenant_users (display_name, email, password_hash, role_key)
       VALUES (?, ?, ?, 'owner')
       ON DUPLICATE KEY UPDATE
         display_name = VALUES(display_name),
         password_hash = VALUES(password_hash),
         role_key = 'owner',
         status = 'active'`,
      [
        env.TENANT_ADMIN_NAME,
        env.TENANT_ADMIN_EMAIL,
        hashPassword(env.TENANT_ADMIN_PASSWORD, "codexsun-tenant-admin")
      ]
    );
  }

  await db.end();
}

function hasSeedUser(name: string, email: string, password: string) {
  return Boolean(name.trim() && email.trim() && password.trim());
}
