import { AppError } from "@codexsun/framework/errors";
import type { ProductTypeRecord, ProductTypeCreateInput, ProductTypeUpdateInput } from "./contracts.js";
import type { ProductTypeRepository } from "./repository.js";

export class ProductTypeService {
  constructor(private readonly repository: ProductTypeRepository) {}

  async list(tenantId: string): Promise<ProductTypeRecord[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId);
  }

  async getById(tenantId: string, id: string): Promise<ProductTypeRecord> {
    const record = await this.repository.getById(tenantId, id);
    if (!record) throw AppError.notFound("ProductType not found");
    return record;
  }

  async create(input: ProductTypeCreateInput): Promise<ProductTypeRecord> {
    if (!input.tenantId) throw AppError.validation("tenantId is required");
    if (!input.name?.trim()) throw AppError.validation("name is required");
    const record: ProductTypeRecord = {
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

  async update(input: ProductTypeUpdateInput): Promise<ProductTypeRecord> {
    const existing = await this.getById(input.tenantId, input.id);
    const updated: ProductTypeRecord = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(input as any).filter(([k]) => k !== "tenantId" && k !== "id" && k !== "updatedBy")
      ),
      updatedAt: new Date().toISOString(),
    } as unknown as ProductTypeRecord;
    await this.repository.update(updated);
    return updated;
  }

  async archive(tenantId: string, id: string): Promise<void> {
    const existing = await this.getById(tenantId, id);
    if (!existing.isActive) throw AppError.conflict("ProductType is already archived");
    await this.repository.archive(tenantId, id);
  }

  async restore(tenantId: string, id: string): Promise<void> {
    const existing = await this.repository.getById(tenantId, id);
    if (!existing) throw AppError.notFound("ProductType not found");
    if (existing.isActive) throw AppError.conflict("ProductType is already active");
    await this.repository.restore(tenantId, id);
  }
}
