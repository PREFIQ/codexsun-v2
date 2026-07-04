import type { Migration } from "../migration-runner.js";

export const migration: Migration = {
  id: "009_tenant_entries",
  description: "Tenant quotation, sales, purchase, receipt, and payment entries",
  up: async (db) => {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS tenant_entry_documents (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        tenant_id VARCHAR(120) NOT NULL,
        entry_id VARCHAR(80) NOT NULL,
        entry_type VARCHAR(30) NOT NULL,
        document_no VARCHAR(80) NOT NULL,
        document_date DATE NOT NULL,
        party_id VARCHAR(120) NULL,
        party_name VARCHAR(220) NOT NULL,
        party_type VARCHAR(80) NULL,
        party_gstin VARCHAR(40) NULL,
        party_state_code VARCHAR(40) NULL,
        party_state_name VARCHAR(120) NULL,
        supplier_bill_no VARCHAR(120) NULL,
        supplier_bill_date DATE NULL,
        billing_address TEXT NULL,
        shipping_address TEXT NULL,
        place_of_supply VARCHAR(120) NULL,
        reference_no VARCHAR(120) NULL,
        reference_date DATE NULL,
        due_date DATE NULL,
        ledger_id VARCHAR(120) NULL,
        ledger_name VARCHAR(180) NULL,
        payment_mode VARCHAR(80) NULL,
        bank_account_id VARCHAR(120) NULL,
        subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
        discount_total DECIMAL(15, 2) NOT NULL DEFAULT 0,
        taxable_total DECIMAL(15, 2) NOT NULL DEFAULT 0,
        tax_total DECIMAL(15, 2) NOT NULL DEFAULT 0,
        round_off DECIMAL(15, 2) NOT NULL DEFAULT 0,
        grand_total DECIMAL(15, 2) NOT NULL DEFAULT 0,
        paid_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
        balance_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
        amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
        tds_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
        net_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
        allocated_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
        unallocated_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
        status VARCHAR(40) NOT NULL DEFAULT 'draft',
        payment_status VARCHAR(40) NOT NULL DEFAULT 'unpaid',
        notes TEXT NULL,
        terms TEXT NULL,
        transport_json JSON NULL,
        compliance_json JSON NULL,
        source_json JSON NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_by VARCHAR(190) NOT NULL,
        updated_by VARCHAR(190) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        UNIQUE KEY uq_tenant_entry_documents_entry (tenant_id, entry_id),
        UNIQUE KEY uq_tenant_entry_documents_no (tenant_id, entry_type, document_no),
        KEY ix_tenant_entry_documents_type_date (tenant_id, entry_type, document_date, id),
        KEY ix_tenant_entry_documents_party (tenant_id, entry_type, party_name),
        KEY ix_tenant_entry_documents_status (tenant_id, entry_type, status, is_active)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS tenant_entry_lines (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        tenant_id VARCHAR(120) NOT NULL,
        entry_id VARCHAR(80) NOT NULL,
        line_id VARCHAR(80) NOT NULL,
        product_id VARCHAR(120) NULL,
        product_name VARCHAR(220) NOT NULL,
        description TEXT NULL,
        colour VARCHAR(120) NULL,
        hsn_code VARCHAR(80) NULL,
        po_no VARCHAR(120) NULL,
        dc_no VARCHAR(120) NULL,
        size VARCHAR(120) NULL,
        unit VARCHAR(80) NULL,
        quantity DECIMAL(15, 3) NOT NULL DEFAULT 0,
        rate DECIMAL(15, 2) NOT NULL DEFAULT 0,
        discount_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
        tax_rate DECIMAL(8, 3) NOT NULL DEFAULT 0,
        tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
        line_total DECIMAL(15, 2) NOT NULL DEFAULT 0,
        sort_order INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_tenant_entry_lines_line (tenant_id, entry_id, line_id),
        KEY ix_tenant_entry_lines_parent (tenant_id, entry_id, sort_order)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS tenant_entry_allocations (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        tenant_id VARCHAR(120) NOT NULL,
        entry_id VARCHAR(80) NOT NULL,
        allocation_id VARCHAR(80) NOT NULL,
        document_type VARCHAR(80) NOT NULL,
        document_id VARCHAR(120) NULL,
        document_no VARCHAR(120) NOT NULL,
        document_date DATE NULL,
        document_total DECIMAL(15, 2) NOT NULL DEFAULT 0,
        previous_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
        allocated_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
        balance_after_allocation DECIMAL(15, 2) NOT NULL DEFAULT 0,
        sort_order INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_tenant_entry_allocations_allocation (tenant_id, entry_id, allocation_id),
        KEY ix_tenant_entry_allocations_parent (tenant_id, entry_id, sort_order)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS tenant_entry_comments (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        tenant_id VARCHAR(120) NOT NULL,
        entry_id VARCHAR(80) NOT NULL,
        comment_id VARCHAR(80) NOT NULL,
        author_email VARCHAR(191) NOT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_tenant_entry_comments_comment (tenant_id, entry_id, comment_id),
        KEY ix_tenant_entry_comments_parent (tenant_id, entry_id, id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS tenant_entry_activities (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        tenant_id VARCHAR(120) NOT NULL,
        entry_id VARCHAR(80) NOT NULL,
        activity_id VARCHAR(80) NOT NULL,
        activity_type VARCHAR(80) NOT NULL,
        actor_email VARCHAR(191) NOT NULL,
        message VARCHAR(255) NOT NULL,
        payload_json JSON NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_tenant_entry_activities_activity (tenant_id, entry_id, activity_id),
        KEY ix_tenant_entry_activities_parent (tenant_id, entry_id, id)
      )
    `);
  }
};
