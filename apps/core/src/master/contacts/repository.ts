import type { ContactProfile } from "./contracts.js";
import type { CompatibleDbPool } from "@codexsun/framework/db";

export interface ContactRepository {
  list(tenantId: string): Promise<ContactProfile[]>;
  getById(tenantId: string, contactId: string): Promise<ContactProfile | null>;
  nextCode(tenantId: string): Promise<string>;
  create(contact: ContactProfile): Promise<void>;
  update(contact: ContactProfile): Promise<void>;
  archive(tenantId: string, contactId: string): Promise<void>;
  restore(tenantId: string, contactId: string): Promise<void>;
}

export class InMemoryContactRepository implements ContactRepository {
  private contacts: ContactProfile[] = [];

  async list(tenantId: string): Promise<ContactProfile[]> {
    return this.contacts
      .filter((c) => c.tenantId === tenantId && !c.deletedAt)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async getById(tenantId: string, contactId: string): Promise<ContactProfile | null> {
    return this.contacts.find((c) => c.contactId === contactId && c.tenantId === tenantId) ?? null;
  }

  async nextCode(tenantId: string): Promise<string> {
    const nextNumber =
      this.contacts
        .filter((contact) => contact.tenantId === tenantId)
        .map((contact) => /^C-(\d+)$/i.exec(contact.code)?.[1])
        .filter((value): value is string => Boolean(value))
        .map(Number)
        .reduce((max, value) => Math.max(max, value), 0) + 1;
    return formatContactCode(nextNumber);
  }

  async create(contact: ContactProfile): Promise<void> {
    this.contacts.push(contact);
  }

  async update(contact: ContactProfile): Promise<void> {
    const idx = this.contacts.findIndex((c) => c.contactId === contact.contactId && c.tenantId === contact.tenantId);
    if (idx !== -1) this.contacts[idx] = contact;
  }

  async archive(tenantId: string, contactId: string): Promise<void> {
    const contact = await this.getById(tenantId, contactId);
    if (contact) {
      contact.status = "archived";
      contact.deletedAt = new Date().toISOString();
    }
  }

  async restore(tenantId: string, contactId: string): Promise<void> {
    const contact = this.contacts.find((c) => c.contactId === contactId && c.tenantId === tenantId);
    if (contact) {
      contact.status = "active";
      delete contact.deletedAt;
    }
  }
}

export class DatabaseContactRepository implements ContactRepository {
  constructor(private readonly pool: CompatibleDbPool) {}

  async list(tenantId: string): Promise<ContactProfile[]> {
    const [rows] = await this.pool.execute<ContactRow[]>(
      `SELECT *
       FROM tenant_contacts
       WHERE tenant_id = ? AND deleted_at IS NULL
       ORDER BY name ASC, created_at ASC`,
      [tenantId]
    );
    return Promise.all(rows.map((row) => this.hydrate(row)));
  }

  async getById(tenantId: string, contactId: string): Promise<ContactProfile | null> {
    const [rows] = await this.pool.execute<ContactRow[]>(
      `SELECT *
       FROM tenant_contacts
       WHERE tenant_id = ? AND contact_id = ?
       LIMIT 1`,
      [tenantId, contactId]
    );
    const row = rows[0];
    return row ? this.hydrate(row) : null;
  }

  async nextCode(tenantId: string): Promise<string> {
    const [rows] = await this.pool.execute<Array<{ next_number: number | string }>>(
      "SELECT next_number FROM tenant_contact_code_sequences WHERE tenant_id = ? LIMIT 1",
      [tenantId]
    );
    if (rows[0]?.next_number !== undefined) return formatContactCode(Number(rows[0].next_number));

    const [maxRows] = await this.pool.execute<Array<{ max_code: number | string | null }>>(
      `SELECT MAX(CAST(SUBSTRING(code, 3) AS UNSIGNED)) AS max_code
       FROM tenant_contacts
       WHERE tenant_id = ? AND code REGEXP '^C-[0-9]+$'`,
      [tenantId]
    );
    return formatContactCode(Number(maxRows[0]?.max_code ?? 0) + 1);
  }

