import { AppError } from "@codexsun/framework/errors";
import type { ProductCategoryRecord, ProductCategoryCreateInput, ProductCategoryUpdateInput } from "./contracts.js";
import type { ProductCategoryRepository } from "./repository.js";

export class ProductCategoryService {
  constructor(private readonly repository: ProductCategoryRepository) {}

  async list(tenantId: string): Promise<ProductCategoryRecord[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId);
  }

  async getById(tenantId: string, id: string): Promise<ProductCategoryRecord> {
    const record = await this.repository.getById(tenantId, id);
    if (!record) throw AppError.notFound("ProductCategory not found");
    return record;
  }

  async create(input: ProductCategoryCreateInput): Promise<ProductCategoryRecord> {
    if (!input.tenantId) throw AppError.validation("tenantId is required");
    if (!input.name?.trim()) throw AppError.validation("name is required");
    const record: ProductCategoryRecord = {
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

  async update(input: ProductCategoryUpdateInput): Promise<ProductCategoryRecord> {
    const existing = await this.getById(input.tenantId, input.id);
    const updated: ProductCategoryRecord = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(input as any).filter(([k]) => k !== "tenantId" && k !== "id" && k !== "updatedBy")
      ),
      updatedAt: new Date().toISOString(),
    } as unknown as ProductCategoryRecord;
    await this.repository.update(updated);
    return updated;
  }

  async archive(tenantId: string, id: string): Promise<void> {
    const existing = await this.getById(tenantId, id);
    if (!existing.isActive) throw AppError.conflict("ProductCategory is already archived");
    await this.repository.archive(tenantId, id);
  }

  async restore(tenantId: string, id: string): Promise<void> {
    const existing = await this.repository.getById(tenantId, id);
    if (!existing) throw AppError.notFound("ProductCategory not found");
    if (existing.isActive) throw AppError.conflict("ProductCategory is already active");
    await this.repository.restore(tenantId, id);
  }
}
