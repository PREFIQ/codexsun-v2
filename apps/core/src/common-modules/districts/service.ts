import { AppError } from "@codexsun/framework/errors";
import type { DistrictRecord, DistrictCreateInput, DistrictUpdateInput } from "./contracts.js";
import type { DistrictRepository } from "./repository.js";

export class DistrictService {
  constructor(private readonly repository: DistrictRepository) {}

  async list(tenantId: string): Promise<DistrictRecord[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId);
  }

  async getById(tenantId: string, id: string): Promise<DistrictRecord> {
    const record = await this.repository.getById(tenantId, id);
    if (!record) throw AppError.notFound("District not found");
    return record;
  }

  async create(input: DistrictCreateInput): Promise<DistrictRecord> {
    if (!input.tenantId) throw AppError.validation("tenantId is required");
    if (!input.name?.trim()) throw AppError.validation("name is required");
    if (input.stateId === undefined || input.stateId === null) throw AppError.validation("stateId is required");
    const record: DistrictRecord = {
      id: crypto.randomUUID(),
      uuid: crypto.randomUUID().slice(0, 8),
      tenantId: input.tenantId,
      isActive: true,
      name: input.name,
      stateId: input.stateId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.repository.create(record);
    return record;
  }

  async update(input: DistrictUpdateInput): Promise<DistrictRecord> {
    const existing = await this.getById(input.tenantId, input.id);
    const updated: DistrictRecord = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(input as any).filter(([k]) => k !== "tenantId" && k !== "id" && k !== "updatedBy")
      ),
      updatedAt: new Date().toISOString(),
    } as unknown as DistrictRecord;
    await this.repository.update(updated);
    return updated;
  }

  async archive(tenantId: string, id: string): Promise<void> {
    const existing = await this.getById(tenantId, id);
    if (!existing.isActive) throw AppError.conflict("District is already archived");
    await this.repository.archive(tenantId, id);
  }

  async restore(tenantId: string, id: string): Promise<void> {
    const existing = await this.repository.getById(tenantId, id);
    if (!existing) throw AppError.notFound("District not found");
    if (existing.isActive) throw AppError.conflict("District is already active");
    await this.repository.restore(tenantId, id);
  }
}
