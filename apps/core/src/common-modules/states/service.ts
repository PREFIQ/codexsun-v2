import { AppError } from "@codexsun/framework/errors";
import type { StateRecord, StateCreateInput, StateUpdateInput } from "./contracts.js";
import type { StateRepository } from "./repository.js";

export class StateService {
  constructor(private readonly repository: StateRepository) {}

  async list(tenantId: string): Promise<StateRecord[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId);
  }

  async getById(tenantId: string, id: string): Promise<StateRecord> {
    const record = await this.repository.getById(tenantId, id);
    if (!record) throw AppError.notFound("State not found");
    return record;
  }

  async create(input: StateCreateInput): Promise<StateRecord> {
    if (!input.tenantId) throw AppError.validation("tenantId is required");
    if (!input.name?.trim()) throw AppError.validation("name is required");
    if (!input.code?.trim()) throw AppError.validation("code is required");
    if (input.countryId === undefined || input.countryId === null) throw AppError.validation("countryId is required");
    const record: StateRecord = {
      id: crypto.randomUUID(),
      uuid: crypto.randomUUID().slice(0, 8),
      tenantId: input.tenantId,
      isActive: true,
      name: input.name,
      code: input.code,
      countryId: input.countryId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.repository.create(record);
    return record;
  }

  async update(input: StateUpdateInput): Promise<StateRecord> {
    const existing = await this.getById(input.tenantId, input.id);
    const updated: StateRecord = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(input as any).filter(([k]) => k !== "tenantId" && k !== "id" && k !== "updatedBy")
      ),
      updatedAt: new Date().toISOString(),
    } as unknown as StateRecord;
    await this.repository.update(updated);
    return updated;
  }

  async archive(tenantId: string, id: string): Promise<void> {
    const existing = await this.getById(tenantId, id);
    if (!existing.isActive) throw AppError.conflict("State is already archived");
    await this.repository.archive(tenantId, id);
  }

  async restore(tenantId: string, id: string): Promise<void> {
    const existing = await this.repository.getById(tenantId, id);
    if (!existing) throw AppError.notFound("State not found");
    if (existing.isActive) throw AppError.conflict("State is already active");
    await this.repository.restore(tenantId, id);
  }
}
