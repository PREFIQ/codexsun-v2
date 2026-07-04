import type { Migration } from "../migration-runner.js";

export const migration: Migration = {
  id: "010_tenant_entry_compliance",
  description: "Tenant entry e-invoice and e-way compliance fields",
  up: async (db) => {
    await db.execute("ALTER TABLE tenant_entry_documents ADD COLUMN IF NOT EXISTS irn VARCHAR(120) NULL");
    await db.execute("ALTER TABLE tenant_entry_documents ADD COLUMN IF NOT EXISTS ack_no VARCHAR(120) NULL");
    await db.execute("ALTER TABLE tenant_entry_documents ADD COLUMN IF NOT EXISTS ack_date DATE NULL");
    await db.execute("ALTER TABLE tenant_entry_documents ADD COLUMN IF NOT EXISTS signed_qr TEXT NULL");
    await db.execute("ALTER TABLE tenant_entry_documents ADD COLUMN IF NOT EXISTS eway_bill_no VARCHAR(120) NULL");
    await db.execute("ALTER TABLE tenant_entry_documents ADD COLUMN IF NOT EXISTS eway_bill_date DATE NULL");
    await db.execute("ALTER TABLE tenant_entry_documents ADD COLUMN IF NOT EXISTS transport_name VARCHAR(180) NULL");
    await db.execute("ALTER TABLE tenant_entry_documents ADD COLUMN IF NOT EXISTS vehicle_no VARCHAR(40) NULL");
    await db.execute("ALTER TABLE tenant_entry_documents ADD COLUMN IF NOT EXISTS eway_part VARCHAR(20) NULL");

    await db.execute(`
      CREATE TABLE IF NOT EXISTS tenant_entry_compliance_operations (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        tenant_id VARCHAR(120) NOT NULL,
        entry_id VARCHAR(80) NOT NULL,
        operation_id VARCHAR(80) NOT NULL,
        provider VARCHAR(40) NOT NULL DEFAULT 'whitebooks',
        environment VARCHAR(20) NOT NULL DEFAULT 'sandbox',
        purpose VARCHAR(40) NOT NULL DEFAULT 'einvoice_eway',
        operation VARCHAR(80) NOT NULL,
        endpoint VARCHAR(255) NULL,
        status VARCHAR(40) NOT NULL DEFAULT 'pending',
        request_json JSON NULL,
        response_json JSON NULL,
        error_message TEXT NULL,
        created_by VARCHAR(190) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_tenant_entry_compliance_operation (tenant_id, entry_id, operation_id),
        KEY ix_tenant_entry_compliance_parent (tenant_id, entry_id, id),
        KEY ix_tenant_entry_compliance_provider (provider, environment, operation, status)
      )
    `);
  }
};
