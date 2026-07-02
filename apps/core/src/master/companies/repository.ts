import type { CompanyProfile } from "./contracts.js";
import type { CompatibleDbPool } from "@codexsun/framework/db";

export interface CompanyRepository {
  list(tenantId: string): Promise<CompanyProfile[]>;
  getById(tenantId: string, companyId: string): Promise<CompanyProfile | null>;
  create(company: CompanyProfile): Promise<void>;
  update(company: CompanyProfile): Promise<void>;
  archive(tenantId: string, companyId: string): Promise<void>;
  restore(tenantId: string, companyId: string): Promise<void>;
}

export class DatabaseCompanyRepository implements CompanyRepository {
  constructor(private readonly pool: CompatibleDbPool) {}

  async list(tenantId: string): Promise<CompanyProfile[]> {
    const [rows] = await this.pool.execute<CompanyRow[]>(
      `SELECT *
       FROM tenant_companies
       WHERE tenant_id = ? AND deleted_at IS NULL
       ORDER BY legal_name ASC, created_at ASC`,
      [tenantId]
    );
    return Promise.all(rows.map((row) => this.hydrate(row)));
  }

  async getById(tenantId: string, companyId: string): Promise<CompanyProfile | null> {
    const [rows] = await this.pool.execute<CompanyRow[]>(
      `SELECT *
       FROM tenant_companies
       WHERE tenant_id = ? AND company_id = ?
       LIMIT 1`,
      [tenantId, companyId]
    );
    const row = rows[0];
    return row ? this.hydrate(row) : null;
  }

  async create(company: CompanyProfile): Promise<void> {
    await this.pool.execute(
      `INSERT INTO tenant_companies (
         tenant_id, company_id, legal_name, trade_name, company_group_id, website, logo_url, notes,
         status, created_by, updated_by, created_at, updated_at, deleted_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         legal_name = VALUES(legal_name),
         trade_name = VALUES(trade_name),
         company_group_id = VALUES(company_group_id),
         website = VALUES(website),
         logo_url = VALUES(logo_url),
         notes = VALUES(notes),
         status = VALUES(status),
         updated_by = VALUES(updated_by),
         updated_at = VALUES(updated_at),
         deleted_at = VALUES(deleted_at)`,
      companyValues(company)
    );
    await this.replaceChildren(company);
  }

  async update(company: CompanyProfile): Promise<void> {
    await this.create(company);
  }

  async archive(tenantId: string, companyId: string): Promise<void> {
    await this.pool.execute(
      `UPDATE tenant_companies
       SET status = 'archived', deleted_at = COALESCE(deleted_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP
       WHERE tenant_id = ? AND company_id = ?`,
      [tenantId, companyId]
    );
  }

  async restore(tenantId: string, companyId: string): Promise<void> {
    await this.pool.execute(
      `UPDATE tenant_companies
       SET status = 'active', deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE tenant_id = ? AND company_id = ?`,
      [tenantId, companyId]
    );
  }

