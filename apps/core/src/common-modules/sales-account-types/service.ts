import { AppError } from "@codexsun/framework/errors";
import type { SalesAccountTypeRecord, SalesAccountTypeCreateInput, SalesAccountTypeUpdateInput } from "./contracts.js";
import type { SalesAccountTypeRepository } from "./repository.js";

export class SalesAccountTypeService {
  constructor(private readonly repository: SalesAccountTypeRepository) {}

  async list(tenantId: string): Promise<SalesAccountTypeRecord[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId);
  }

  async getById(tenantId: string, id: string): Promise<SalesAccountTypeRecord> {
    const record = await this.repository.getById(tenantId, id);
    if (!record) throw AppError.notFound("SalesAccountType not found");
    return record;
  }

  async create(input: SalesAccountTypeCreateInput): Promise<SalesAccountTypeRecord> {
    if (!input.tenantId) throw AppError.validation("tenantId is required");
    if (!input.name?.trim()) throw AppError.validation("name is required");
    const record: SalesAccountTypeRecord = {
      id: crypto.randomUUID(),
      uuid: crypto.randomUUID().slice(0, 8),
      tenantId: input.tenantId,
      isActive: true,
      name: input.name,
      ...(input.description !== undefined ? { description: input.description } : {}),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.repository.create(record);
    return record;
  }

  async update(input: SalesAccountTypeUpdateInput): Promise<SalesAccountTypeRecord> {
    const existing = await this.getById(input.tenantId, input.id);
    const updated: SalesAccountTypeRecord = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(input as any).filter(([k]) => k !== "tenantId" && k !== "id" && k !== "updatedBy")
      ),
      updatedAt: new Date().toISOString(),
    } as unknown as SalesAccountTypeRecord;
    await this.repository.update(updated);
    return updated;
  }

  async archive(tenantId: string, id: string): Promise<void> {
    const existing = await this.getById(tenantId, id);
    if (!existing.isActive) throw AppError.conflict("SalesAccountType is already archived");
    await this.repository.archive(tenantId, id);
  }

  async restore(tenantId: string, id: string): Promise<void> {
    const existing = await this.repository.getById(tenantId, id);
    if (!existing) throw AppError.notFound("SalesAccountType not found");
    if (existing.isActive) throw AppError.conflict("SalesAccountType is already active");
    await this.repository.restore(tenantId, id);
  }
}
