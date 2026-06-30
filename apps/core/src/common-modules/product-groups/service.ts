import { AppError } from "@codexsun/framework/errors";
import type { ProductGroupRecord, ProductGroupCreateInput, ProductGroupUpdateInput } from "./contracts.js";
import type { ProductGroupRepository } from "./repository.js";

export class ProductGroupService {
  constructor(private readonly repository: ProductGroupRepository) {}

  async list(tenantId: string): Promise<ProductGroupRecord[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId);
  }

  async getById(tenantId: string, id: string): Promise<ProductGroupRecord> {
    const record = await this.repository.getById(tenantId, id);
    if (!record) throw AppError.notFound("ProductGroup not found");
    return record;
  }

  async create(input: ProductGroupCreateInput): Promise<ProductGroupRecord> {
    if (!input.tenantId) throw AppError.validation("tenantId is required");
    if (!input.name?.trim()) throw AppError.validation("name is required");
    const record: ProductGroupRecord = {
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

  async update(input: ProductGroupUpdateInput): Promise<ProductGroupRecord> {
    const existing = await this.getById(input.tenantId, input.id);
    const updated: ProductGroupRecord = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(input as any).filter(([k]) => k !== "tenantId" && k !== "id" && k !== "updatedBy")
      ),
      updatedAt: new Date().toISOString(),
    } as unknown as ProductGroupRecord;
    await this.repository.update(updated);
    return updated;
  }

  async archive(tenantId: string, id: string): Promise<void> {
    const existing = await this.getById(tenantId, id);
    if (!existing.isActive) throw AppError.conflict("ProductGroup is already archived");
    await this.repository.archive(tenantId, id);
  }

  async restore(tenantId: string, id: string): Promise<void> {
    const existing = await this.repository.getById(tenantId, id);
    if (!existing) throw AppError.notFound("ProductGroup not found");
    if (existing.isActive) throw AppError.conflict("ProductGroup is already active");
    await this.repository.restore(tenantId, id);
  }
}
