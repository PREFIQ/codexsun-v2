import { createDatabaseConnector } from "@codexsun/framework/db";
import { hashPassword } from "@codexsun/platform/auth";
import { env } from "../env.js";
import { MigrationRunner } from "./migration-runner.js";
import { masterMigrations } from "./migrations/master-index.js";
import { tenantMigrations } from "./migrations/tenant-index.js";

const COMMON_DEFAULT_RECORD_ID = "common-default-dash";
const COMMON_DEFAULT_CREATED_AT = "2000-01-01T00:00:00.000Z";
const COMMON_DEFAULT_CREATED_AT_SQL = "2000-01-01 00:00:00";
const COMMON_DEFAULT_MODULE_KEYS = Array.from(
  new Set([
    "countries",
    "states",
    "districts",
    "cities",
    "pincodes",
    "contact-groups",
    "contact-types",
    "company-groups",
    "address-types",
    "bank-names",
    "bank-account-types",
    "product-groups",
    "product-categories",
    "product-types",
    "units",
    "hsn-codes",
    "taxes",
    "brands",
    "colours",
    "sizes",
    "styles",
    "order-types",
    "transports",
    "warehouses",
    "destinations",
    "stock-rejection-types",
    "currencies",
    "priorities",
    "payment-terms",
    "accounting-year",
    "months",
    "sales-account-types",
    "address-book",
    "contact-emails",
    "contact-phones",
    "contact-social-links",
    "contact-bank-accounts",
    "contact-gst-details",
    "company-logos",
    "company-emails",
    "company-phones",
    "company-social-links",
    "company-bank-accounts",
    "work-orders",
    "sales",
    "quotations",
    "purchases",
    "receipts",
    "payments",
    "purchase-receipts",
    "delivery-notes",
    "stock-ledger",
    "mail",
    "tasks",
    "media-assets",
    "site-sliders",
    "blog",
    "company-settings",
    "document-settings"
  ])
);

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