  async create(contact: ContactProfile): Promise<void> {
    const code = contact.code?.trim() || await this.allocateNextCode(contact.tenantId);
    await this.pool.execute(
      `INSERT INTO tenant_contacts (
         tenant_id, contact_id, code, name, contact_type_id, contact_group_id, ledger_id, ledger_name,
         legal_name, pan, gstin, msme_type, msme_no, tan, tds_available, tcs_available,
         opening_balance, balance_type, credit_limit, website, primary_email, primary_phone,
         description, status, created_by, updated_by, created_at, updated_at, deleted_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         code = VALUES(code),
         name = VALUES(name),
         contact_type_id = VALUES(contact_type_id),
         contact_group_id = VALUES(contact_group_id),
         ledger_id = VALUES(ledger_id),
         ledger_name = VALUES(ledger_name),
         legal_name = VALUES(legal_name),
         pan = VALUES(pan),
         gstin = VALUES(gstin),
         msme_type = VALUES(msme_type),
         msme_no = VALUES(msme_no),
         tan = VALUES(tan),
         tds_available = VALUES(tds_available),
         tcs_available = VALUES(tcs_available),
         opening_balance = VALUES(opening_balance),
         balance_type = VALUES(balance_type),
         credit_limit = VALUES(credit_limit),
         website = VALUES(website),
         primary_email = VALUES(primary_email),
         primary_phone = VALUES(primary_phone),
         description = VALUES(description),
         status = VALUES(status),
         updated_by = VALUES(updated_by),
         updated_at = VALUES(updated_at),
         deleted_at = VALUES(deleted_at)`,
      contactValues({ ...contact, code })
    );
    await this.replaceChildren({ ...contact, code });
    await this.syncSequence(contact.tenantId, code);
  }

  async update(contact: ContactProfile): Promise<void> {
    await this.create(contact);
  }

  async archive(tenantId: string, contactId: string): Promise<void> {
    await this.pool.execute(
      `UPDATE tenant_contacts
       SET status = 'archived', deleted_at = COALESCE(deleted_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP
       WHERE tenant_id = ? AND contact_id = ?`,
      [tenantId, contactId]
    );
  }

  async restore(tenantId: string, contactId: string): Promise<void> {
    await this.pool.execute(
      `UPDATE tenant_contacts
       SET status = 'active', deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE tenant_id = ? AND contact_id = ?`,
      [tenantId, contactId]
    );
  }

  private async allocateNextCode(tenantId: string): Promise<string> {
    const code = await this.nextCode(tenantId);
    await this.syncSequence(tenantId, code);
    return code;
  }

  private async syncSequence(tenantId: string, code: string) {
    const match = /^C-(\d+)$/i.exec(code.trim());
    if (!match) return;
    const nextNumber = Number(match[1]) + 1;
    await this.pool.execute(
      `INSERT INTO tenant_contact_code_sequences (tenant_id, next_number)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE next_number = GREATEST(next_number, VALUES(next_number))`,
      [tenantId, nextNumber]
    );
  }

