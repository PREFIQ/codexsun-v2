import { AppError } from "@codexsun/framework/errors";
import type { UnitRecord, UnitCreateInput, UnitUpdateInput } from "./contracts.js";
import type { UnitRepository } from "./repository.js";

export class UnitService {
  constructor(private readonly repository: UnitRepository) {}

  async list(tenantId: string): Promise<UnitRecord[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId);
  }

  async getById(tenantId: string, id: string): Promise<UnitRecord> {
    const record = await this.repository.getById(tenantId, id);
    if (!record) throw AppError.notFound("Unit not found");
    return record;
  }

  async create(input: UnitCreateInput): Promise<UnitRecord> {
    if (!input.tenantId) throw AppError.validation("tenantId is required");
    if (!input.name?.trim()) throw AppError.validation("name is required");
    const record: UnitRecord = {
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

  async update(input: UnitUpdateInput): Promise<UnitRecord> {
    const existing = await this.getById(input.tenantId, input.id);
    const updated: UnitRecord = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(input as any).filter(([k]) => k !== "tenantId" && k !== "id" && k !== "updatedBy")
      ),
      updatedAt: new Date().toISOString(),
    } as unknown as UnitRecord;
    await this.repository.update(updated);
    return updated;
  }

  async archive(tenantId: string, id: string): Promise<void> {
    const existing = await this.getById(tenantId, id);
    if (!existing.isActive) throw AppError.conflict("Unit is already archived");
    await this.repository.archive(tenantId, id);
  }

  async restore(tenantId: string, id: string): Promise<void> {
    const existing = await this.repository.getById(tenantId, id);
    if (!existing) throw AppError.notFound("Unit not found");
    if (existing.isActive) throw AppError.conflict("Unit is already active");
    await this.repository.restore(tenantId, id);
  }
}