export async function migrateMasterDatabase() {
  const db = await createServerConnection(env.DB_MASTER_NAME);

  const runner = new MigrationRunner(db, "platform_migrations");
  await runner.initialize();
  await runner.runAll(masterMigrations);
  await repairMasterTenantSchema(db);

  if (hasSeedUser(env.SUPER_ADMIN_NAME, env.SUPER_ADMIN_EMAIL, env.SUPER_ADMIN_PASSWORD)) {
    await db.execute(
      `INSERT IGNORE INTO super_admin_users (display_name, email, password_hash)
       VALUES (?, ?, ?)`,
      [
        env.SUPER_ADMIN_NAME,
        env.SUPER_ADMIN_EMAIL,
        hashPassword(env.SUPER_ADMIN_PASSWORD, "codexsun-super-admin")
      ]
    );
  }

  if (hasSeedUser(env.SOFTWARE_ADMIN_NAME, env.SOFTWARE_ADMIN_EMAIL, env.SOFTWARE_ADMIN_PASSWORD)) {
    await db.execute(
      `INSERT IGNORE INTO staff_users (display_name, email, password_hash)
       VALUES (?, ?, ?)`,
      [
        env.SOFTWARE_ADMIN_NAME,
        env.SOFTWARE_ADMIN_EMAIL,
        hashPassword(env.SOFTWARE_ADMIN_PASSWORD, "codexsun-software-admin")
      ]
    );
  }

  await db.execute(
    `INSERT IGNORE INTO tenants (tenant_code, tenant_name, corporate_id, mobile, slug, payload_settings)
     VALUES ('test', 'Test Tenant', 'TEST', '9655227738', 'test', ?)`,
    [JSON.stringify({ apps: { enabled: ["core", "business.billing"] } })]
  );

  const [tenantRows] = await db.execute<Array<{ id: number | string }>>(
    "SELECT id FROM tenants WHERE tenant_code = 'test' LIMIT 1"
  );
  const tenantId = Number(tenantRows[0]?.id);
  const seedTenantModuleKeys = ["core", "core.contact", "core.company", "core.product", "business.billing"];
  for (const moduleKey of seedTenantModuleKeys) {
    await db.execute(
      `INSERT IGNORE INTO tenant_module_activation (tenant_id, module_key, status)
       VALUES (?, ?, 'enabled')`,
      [tenantId, moduleKey]
    );
  }

  await db.execute(
    `INSERT INTO tenant_databases (tenant_id, db_type, db_host, db_port, database_name, db_user, db_secret_ref)
     VALUES (?, 'mariadb', 'localhost', 3306, ?, 'root', 'DB_PASSWORD')
     ON DUPLICATE KEY UPDATE tenant_id = tenant_id`,
    [tenantId, env.TENANT_TEST_DB_NAME]
  );

  await db.execute(
    `INSERT INTO tenant_domain_mappings (tenant_id, domain_name)
     VALUES (?, 'test.localhost')
     ON DUPLICATE KEY UPDATE tenant_id = tenant_id`,
    [tenantId]
  );

  await seedCommonDefaultRecords(db);

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

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tenant_common_records (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      tenant_id VARCHAR(120) NOT NULL,
      module_key VARCHAR(120) NOT NULL,
      record_id VARCHAR(80) NOT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      payload_json JSON NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      UNIQUE KEY uq_tenant_common_records_record (tenant_id, module_key, record_id),
      KEY ix_tenant_common_records_module (tenant_id, module_key),
      KEY ix_tenant_common_records_active (tenant_id, module_key, is_active)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tenant_contacts (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      tenant_id VARCHAR(120) NOT NULL,
      contact_id VARCHAR(80) NOT NULL,
      code VARCHAR(80) NOT NULL,
      name VARCHAR(180) NOT NULL,
      contact_type_id VARCHAR(80) NULL,
      contact_group_id VARCHAR(80) NULL,
      ledger_id VARCHAR(80) NULL,
      ledger_name VARCHAR(180) NULL,
      legal_name VARCHAR(180) NULL,
      pan VARCHAR(40) NULL,
      gstin VARCHAR(40) NULL,
      msme_type VARCHAR(40) NULL,
      msme_no VARCHAR(80) NULL,
      tan VARCHAR(40) NULL,
      tds_available TINYINT(1) NOT NULL DEFAULT 0,
      tcs_available TINYINT(1) NOT NULL DEFAULT 0,
      opening_balance DECIMAL(14,2) NOT NULL DEFAULT 0,
      balance_type VARCHAR(40) NULL,
      credit_limit DECIMAL(14,2) NOT NULL DEFAULT 0,
      website VARCHAR(220) NULL,
      primary_email VARCHAR(190) NULL,
      primary_phone VARCHAR(50) NULL,
      description TEXT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'active',
      created_by VARCHAR(190) NOT NULL,
      updated_by VARCHAR(190) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      UNIQUE KEY uq_tenant_contacts_contact (tenant_id, contact_id),
      UNIQUE KEY uq_tenant_contacts_code (tenant_id, code),
      KEY ix_tenant_contacts_name (tenant_id, name),
      KEY ix_tenant_contacts_status (tenant_id, status)
    )
  `);
  await ensureColumn(db, "tenant_contacts", "contact_group_id", "VARCHAR(80) NULL");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tenant_contact_code_sequences (
      tenant_id VARCHAR(120) NOT NULL PRIMARY KEY,
      next_number INT UNSIGNED NOT NULL DEFAULT 1,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tenant_contact_emails (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      tenant_id VARCHAR(120) NOT NULL,
      contact_id VARCHAR(80) NOT NULL,
      uuid VARCHAR(80) NOT NULL,
      email VARCHAR(190) NOT NULL,
      email_type VARCHAR(40) NULL,
      is_primary TINYINT(1) NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY ix_tenant_contact_emails_contact (tenant_id, contact_id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tenant_contact_phones (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      tenant_id VARCHAR(120) NOT NULL,
      contact_id VARCHAR(80) NOT NULL,
      uuid VARCHAR(80) NOT NULL,
      phone_number VARCHAR(50) NOT NULL,
      phone_type VARCHAR(40) NULL,
      is_primary TINYINT(1) NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY ix_tenant_contact_phones_contact (tenant_id, contact_id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tenant_contact_addresses (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      tenant_id VARCHAR(120) NOT NULL,
      contact_id VARCHAR(80) NOT NULL,
      uuid VARCHAR(80) NOT NULL,
      address_type_id VARCHAR(80) NULL,
      address_line1 VARCHAR(240) NULL,
      address_line2 VARCHAR(240) NULL,
      country_id VARCHAR(80) NULL,
      state_id VARCHAR(80) NULL,
      district_id VARCHAR(80) NULL,
      city_id VARCHAR(80) NULL,
      pincode_id VARCHAR(80) NULL,
      latitude DECIMAL(12,8) NULL,
      longitude DECIMAL(12,8) NULL,
      is_default TINYINT(1) NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY ix_tenant_contact_addresses_contact (tenant_id, contact_id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tenant_contact_bank_accounts (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      tenant_id VARCHAR(120) NOT NULL,
      contact_id VARCHAR(80) NOT NULL,
      uuid VARCHAR(80) NOT NULL,
      bank_name VARCHAR(180) NULL,
      account_number VARCHAR(80) NULL,
      account_type_id VARCHAR(80) NULL,
      account_holder_name VARCHAR(180) NULL,
      ifsc VARCHAR(40) NULL,
      branch VARCHAR(180) NULL,
      is_primary TINYINT(1) NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY ix_tenant_contact_bank_accounts_contact (tenant_id, contact_id)
    )
  `);
  await ensureColumn(db, "tenant_contact_bank_accounts", "account_type_id", "VARCHAR(80) NULL");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tenant_products (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      tenant_id VARCHAR(120) NOT NULL,
      item_id VARCHAR(80) NOT NULL,
      code VARCHAR(80) NOT NULL,
      name VARCHAR(220) NOT NULL,
      product_type_id VARCHAR(80) NULL,
      hsn_code_id VARCHAR(80) NULL,
      unit_id VARCHAR(80) NULL,
      tax_id VARCHAR(80) NULL,
      image_url LONGTEXT NULL,
      opening_stock DECIMAL(14,3) NOT NULL DEFAULT 0,
      opening_price DECIMAL(14,2) NOT NULL DEFAULT 0,
      status VARCHAR(30) NOT NULL DEFAULT 'active',
      created_by VARCHAR(190) NOT NULL,
      updated_by VARCHAR(190) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      UNIQUE KEY uq_tenant_products_item (tenant_id, item_id),
      UNIQUE KEY uq_tenant_products_code (tenant_id, code),
      KEY ix_tenant_products_name (tenant_id, name),
      KEY ix_tenant_products_status (tenant_id, status)
    )
  `);
  await ensureColumn(db, "tenant_products", "product_type_id", "VARCHAR(80) NULL");
  await ensureColumn(db, "tenant_products", "hsn_code_id", "VARCHAR(80) NULL");
  await ensureColumn(db, "tenant_products", "unit_id", "VARCHAR(80) NULL");
  await ensureColumn(db, "tenant_products", "tax_id", "VARCHAR(80) NULL");
  await ensureColumn(db, "tenant_products", "image_url", "LONGTEXT NULL");
  await ensureColumn(db, "tenant_products", "opening_stock", "DECIMAL(14,3) NOT NULL DEFAULT 0");
  await ensureColumn(db, "tenant_products", "opening_price", "DECIMAL(14,2) NOT NULL DEFAULT 0");
  await ensureColumn(db, "tenant_products", "updated_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
  await ensureColumn(db, "tenant_products", "deleted_at", "TIMESTAMP NULL");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tenant_contact_social_links (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      tenant_id VARCHAR(120) NOT NULL,
      contact_id VARCHAR(80) NOT NULL,
      uuid VARCHAR(80) NOT NULL,
      platform VARCHAR(80) NOT NULL,
      url VARCHAR(240) NOT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY ix_tenant_contact_social_links_contact (tenant_id, contact_id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tenant_contact_gst_details (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      tenant_id VARCHAR(120) NOT NULL,
      contact_id VARCHAR(80) NOT NULL,
      uuid VARCHAR(80) NOT NULL,
      gstin VARCHAR(40) NOT NULL,
      state VARCHAR(80) NULL,
      is_default TINYINT(1) NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY ix_tenant_contact_gst_details_contact (tenant_id, contact_id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tenant_companies (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      tenant_id VARCHAR(120) NOT NULL,
      company_id VARCHAR(80) NOT NULL,
      legal_name VARCHAR(180) NOT NULL,
      trade_name VARCHAR(180) NULL,
      company_group_id VARCHAR(80) NULL,
      website VARCHAR(220) NULL,
      logo_url LONGTEXT NULL,
      logo_dark_url LONGTEXT NULL,
      favicon_url LONGTEXT NULL,
      notes TEXT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'active',
      created_by VARCHAR(190) NOT NULL,
      updated_by VARCHAR(190) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      UNIQUE KEY uq_tenant_companies_company (tenant_id, company_id),
      KEY ix_tenant_companies_name (tenant_id, legal_name),
      KEY ix_tenant_companies_status (tenant_id, status)
    )
  `);
  await ensureColumn(db, "tenant_companies", "company_group_id", "VARCHAR(80) NULL");
  await ensureColumn(db, "tenant_companies", "logo_dark_url", "LONGTEXT NULL");
  await ensureColumn(db, "tenant_companies", "favicon_url", "LONGTEXT NULL");
  await db.execute("ALTER TABLE `tenant_companies` MODIFY COLUMN `logo_url` LONGTEXT NULL");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tenant_company_phones (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      tenant_id VARCHAR(120) NOT NULL,
      company_id VARCHAR(80) NOT NULL,
      phone_id VARCHAR(80) NOT NULL,
      label VARCHAR(80) NULL,
      phone_number VARCHAR(50) NOT NULL,
      is_primary TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY ix_tenant_company_phones_company (tenant_id, company_id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tenant_company_emails (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      tenant_id VARCHAR(120) NOT NULL,
      company_id VARCHAR(80) NOT NULL,
      email_id VARCHAR(80) NOT NULL,
      label VARCHAR(80) NULL,
      email_address VARCHAR(190) NOT NULL,
      is_primary TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY ix_tenant_company_emails_company (tenant_id, company_id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tenant_company_addresses (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      tenant_id VARCHAR(120) NOT NULL,
      company_id VARCHAR(80) NOT NULL,
      address_id VARCHAR(80) NOT NULL,
      label VARCHAR(80) NULL,
      line1 VARCHAR(240) NULL,
      line2 VARCHAR(240) NULL,
      country VARCHAR(120) NULL,
      state VARCHAR(120) NULL,
      district VARCHAR(120) NULL,
      city VARCHAR(120) NULL,
      pincode VARCHAR(80) NULL,
      gst_state_code VARCHAR(20) NULL,
      is_default TINYINT(1) NOT NULL DEFAULT 0,
      address_type VARCHAR(80) NOT NULL DEFAULT 'Registered',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY ix_tenant_company_addresses_company (tenant_id, company_id)
    )
  `);
  await db.execute("ALTER TABLE `tenant_company_addresses` MODIFY COLUMN `pincode` VARCHAR(80) NULL");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tenant_company_bank_accounts (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      tenant_id VARCHAR(120) NOT NULL,
      company_id VARCHAR(80) NOT NULL,
      account_id VARCHAR(80) NOT NULL,
      account_holder_name VARCHAR(180) NULL,
      account_number VARCHAR(80) NULL,
      account_type_id VARCHAR(80) NULL,
      ifsc_code VARCHAR(40) NULL,
      bank_name VARCHAR(180) NULL,
      branch_name VARCHAR(180) NULL,
      is_default TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY ix_tenant_company_bank_accounts_company (tenant_id, company_id)
    )
  `);
  await ensureColumn(db, "tenant_company_bank_accounts", "account_type_id", "VARCHAR(80) NULL");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS tenant_company_tax_identities (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      tenant_id VARCHAR(120) NOT NULL,
      company_id VARCHAR(80) NOT NULL,
      tax_id VARCHAR(80) NOT NULL,
      type VARCHAR(40) NOT NULL,
      tax_value VARCHAR(80) NOT NULL,
      is_default TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY ix_tenant_company_tax_identities_company (tenant_id, company_id)
    )
  `);
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

async function seedCommonDefaultRecords(db: ServerConnection) {
  const [tenantRows] = await db.execute<Array<{ id: number | string }>>("SELECT id FROM tenants");
  const now = new Date().toISOString();
  const nowSql = now.slice(0, 19).replace("T", " ");

  for (const tenant of tenantRows) {
    const tenantId = String(tenant.id);
    for (const moduleKey of COMMON_DEFAULT_MODULE_KEYS) {
      const payload = commonDefaultPayload(moduleKey, tenantId, now);
      await db.execute(
        `INSERT INTO tenant_common_records
           (tenant_id, module_key, record_id, is_active, payload_json, created_at, updated_at, deleted_at)
         VALUES (?, ?, ?, 1, ?, ?, ?, NULL)
         ON DUPLICATE KEY UPDATE
           is_active = 1,
           payload_json = VALUES(payload_json),
           created_at = VALUES(created_at),
           updated_at = VALUES(updated_at),
           deleted_at = NULL`,
        [
          tenantId,
          moduleKey,
          COMMON_DEFAULT_RECORD_ID,
          JSON.stringify(payload),
          COMMON_DEFAULT_CREATED_AT_SQL,
          nowSql
        ]
      );
    }
  }
}

function commonDefaultPayload(moduleKey: string, tenantId: string, updatedAt: string) {
  const base: Record<string, unknown> = {
    id: COMMON_DEFAULT_RECORD_ID,
    tenantId,
    name: "-",
    isActive: true,
    isDefault: true,
    isSystemDefault: true,
    createdAt: COMMON_DEFAULT_CREATED_AT,
    updatedAt
  };

  if (moduleKey === "countries") {
    return {
      ...base,
      code: "-",
      phoneCode: "-"
    };
  }

  if (moduleKey === "states") {
    return {
      ...base,
      code: "-",
      countryId: COMMON_DEFAULT_RECORD_ID
    };
  }

  if (moduleKey === "districts") {
    return {
      ...base,
      stateId: COMMON_DEFAULT_RECORD_ID
    };
  }

  if (moduleKey === "cities") {
    return {
      ...base,
      districtId: COMMON_DEFAULT_RECORD_ID
    };
  }

  if (moduleKey === "hsn-codes") {
    return {
      ...base,
      code: "-",
      description: "-"
    };
  }

  if (moduleKey === "taxes") {
    return {
      ...base,
      ratePercent: 0,
      description: "-"
    };
  }

  if (moduleKey === "priorities") {
    return {
      ...base,
      colour: "-",
      tag: "-"
    };
  }

  if (moduleKey === "accounting-year") {
    return {
      ...base,
      startDate: "-",
      endDate: "-",
      booksStart: "-",
      isCurrentYear: false
    };
  }

  return base;
}

export async function migrateTenantDatabase(databaseName = env.TENANT_TEST_DB_NAME) {
  const db = await createServerConnection(databaseName);

  const runner = new MigrationRunner(db, "tenant_migrations");
  await runner.initialize();
  await runner.runAll(tenantMigrations);

  if (hasSeedUser(env.TENANT_ADMIN_NAME, env.TENANT_ADMIN_EMAIL, env.TENANT_ADMIN_PASSWORD)) {
    await db.execute(
      `INSERT IGNORE INTO tenant_users (display_name, email, password_hash, role_key)
       VALUES (?, ?, ?, 'owner')`,
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
