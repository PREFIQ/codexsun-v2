import { AppError } from "@codexsun/framework/errors";
import type { CompanyProfile, CompanyCreateInput, CompanyUpdateInput } from "./contracts.js";
import type { CompanyRepository } from "./repository.js";

export class CompanyService {
  constructor(private readonly repository: CompanyRepository) {}

  async list(tenantId: string): Promise<CompanyProfile[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId);
  }

  async getById(tenantId: string, companyId: string): Promise<CompanyProfile> {
    const company = await this.repository.getById(tenantId, companyId);
    if (!company) throw AppError.notFound("Company not found");
    return company;
  }

  async create(input: CompanyCreateInput): Promise<CompanyProfile> {
    if (!input.tenantId) throw AppError.validation("tenantId is required");
    if (!input.legalName?.trim()) throw AppError.validation("legalName is required");
    const company: CompanyProfile = {
      companyId: crypto.randomUUID(),
      tenantId: input.tenantId,
      legalName: input.legalName,
      ...(input.tradeName !== undefined ? { tradeName: input.tradeName } : {}),
      ...(input.companyGroupId !== undefined ? { companyGroupId: input.companyGroupId } : {}),
      phone: input.phone ?? [],
      email: input.email ?? [],
      addresses: input.addresses ?? [],
      bankAccounts: input.bankAccounts ?? [],
      taxIdentities: input.taxIdentities ?? [],
      ...(input.website !== undefined ? { website: input.website } : {}),
      ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
      ...(input.logoDarkUrl !== undefined ? { logoDarkUrl: input.logoDarkUrl } : {}),
      ...(input.faviconUrl !== undefined ? { faviconUrl: input.faviconUrl } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      status: "active",
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
      updatedBy: input.createdBy,
      updatedAt: new Date().toISOString()
    };
    await this.repository.create(company);
    return company;
  }

  async update(input: CompanyUpdateInput): Promise<CompanyProfile> {
    const existing = await this.getById(input.tenantId, input.companyId);
    const updated: CompanyProfile = {
      ...existing,
      ...(input.legalName !== undefined ? { legalName: input.legalName } : {}),
      ...(input.tradeName !== undefined ? { tradeName: input.tradeName } : {}),
      ...(input.companyGroupId !== undefined ? { companyGroupId: input.companyGroupId } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.addresses !== undefined ? { addresses: input.addresses } : {}),
      ...(input.bankAccounts !== undefined ? { bankAccounts: input.bankAccounts } : {}),
      ...(input.taxIdentities !== undefined ? { taxIdentities: input.taxIdentities } : {}),
      ...(input.website !== undefined ? { website: input.website } : {}),
      ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
      ...(input.logoDarkUrl !== undefined ? { logoDarkUrl: input.logoDarkUrl } : {}),
      ...(input.faviconUrl !== undefined ? { faviconUrl: input.faviconUrl } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      updatedBy: input.updatedBy,
      updatedAt: new Date().toISOString()
    };
    await this.repository.update(updated);
    return updated;
  }

  async archive(tenantId: string, companyId: string): Promise<void> {
    const existing = await this.getById(tenantId, companyId);
    if (existing.status === "archived") throw AppError.conflict("Company is already archived");
    await this.repository.archive(tenantId, companyId);
  }

  async restore(tenantId: string, companyId: string): Promise<void> {
    const existing = await this.repository.getById(tenantId, companyId);
    if (!existing) throw AppError.notFound("Company not found");
    if (existing.status === "active") throw AppError.conflict("Company is already active");
    await this.repository.restore(tenantId, companyId);
  }
}