  private async hydrate(row: CompanyRow): Promise<CompanyProfile> {
    const tenantId = String(row.tenant_id);
    const companyId = String(row.company_id);
    const [phones, emails, addresses, bankAccounts, taxIdentities] = await Promise.all([
      this.pool.execute<CompanyPhoneRow[]>(
        "SELECT * FROM tenant_company_phones WHERE tenant_id = ? AND company_id = ? ORDER BY is_primary DESC, id ASC",
        [tenantId, companyId]
      ),
      this.pool.execute<CompanyEmailRow[]>(
        "SELECT * FROM tenant_company_emails WHERE tenant_id = ? AND company_id = ? ORDER BY is_primary DESC, id ASC",
        [tenantId, companyId]
      ),
      this.pool.execute<CompanyAddressRow[]>(
        "SELECT * FROM tenant_company_addresses WHERE tenant_id = ? AND company_id = ? ORDER BY is_default DESC, id ASC",
        [tenantId, companyId]
      ),
      this.pool.execute<CompanyBankRow[]>(
        "SELECT * FROM tenant_company_bank_accounts WHERE tenant_id = ? AND company_id = ? ORDER BY is_default DESC, id ASC",
        [tenantId, companyId]
      ),
      this.pool.execute<CompanyTaxRow[]>(
        "SELECT * FROM tenant_company_tax_identities WHERE tenant_id = ? AND company_id = ? ORDER BY is_default DESC, id ASC",
        [tenantId, companyId]
      )
    ]);

    return {
      companyId,
      tenantId,
      legalName: String(row.legal_name),
      tradeName: stringOrUndefined(row.trade_name) ?? "",
      companyGroupId: stringOrUndefined(row.company_group_id) ?? "",
      phone: phones[0].map((phone) => ({
        phoneId: String(phone.phone_id),
        label: String(phone.label ?? "Primary"),
        number: String(phone.phone_number ?? ""),
        isPrimary: booleanValue(phone.is_primary)
      })),
      email: emails[0].map((email) => ({
        emailId: String(email.email_id),
        label: String(email.label ?? "Primary"),
        address: String(email.email_address ?? ""),
        isPrimary: booleanValue(email.is_primary)
      })),
      addresses: addresses[0].map((address) => ({
        addressId: String(address.address_id),
        tenantId,
        label: String(address.label ?? "Registered"),
        line1: String(address.line1 ?? ""),
        line2: stringOrUndefined(address.line2) ?? "",
        country: String(address.country ?? ""),
        state: stringOrUndefined(address.state) ?? "",
        district: stringOrUndefined(address.district) ?? "",
        city: stringOrUndefined(address.city) ?? "",
        pincode: stringOrUndefined(address.pincode) ?? "",
        gstStateCode: stringOrUndefined(address.gst_state_code) ?? "",
        isDefault: booleanValue(address.is_default),
        addressType: String(address.address_type ?? "Registered"),
        createdAt: fromSqlTimestamp(address.created_at),
        updatedAt: fromSqlTimestamp(address.updated_at)
      })),
      bankAccounts: bankAccounts[0].map((bank) => ({
        accountId: String(bank.account_id),
        accountHolderName: String(bank.account_holder_name ?? ""),
        accountNumber: String(bank.account_number ?? ""),
        accountTypeId: stringOrUndefined(bank.account_type_id) ?? "",
        ifscCode: String(bank.ifsc_code ?? ""),
        bankName: stringOrUndefined(bank.bank_name) ?? "",
        branchName: stringOrUndefined(bank.branch_name) ?? "",
        isDefault: booleanValue(bank.is_default)
      })),
      taxIdentities: taxIdentities[0].map((tax) => ({
        taxId: String(tax.tax_id),
        type: tax.type === "gstin" || tax.type === "pan" || tax.type === "tan" || tax.type === "cin" ? tax.type : "other",
        value: String(tax.tax_value ?? ""),
        isDefault: booleanValue(tax.is_default)
      })),
      website: stringOrUndefined(row.website) ?? "",
      logoUrl: stringOrUndefined(row.logo_url) ?? "",
      notes: stringOrUndefined(row.notes) ?? "",
      status: row.status === "archived" ? "archived" : "active",
      createdBy: String(row.created_by ?? ""),
      createdAt: fromSqlTimestamp(row.created_at),
      updatedBy: String(row.updated_by ?? ""),
      updatedAt: fromSqlTimestamp(row.updated_at),
      ...(row.deleted_at ? { deletedAt: fromSqlTimestamp(row.deleted_at) } : {})
    };
  }

  private async replaceChildren(company: CompanyProfile) {
    await Promise.all([
      this.replacePhones(company),
      this.replaceEmails(company),
      this.replaceAddresses(company),
      this.replaceBankAccounts(company),
      this.replaceTaxIdentities(company)
    ]);
  }

  private async replacePhones(company: CompanyProfile) {
    await this.pool.execute("DELETE FROM tenant_company_phones WHERE tenant_id = ? AND company_id = ?", [company.tenantId, company.companyId]);
    for (const phone of company.phone.filter((item) => stringOrUndefined(item.number))) {
      await this.pool.execute(
        `INSERT INTO tenant_company_phones (tenant_id, company_id, phone_id, label, phone_number, is_primary)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [company.tenantId, company.companyId, phone.phoneId || crypto.randomUUID(), phone.label, phone.number, phone.isPrimary ? 1 : 0]
      );
    }
  }

  private async replaceEmails(company: CompanyProfile) {
    await this.pool.execute("DELETE FROM tenant_company_emails WHERE tenant_id = ? AND company_id = ?", [company.tenantId, company.companyId]);
    for (const email of company.email.filter((item) => stringOrUndefined(item.address))) {
      await this.pool.execute(
        `INSERT INTO tenant_company_emails (tenant_id, company_id, email_id, label, email_address, is_primary)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [company.tenantId, company.companyId, email.emailId || crypto.randomUUID(), email.label, email.address, email.isPrimary ? 1 : 0]
      );
    }
  }

  private async replaceAddresses(company: CompanyProfile) {
    await this.pool.execute("DELETE FROM tenant_company_addresses WHERE tenant_id = ? AND company_id = ?", [company.tenantId, company.companyId]);
    for (const address of company.addresses.filter((item) => stringOrUndefined(item.line1) || stringOrUndefined(item.city) || stringOrUndefined(item.pincode))) {
      await this.pool.execute(
        `INSERT INTO tenant_company_addresses (
           tenant_id, company_id, address_id, label, line1, line2, country, state, district, city,
           pincode, gst_state_code, is_default, address_type, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          company.tenantId, company.companyId, address.addressId || crypto.randomUUID(), address.label, address.line1,
          nullable(address.line2), address.country, nullable(address.state), nullable(address.district), nullable(address.city),
          nullable(address.pincode), nullable(address.gstStateCode), address.isDefault ? 1 : 0, address.addressType,
          toSqlTimestamp(address.createdAt), toSqlTimestamp(address.updatedAt)
        ]
      );
    }
  }

  private async replaceBankAccounts(company: CompanyProfile) {
    await this.pool.execute("DELETE FROM tenant_company_bank_accounts WHERE tenant_id = ? AND company_id = ?", [company.tenantId, company.companyId]);
    for (const bank of company.bankAccounts.filter((item) => stringOrUndefined(item.bankName) || stringOrUndefined(item.accountNumber))) {
      await this.pool.execute(
        `INSERT INTO tenant_company_bank_accounts (
           tenant_id, company_id, account_id, account_holder_name, account_number, account_type_id, ifsc_code, bank_name, branch_name, is_default
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          company.tenantId, company.companyId, bank.accountId || crypto.randomUUID(), bank.accountHolderName, bank.accountNumber,
          nullable(bank.accountTypeId), bank.ifscCode, nullable(bank.bankName), nullable(bank.branchName), bank.isDefault ? 1 : 0
        ]
      );
    }
  }

