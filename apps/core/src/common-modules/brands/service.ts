import { AppError } from "@codexsun/framework/errors";
import type { BrandRecord, BrandCreateInput, BrandUpdateInput } from "./contracts.js";
import type { BrandRepository } from "./repository.js";

export class BrandService {
  constructor(private readonly repository: BrandRepository) {}

  async list(tenantId: string): Promise<BrandRecord[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId);
  }

  async getById(tenantId: string, id: string): Promise<BrandRecord> {
    const record = await this.repository.getById(tenantId, id);
    if (!record) throw AppError.notFound("Brand not found");
    return record;
  }

  async create(input: BrandCreateInput): Promise<BrandRecord> {
    if (!input.tenantId) throw AppError.validation("tenantId is required");
    if (!input.name?.trim()) throw AppError.validation("name is required");
    const record: BrandRecord = {
      id: crypto.randomUUID(),
      uuid: crypto.randomUUID().slice(0, 8),
      tenantId: input.tenantId,
      isActive: true,
      name: input.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.repository.create(record);
    return record;
  }

  async update(input: BrandUpdateInput): Promise<BrandRecord> {
    const existing = await this.getById(input.tenantId, input.id);
    const updated: BrandRecord = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(input as any).filter(([k]) => k !== "tenantId" && k !== "id" && k !== "updatedBy")
      ),
      updatedAt: new Date().toISOString(),
    } as unknown as BrandRecord;
    await this.repository.update(updated);
    return updated;
  }

  async archive(tenantId: string, id: string): Promise<void> {
    const existing = await this.getById(tenantId, id);
    if (!existing.isActive) throw AppError.conflict("Brand is already archived");
    await this.repository.archive(tenantId, id);
  }

  async restore(tenantId: string, id: string): Promise<void> {
    const existing = await this.repository.getById(tenantId, id);
    if (!existing) throw AppError.notFound("Brand not found");
    if (existing.isActive) throw AppError.conflict("Brand is already active");
    await this.repository.restore(tenantId, id);
  }
}