  private async hydrate(row: ContactRow): Promise<ContactProfile> {
    const contactId = String(row.contact_id);
    const tenantId = String(row.tenant_id);
    const [addresses, emails, phones, socialLinks, bankAccounts, gstDetails] = await Promise.all([
      this.pool.execute<AddressRow[]>(
        `SELECT * FROM tenant_contact_addresses
         WHERE tenant_id = ? AND contact_id = ?
         ORDER BY is_default DESC, id ASC`,
        [tenantId, contactId]
      ),
      this.pool.execute<EmailRow[]>(
        `SELECT * FROM tenant_contact_emails
         WHERE tenant_id = ? AND contact_id = ?
         ORDER BY is_primary DESC, id ASC`,
        [tenantId, contactId]
      ),
      this.pool.execute<PhoneRow[]>(
        `SELECT * FROM tenant_contact_phones
         WHERE tenant_id = ? AND contact_id = ?
         ORDER BY is_primary DESC, id ASC`,
        [tenantId, contactId]
      ),
      this.pool.execute<SocialRow[]>(
        `SELECT * FROM tenant_contact_social_links
         WHERE tenant_id = ? AND contact_id = ?
         ORDER BY id ASC`,
        [tenantId, contactId]
      ),
      this.pool.execute<BankRow[]>(
        `SELECT * FROM tenant_contact_bank_accounts
         WHERE tenant_id = ? AND contact_id = ?
         ORDER BY is_primary DESC, id ASC`,
        [tenantId, contactId]
      ),
      this.pool.execute<GstRow[]>(
        `SELECT * FROM tenant_contact_gst_details
         WHERE tenant_id = ? AND contact_id = ?
         ORDER BY is_default DESC, id ASC`,
        [tenantId, contactId]
      )
    ]);

    const emailRows = emails[0];
    const phoneRows = phones[0];
    return {
      contactId,
      tenantId,
      code: String(row.code),
      name: String(row.name),
      contactTypeId: stringOrUndefined(row.contact_type_id) ?? "",
      contactGroupId: stringOrUndefined(row.contact_group_id) ?? "",
      ledgerId: stringOrUndefined(row.ledger_id) ?? "",
      ledgerName: stringOrUndefined(row.ledger_name) ?? "",
      legalName: stringOrUndefined(row.legal_name) ?? "",
      pan: stringOrUndefined(row.pan) ?? "",
      gstin: stringOrUndefined(row.gstin) ?? "",
      msmeType: stringOrUndefined(row.msme_type) ?? "",
      msmeNo: stringOrUndefined(row.msme_no) ?? "",
      tan: stringOrUndefined(row.tan) ?? "",
      tdsAvailable: booleanValue(row.tds_available),
      tcsAvailable: booleanValue(row.tcs_available),
      openingBalance: numberValue(row.opening_balance),
      balanceType: stringOrUndefined(row.balance_type) ?? "",
      creditLimit: numberValue(row.credit_limit),
      website: stringOrUndefined(row.website) ?? "",
      primaryEmail: stringOrUndefined(row.primary_email) ?? stringOrUndefined(emailRows.find((email) => booleanValue(email.is_primary))?.email ?? emailRows[0]?.email) ?? "",
      primaryPhone: stringOrUndefined(row.primary_phone) ?? stringOrUndefined(phoneRows.find((phone) => booleanValue(phone.is_primary))?.phone_number ?? phoneRows[0]?.phone_number) ?? "",
      description: stringOrUndefined(row.description) ?? "",
      addressBook: addresses[0].map((address) => ({
        id: String(address.id),
        uuid: String(address.uuid),
        ownerType: "contact",
        ownerId: contactId,
        addressTypeId: stringOrUndefined(address.address_type_id) ?? "",
        addressLine1: stringOrUndefined(address.address_line1) ?? "",
        addressLine2: stringOrUndefined(address.address_line2) ?? "",
        cityId: stringOrUndefined(address.city_id) ?? "",
        districtId: stringOrUndefined(address.district_id) ?? "",
        stateId: stringOrUndefined(address.state_id) ?? "",
        countryId: stringOrUndefined(address.country_id) ?? "",
        pincodeId: stringOrUndefined(address.pincode_id) ?? "",
        isDefault: booleanValue(address.is_default),
        isActive: booleanValue(address.is_active, true)
      })),
      contactEmails: emailRows.map((email) => ({
        id: String(email.id),
        uuid: String(email.uuid),
        contactId,
        email: String(email.email ?? ""),
        emailType: String(email.email_type ?? "Primary"),
        isPrimary: booleanValue(email.is_primary),
        isActive: booleanValue(email.is_active, true)
      })),
      contactPhones: phoneRows.map((phone) => ({
        id: String(phone.id),
        uuid: String(phone.uuid),
        contactId,
        phoneNumber: String(phone.phone_number ?? ""),
        phoneType: String(phone.phone_type ?? "Mobile"),
        isPrimary: booleanValue(phone.is_primary),
        isActive: booleanValue(phone.is_active, true)
      })),
      contactSocialLinks: socialLinks[0].map((link) => ({
        id: String(link.id),
        uuid: String(link.uuid),
        contactId,
        platform: String(link.platform ?? ""),
        url: String(link.url ?? ""),
        isActive: booleanValue(link.is_active, true)
      })),
      contactBankAccounts: bankAccounts[0].map((bank) => ({
        id: String(bank.id),
        uuid: String(bank.uuid),
        contactId,
        bankName: String(bank.bank_name ?? ""),
        accountNumber: String(bank.account_number ?? ""),
        accountTypeId: String(bank.account_type_id ?? ""),
        accountHolderName: String(bank.account_holder_name ?? ""),
        ifsc: String(bank.ifsc ?? ""),
        branch: String(bank.branch ?? ""),
        isPrimary: booleanValue(bank.is_primary),
        isActive: booleanValue(bank.is_active, true)
      })),
      contactGstDetails: gstDetails[0].map((gst) => ({
        id: String(gst.id),
        uuid: String(gst.uuid),
        contactId,
        gstin: String(gst.gstin ?? ""),
        state: String(gst.state ?? ""),
        isDefault: booleanValue(gst.is_default),
        isActive: booleanValue(gst.is_active, true)
      })),
      status: row.status === "archived" ? "archived" : "active",
      createdBy: String(row.created_by ?? ""),
      createdAt: fromSqlTimestamp(row.created_at),
      updatedBy: String(row.updated_by ?? ""),
      updatedAt: fromSqlTimestamp(row.updated_at),
      ...(row.deleted_at ? { deletedAt: fromSqlTimestamp(row.deleted_at) } : {})
    };
  }

