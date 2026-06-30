import { AppError } from "@codexsun/framework/errors";
import type { CityRecord, CityCreateInput, CityUpdateInput } from "./contracts.js";
import type { CityRepository } from "./repository.js";

export class CityService {
  constructor(private readonly repository: CityRepository) {}

  async list(tenantId: string): Promise<CityRecord[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId);
  }

  async getById(tenantId: string, id: string): Promise<CityRecord> {
    const record = await this.repository.getById(tenantId, id);
    if (!record) throw AppError.notFound("City not found");
    return record;
  }

  async create(input: CityCreateInput): Promise<CityRecord> {
    if (!input.tenantId) throw AppError.validation("tenantId is required");
    if (!input.name?.trim()) throw AppError.validation("name is required");
    if (input.districtId === undefined || input.districtId === null) throw AppError.validation("districtId is required");
    const record: CityRecord = {
      id: crypto.randomUUID(),
      uuid: crypto.randomUUID().slice(0, 8),
      tenantId: input.tenantId,
      isActive: true,
      name: input.name,
      districtId: input.districtId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.repository.create(record);
    return record;
  }

  async update(input: CityUpdateInput): Promise<CityRecord> {
    const existing = await this.getById(input.tenantId, input.id);
    const updated: CityRecord = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(input as any).filter(([k]) => k !== "tenantId" && k !== "id" && k !== "updatedBy")
      ),
      updatedAt: new Date().toISOString(),
    } as unknown as CityRecord;
    await this.repository.update(updated);
    return updated;
  }

  async archive(tenantId: string, id: string): Promise<void> {
    const existing = await this.getById(tenantId, id);
    if (!existing.isActive) throw AppError.conflict("City is already archived");
    await this.repository.archive(tenantId, id);
  }

  async restore(tenantId: string, id: string): Promise<void> {
    const existing = await this.repository.getById(tenantId, id);
    if (!existing) throw AppError.notFound("City not found");
    if (existing.isActive) throw AppError.conflict("City is already active");
    await this.repository.restore(tenantId, id);
  }
}
