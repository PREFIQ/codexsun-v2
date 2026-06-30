import { AppError } from "@codexsun/framework/errors";
import type { CountryRecord, CountryCreateInput, CountryUpdateInput } from "./contracts.js";
import type { CountryRepository } from "./repository.js";

export class CountryService {
  constructor(private readonly repository: CountryRepository) {}

  async list(tenantId: string): Promise<CountryRecord[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId);
  }

  async getById(tenantId: string, id: string): Promise<CountryRecord> {
    const record = await this.repository.getById(tenantId, id);
    if (!record) throw AppError.notFound("Country not found");
    return record;
  }

  async create(input: CountryCreateInput): Promise<CountryRecord> {
    if (!input.tenantId) throw AppError.validation("tenantId is required");
    if (!input.name?.trim()) throw AppError.validation("name is required");
    if (!input.code?.trim()) throw AppError.validation("code is required");
    const record: CountryRecord = {
      id: crypto.randomUUID(),
      uuid: crypto.randomUUID().slice(0, 8),
      tenantId: input.tenantId,
      isActive: true,
      name: input.name,
      code: input.code,
      ...(input.phoneCode !== undefined ? { phoneCode: input.phoneCode } : {}),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.repository.create(record);
    return record;
  }

  async update(input: CountryUpdateInput): Promise<CountryRecord> {
    const existing = await this.getById(input.tenantId, input.id);
    const updated: CountryRecord = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(input as any).filter(([k]) => k !== "tenantId" && k !== "id" && k !== "updatedBy")
      ),
      updatedAt: new Date().toISOString(),
    } as unknown as CountryRecord;
    await this.repository.update(updated);
    return updated;
  }

  async archive(tenantId: string, id: string): Promise<void> {
    const existing = await this.getById(tenantId, id);
    if (!existing.isActive) throw AppError.conflict("Country is already archived");
    await this.repository.archive(tenantId, id);
  }

  async restore(tenantId: string, id: string): Promise<void> {
    const existing = await this.repository.getById(tenantId, id);
    if (!existing) throw AppError.notFound("Country not found");
    if (existing.isActive) throw AppError.conflict("Country is already active");
    await this.repository.restore(tenantId, id);
  }
}
