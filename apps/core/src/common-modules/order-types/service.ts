import { AppError } from "@codexsun/framework/errors";
import type { OrderTypeRecord, OrderTypeCreateInput, OrderTypeUpdateInput } from "./contracts.js";
import type { OrderTypeRepository } from "./repository.js";

export class OrderTypeService {
  constructor(private readonly repository: OrderTypeRepository) {}

  async list(tenantId: string): Promise<OrderTypeRecord[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId);
  }

  async getById(tenantId: string, id: string): Promise<OrderTypeRecord> {
    const record = await this.repository.getById(tenantId, id);
    if (!record) throw AppError.notFound("OrderType not found");
    return record;
  }

  async create(input: OrderTypeCreateInput): Promise<OrderTypeRecord> {
    if (!input.tenantId) throw AppError.validation("tenantId is required");
    if (!input.name?.trim()) throw AppError.validation("name is required");
    const record: OrderTypeRecord = {
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

  async update(input: OrderTypeUpdateInput): Promise<OrderTypeRecord> {
    const existing = await this.getById(input.tenantId, input.id);
    const updated: OrderTypeRecord = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(input as any).filter(([k]) => k !== "tenantId" && k !== "id" && k !== "updatedBy")
      ),
      updatedAt: new Date().toISOString(),
    } as unknown as OrderTypeRecord;
    await this.repository.update(updated);
    return updated;
  }

  async archive(tenantId: string, id: string): Promise<void> {
    const existing = await this.getById(tenantId, id);
    if (!existing.isActive) throw AppError.conflict("OrderType is already archived");
    await this.repository.archive(tenantId, id);
  }

  async restore(tenantId: string, id: string): Promise<void> {
    const existing = await this.repository.getById(tenantId, id);
    if (!existing) throw AppError.notFound("OrderType not found");
    if (existing.isActive) throw AppError.conflict("OrderType is already active");
    await this.repository.restore(tenantId, id);
  }
}
