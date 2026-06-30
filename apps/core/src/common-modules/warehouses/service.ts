import { AppError } from "@codexsun/framework/errors";
import type { WarehouseRecord, WarehouseCreateInput, WarehouseUpdateInput } from "./contracts.js";
import type { WarehouseRepository } from "./repository.js";

export class WarehouseService {
  constructor(private readonly repository: WarehouseRepository) {}

  async list(tenantId: string): Promise<WarehouseRecord[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId);
  }

  async getById(tenantId: string, id: string): Promise<WarehouseRecord> {
    const record = await this.repository.getById(tenantId, id);
    if (!record) throw AppError.notFound("Warehouse not found");
    return record;
  }

  async create(input: WarehouseCreateInput): Promise<WarehouseRecord> {
    if (!input.tenantId) throw AppError.validation("tenantId is required");
    if (!input.name?.trim()) throw AppError.validation("name is required");
    const record: WarehouseRecord = {
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

  async update(input: WarehouseUpdateInput): Promise<WarehouseRecord> {
    const existing = await this.getById(input.tenantId, input.id);
    const updated: WarehouseRecord = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(input as any).filter(([k]) => k !== "tenantId" && k !== "id" && k !== "updatedBy")
      ),
      updatedAt: new Date().toISOString(),
    } as unknown as WarehouseRecord;
    await this.repository.update(updated);
    return updated;
  }

  async archive(tenantId: string, id: string): Promise<void> {
    const existing = await this.getById(tenantId, id);
    if (!existing.isActive) throw AppError.conflict("Warehouse is already archived");
    await this.repository.archive(tenantId, id);
  }

  async restore(tenantId: string, id: string): Promise<void> {
    const existing = await this.repository.getById(tenantId, id);
    if (!existing) throw AppError.notFound("Warehouse not found");
    if (existing.isActive) throw AppError.conflict("Warehouse is already active");
    await this.repository.restore(tenantId, id);
  }
}
