import { AppError } from "@codexsun/framework/errors";
import type { ContactProfile, ContactCreateInput, ContactUpdateInput } from "./contracts.js";
import type { ContactRepository } from "./repository.js";

export class ContactService {
  constructor(private readonly repository: ContactRepository) {}

  async list(tenantId: string): Promise<ContactProfile[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId);
  }

  async getById(tenantId: string, contactId: string): Promise<ContactProfile> {
    const contact = await this.repository.getById(tenantId, contactId);
    if (!contact) throw AppError.notFound("Contact not found");
    return contact;
  }

  async create(input: ContactCreateInput): Promise<ContactProfile> {
    if (!input.tenantId) throw AppError.validation("tenantId is required");
    if (!input.code?.trim()) throw AppError.validation("code is required");
    if (!input.name?.trim()) throw AppError.validation("name is required");
    const contact: ContactProfile = {
      contactId: crypto.randomUUID(),
      tenantId: input.tenantId,
      code: input.code,
      name: input.name,
      ...(input.contactTypeId !== undefined ? { contactTypeId: input.contactTypeId } : {}),
      ...(input.ledgerId !== undefined ? { ledgerId: input.ledgerId } : {}),
      ...(input.ledgerName !== undefined ? { ledgerName: input.ledgerName } : {}),
      ...(input.legalName !== undefined ? { legalName: input.legalName } : {}),
      ...(input.pan !== undefined ? { pan: input.pan } : {}),
      ...(input.gstin !== undefined ? { gstin: input.gstin } : {}),
      ...(input.msmeType !== undefined ? { msmeType: input.msmeType } : {}),
      ...(input.msmeNo !== undefined ? { msmeNo: input.msmeNo } : {}),
      ...(input.tan !== undefined ? { tan: input.tan } : {}),
      ...(input.tdsAvailable !== undefined ? { tdsAvailable: input.tdsAvailable } : {}),
      ...(input.tcsAvailable !== undefined ? { tcsAvailable: input.tcsAvailable } : {}),
      ...(input.openingBalance !== undefined ? { openingBalance: input.openingBalance } : {}),
      ...(input.balanceType !== undefined ? { balanceType: input.balanceType } : {}),
      ...(input.creditLimit !== undefined ? { creditLimit: input.creditLimit } : {}),
      ...(input.website !== undefined ? { website: input.website } : {}),
      ...(input.primaryEmail !== undefined ? { primaryEmail: input.primaryEmail } : {}),
      ...(input.primaryPhone !== undefined ? { primaryPhone: input.primaryPhone } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      addressBook: input.addressBook ?? [],
      contactEmails: input.contactEmails ?? [],
      contactPhones: input.contactPhones ?? [],
      contactSocialLinks: input.contactSocialLinks ?? [],
      contactBankAccounts: input.contactBankAccounts ?? [],
      contactGstDetails: input.contactGstDetails ?? [],
      status: "active",
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
      updatedBy: input.createdBy,
      updatedAt: new Date().toISOString()
    };
    await this.repository.create(contact);
    return contact;
  }

  async update(input: ContactUpdateInput): Promise<ContactProfile> {
    const existing = await this.getById(input.tenantId, input.contactId);
    const updated: ContactProfile = {
      ...existing,
      ...(input.code !== undefined ? { code: input.code } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.contactTypeId !== undefined ? { contactTypeId: input.contactTypeId } : {}),
      ...(input.ledgerId !== undefined ? { ledgerId: input.ledgerId } : {}),
      ...(input.ledgerName !== undefined ? { ledgerName: input.ledgerName } : {}),
      ...(input.legalName !== undefined ? { legalName: input.legalName } : {}),
      ...(input.pan !== undefined ? { pan: input.pan } : {}),
      ...(input.gstin !== undefined ? { gstin: input.gstin } : {}),
      ...(input.msmeType !== undefined ? { msmeType: input.msmeType } : {}),
      ...(input.msmeNo !== undefined ? { msmeNo: input.msmeNo } : {}),
      ...(input.tan !== undefined ? { tan: input.tan } : {}),
      ...(input.tdsAvailable !== undefined ? { tdsAvailable: input.tdsAvailable } : {}),
      ...(input.tcsAvailable !== undefined ? { tcsAvailable: input.tcsAvailable } : {}),
      ...(input.openingBalance !== undefined ? { openingBalance: input.openingBalance } : {}),
      ...(input.balanceType !== undefined ? { balanceType: input.balanceType } : {}),
      ...(input.creditLimit !== undefined ? { creditLimit: input.creditLimit } : {}),
      ...(input.website !== undefined ? { website: input.website } : {}),
      ...(input.primaryEmail !== undefined ? { primaryEmail: input.primaryEmail } : {}),
      ...(input.primaryPhone !== undefined ? { primaryPhone: input.primaryPhone } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.addressBook !== undefined ? { addressBook: input.addressBook } : {}),
      ...(input.contactEmails !== undefined ? { contactEmails: input.contactEmails } : {}),
      ...(input.contactPhones !== undefined ? { contactPhones: input.contactPhones } : {}),
      ...(input.contactSocialLinks !== undefined ? { contactSocialLinks: input.contactSocialLinks } : {}),
      ...(input.contactBankAccounts !== undefined ? { contactBankAccounts: input.contactBankAccounts } : {}),
      ...(input.contactGstDetails !== undefined ? { contactGstDetails: input.contactGstDetails } : {}),
      updatedBy: input.updatedBy,
      updatedAt: new Date().toISOString()
    };
    await this.repository.update(updated);
    return updated;
  }

  async archive(tenantId: string, contactId: string): Promise<void> {
    const existing = await this.getById(tenantId, contactId);
    if (existing.status === "archived") throw AppError.conflict("Contact is already archived");
    await this.repository.archive(tenantId, contactId);
  }

  async restore(tenantId: string, contactId: string): Promise<void> {
    const existing = await this.repository.getById(tenantId, contactId);
    if (!existing) throw AppError.notFound("Contact not found");
    if (existing.status === "active") throw AppError.conflict("Contact is already active");
    await this.repository.restore(tenantId, contactId);
  }
}