  private async replaceChildren(contact: ContactProfile) {
    await Promise.all([
      this.replaceAddresses(contact),
      this.replaceEmails(contact),
      this.replacePhones(contact),
      this.replaceSocialLinks(contact),
      this.replaceBankAccounts(contact),
      this.replaceGstDetails(contact)
    ]);
  }

  private async replaceAddresses(contact: ContactProfile) {
    await this.pool.execute("DELETE FROM tenant_contact_addresses WHERE tenant_id = ? AND contact_id = ?", [contact.tenantId, contact.contactId]);
    const rows = (contact.addressBook ?? []).filter((address) => stringOrUndefined(address.addressLine1));
    for (const address of rows) {
      await this.pool.execute(
        `INSERT INTO tenant_contact_addresses (
           tenant_id, contact_id, uuid, address_type_id, address_line1, address_line2, country_id,
           state_id, district_id, city_id, pincode_id, latitude, longitude, is_default, is_active
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          contact.tenantId, contact.contactId, address.uuid || crypto.randomUUID(), nullable(address.addressTypeId),
          nullable(address.addressLine1), nullable(address.addressLine2), nullable(address.countryId), nullable(address.stateId),
          nullable(address.districtId), nullable(address.cityId), nullable(address.pincodeId), address.latitude ?? null,
          address.longitude ?? null, address.isDefault ? 1 : 0, address.isActive === false ? 0 : 1
        ]
      );
    }
  }

  private async replaceEmails(contact: ContactProfile) {
    await this.pool.execute("DELETE FROM tenant_contact_emails WHERE tenant_id = ? AND contact_id = ?", [contact.tenantId, contact.contactId]);
    const rows = (contact.contactEmails ?? []).filter((email) => stringOrUndefined(email.email));
    for (const email of rows) {
      await this.pool.execute(
        `INSERT INTO tenant_contact_emails (tenant_id, contact_id, uuid, email, email_type, is_primary, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [contact.tenantId, contact.contactId, email.uuid || crypto.randomUUID(), email.email, nullable(email.emailType), email.isPrimary ? 1 : 0, email.isActive === false ? 0 : 1]
      );
    }
  }

  private async replacePhones(contact: ContactProfile) {
    await this.pool.execute("DELETE FROM tenant_contact_phones WHERE tenant_id = ? AND contact_id = ?", [contact.tenantId, contact.contactId]);
    const rows = (contact.contactPhones ?? []).filter((phone) => stringOrUndefined(phone.phoneNumber));
    for (const phone of rows) {
      await this.pool.execute(
        `INSERT INTO tenant_contact_phones (tenant_id, contact_id, uuid, phone_number, phone_type, is_primary, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [contact.tenantId, contact.contactId, phone.uuid || crypto.randomUUID(), phone.phoneNumber, nullable(phone.phoneType), phone.isPrimary ? 1 : 0, phone.isActive === false ? 0 : 1]
      );
    }
  }

  private async replaceSocialLinks(contact: ContactProfile) {
    await this.pool.execute("DELETE FROM tenant_contact_social_links WHERE tenant_id = ? AND contact_id = ?", [contact.tenantId, contact.contactId]);
    const rows = (contact.contactSocialLinks ?? []).filter((link) => stringOrUndefined(link.platform) && stringOrUndefined(link.url));
    for (const link of rows) {
      await this.pool.execute(
        `INSERT INTO tenant_contact_social_links (tenant_id, contact_id, uuid, platform, url, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [contact.tenantId, contact.contactId, link.uuid || crypto.randomUUID(), link.platform, link.url, link.isActive === false ? 0 : 1]
      );
    }
  }

  private async replaceBankAccounts(contact: ContactProfile) {
    await this.pool.execute("DELETE FROM tenant_contact_bank_accounts WHERE tenant_id = ? AND contact_id = ?", [contact.tenantId, contact.contactId]);
    const rows = (contact.contactBankAccounts ?? []).filter((bank) => stringOrUndefined(bank.bankName) || stringOrUndefined(bank.accountNumber));
    for (const bank of rows) {
      await this.pool.execute(
        `INSERT INTO tenant_contact_bank_accounts (
           tenant_id, contact_id, uuid, bank_name, account_number, account_type_id, account_holder_name, ifsc, branch, is_primary, is_active
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          contact.tenantId, contact.contactId, bank.uuid || crypto.randomUUID(), nullable(bank.bankName), nullable(bank.accountNumber),
          nullable(bank.accountTypeId), nullable(bank.accountHolderName), nullable(bank.ifsc), nullable(bank.branch), bank.isPrimary ? 1 : 0, bank.isActive === false ? 0 : 1
        ]
      );
    }
  }

  private async replaceGstDetails(contact: ContactProfile) {
    await this.pool.execute("DELETE FROM tenant_contact_gst_details WHERE tenant_id = ? AND contact_id = ?", [contact.tenantId, contact.contactId]);
    const rows = (contact.contactGstDetails ?? []).filter((gst) => stringOrUndefined(gst.gstin));
    for (const gst of rows) {
      await this.pool.execute(
        `INSERT INTO tenant_contact_gst_details (tenant_id, contact_id, uuid, gstin, state, is_default, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [contact.tenantId, contact.contactId, gst.uuid || crypto.randomUUID(), gst.gstin, nullable(gst.state), gst.isDefault ? 1 : 0, gst.isActive === false ? 0 : 1]
      );
    }
  }
}

type SqlTimestamp = Date | string;
type ContactRow = {
  tenant_id: string;
  contact_id: string;
  code: string;
  name: string;
  contact_type_id: string | null;
  contact_group_id: string | null;
  ledger_id: string | null;
  ledger_name: string | null;
  legal_name: string | null;
  pan: string | null;
  gstin: string | null;
  msme_type: string | null;
  msme_no: string | null;
  tan: string | null;
  tds_available: number | boolean | null;
  tcs_available: number | boolean | null;
  opening_balance: number | string | null;
  balance_type: string | null;
  credit_limit: number | string | null;
  website: string | null;
  primary_email: string | null;
  primary_phone: string | null;
  description: string | null;
  status: string;
  created_by: string;
  created_at: SqlTimestamp;
  updated_by: string;
  updated_at: SqlTimestamp;
  deleted_at: SqlTimestamp | null;
};
type AddressRow = { id: number | string; uuid: string; address_type_id: string | null; address_line1: string | null; address_line2: string | null; country_id: string | null; state_id: string | null; district_id: string | null; city_id: string | null; pincode_id: string | null; latitude: number | string | null; longitude: number | string | null; is_default: number | boolean; is_active: number | boolean };
type EmailRow = { id: number | string; uuid: string; email: string | null; email_type: string | null; is_primary: number | boolean; is_active: number | boolean };
type PhoneRow = { id: number | string; uuid: string; phone_number: string | null; phone_type: string | null; is_primary: number | boolean; is_active: number | boolean };
type SocialRow = { id: number | string; uuid: string; platform: string | null; url: string | null; is_active: number | boolean };
type BankRow = { id: number | string; uuid: string; bank_name: string | null; account_number: string | null; account_type_id: string | null; account_holder_name: string | null; ifsc: string | null; branch: string | null; is_primary: number | boolean; is_active: number | boolean };
type GstRow = { id: number | string; uuid: string; gstin: string | null; state: string | null; is_default: number | boolean; is_active: number | boolean };

function contactValues(contact: ContactProfile) {
  return [
    contact.tenantId,
    contact.contactId,
    contact.code,
    contact.name,
    nullable(contact.contactTypeId),
    nullable(contact.contactGroupId),
    nullable(contact.ledgerId),
    nullable(contact.ledgerName),
    nullable(contact.legalName),
    nullable(contact.pan),
    nullable(contact.gstin),
    nullable(contact.msmeType),
    nullable(contact.msmeNo),
    nullable(contact.tan),
    contact.tdsAvailable ? 1 : 0,
    contact.tcsAvailable ? 1 : 0,
    contact.openingBalance ?? null,
    nullable(contact.balanceType),
    contact.creditLimit ?? null,
    nullable(contact.website),
    nullable(contact.primaryEmail),
    nullable(contact.primaryPhone),
    nullable(contact.description),
    contact.status,
    contact.createdBy,
    contact.updatedBy,
    toSqlTimestamp(contact.createdAt),
    toSqlTimestamp(contact.updatedAt),
    contact.deletedAt ? toSqlTimestamp(contact.deletedAt) : null
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

function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
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

function formatContactCode(number: number) {
  return `C-${String(Math.max(1, number)).padStart(4, "0")}`;
}