  private async replaceTaxIdentities(company: CompanyProfile) {
    await this.pool.execute("DELETE FROM tenant_company_tax_identities WHERE tenant_id = ? AND company_id = ?", [company.tenantId, company.companyId]);
    for (const tax of company.taxIdentities.filter((item) => stringOrUndefined(item.value))) {
      await this.pool.execute(
        `INSERT INTO tenant_company_tax_identities (tenant_id, company_id, tax_id, type, tax_value, is_default)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [company.tenantId, company.companyId, tax.taxId || crypto.randomUUID(), tax.type, tax.value, tax.isDefault ? 1 : 0]
      );
    }
  }
}

export class InMemoryCompanyRepository implements CompanyRepository {
  private companies: CompanyProfile[] = [];

  async list(tenantId: string): Promise<CompanyProfile[]> {
    return this.companies
      .filter((c) => c.tenantId === tenantId && !c.deletedAt)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async getById(tenantId: string, companyId: string): Promise<CompanyProfile | null> {
    return this.companies.find((c) => c.companyId === companyId && c.tenantId === tenantId) ?? null;
  }

  async create(company: CompanyProfile): Promise<void> {
    this.companies.push(company);
  }

  async update(company: CompanyProfile): Promise<void> {
    const idx = this.companies.findIndex((c) => c.companyId === company.companyId && c.tenantId === company.tenantId);
    if (idx !== -1) this.companies[idx] = company;
  }

  async archive(tenantId: string, companyId: string): Promise<void> {
    const company = await this.getById(tenantId, companyId);
    if (company) {
      company.status = "archived";
      company.deletedAt = new Date().toISOString();
    }
  }

  async restore(tenantId: string, companyId: string): Promise<void> {
    const company = this.companies.find((c) => c.companyId === companyId && c.tenantId === tenantId);
    if (company) {
      company.status = "active";
      delete company.deletedAt;
    }
  }
}

type SqlTimestamp = Date | string;
type CompanyRow = {
  tenant_id: string;
  company_id: string;
  legal_name: string;
  trade_name: string | null;
  company_group_id: string | null;
  website: string | null;
  logo_url: string | null;
  notes: string | null;
  status: string;
  created_by: string;
  updated_by: string;
  created_at: SqlTimestamp;
  updated_at: SqlTimestamp;
  deleted_at: SqlTimestamp | null;
};
type CompanyPhoneRow = { phone_id: string; label: string | null; phone_number: string | null; is_primary: number | boolean };
type CompanyEmailRow = { email_id: string; label: string | null; email_address: string | null; is_primary: number | boolean };
type CompanyAddressRow = {
  address_id: string; label: string | null; line1: string | null; line2: string | null; country: string | null;
  state: string | null; district: string | null; city: string | null; pincode: string | null; gst_state_code: string | null;
  is_default: number | boolean; address_type: string | null; created_at: SqlTimestamp; updated_at: SqlTimestamp;
};
type CompanyBankRow = { account_id: string; account_holder_name: string | null; account_number: string | null; account_type_id: string | null; ifsc_code: string | null; bank_name: string | null; branch_name: string | null; is_default: number | boolean };
type CompanyTaxRow = { tax_id: string; type: string; tax_value: string | null; is_default: number | boolean };

function companyValues(company: CompanyProfile) {
  return [
    company.tenantId,
    company.companyId,
    company.legalName,
    nullable(company.tradeName),
    nullable(company.companyGroupId),
    nullable(company.website),
    nullable(company.logoUrl),
    nullable(company.notes),
    company.status,
    company.createdBy,
    company.updatedBy,
    toSqlTimestamp(company.createdAt),
    toSqlTimestamp(company.updatedAt),
    company.deletedAt ? toSqlTimestamp(company.deletedAt) : null
  ];
}

function nullable(value: unknown) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function stringOrUndefined(value: unknown) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function booleanValue(value: unknown, fallback = false) {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string") return value !== "0" && value.toLowerCase() !== "false";
  return Boolean(value);
}

function toSqlTimestamp(value: string) {
  return value.includes("T") ? value.slice(0, 19).replace("T", " ") : value;
}

function fromSqlTimestamp(value: SqlTimestamp) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
