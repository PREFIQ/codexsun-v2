import { AppError } from "@codexsun/framework/errors";
import type { PriorityRecord, PriorityCreateInput, PriorityUpdateInput } from "./contracts.js";
import type { PriorityRepository } from "./repository.js";

export class PriorityService {
  constructor(private readonly repository: PriorityRepository) {}

  async list(tenantId: string): Promise<PriorityRecord[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId);
  }

  async getById(tenantId: string, id: string): Promise<PriorityRecord> {
    const record = await this.repository.getById(tenantId, id);
    if (!record) throw AppError.notFound("Priority not found");
    return record;
  }

  async create(input: PriorityCreateInput): Promise<PriorityRecord> {
    if (!input.tenantId) throw AppError.validation("tenantId is required");
    if (!input.name?.trim()) throw AppError.validation("name is required");
    if (!input.colour?.trim()) throw AppError.validation("colour is required");
    if (!input.tag?.trim()) throw AppError.validation("tag is required");
    const record: PriorityRecord = {
      id: crypto.randomUUID(),
      uuid: crypto.randomUUID().slice(0, 8),
      tenantId: input.tenantId,
      isActive: true,
      name: input.name,
      colour: input.colour,
      tag: input.tag,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.repository.create(record);
    return record;
  }

  async update(input: PriorityUpdateInput): Promise<PriorityRecord> {
    const existing = await this.getById(input.tenantId, input.id);
    const updated: PriorityRecord = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(input as any).filter(([k]) => k !== "tenantId" && k !== "id" && k !== "updatedBy")
      ),
      updatedAt: new Date().toISOString(),
    } as unknown as PriorityRecord;
    await this.repository.update(updated);
    return updated;
  }

  async archive(tenantId: string, id: string): Promise<void> {
    const existing = await this.getById(tenantId, id);
    if (!existing.isActive) throw AppError.conflict("Priority is already archived");
    await this.repository.archive(tenantId, id);
  }

  async restore(tenantId: string, id: string): Promise<void> {
    const existing = await this.repository.getById(tenantId, id);
    if (!existing) throw AppError.notFound("Priority not found");
    if (existing.isActive) throw AppError.conflict("Priority is already active");
    await this.repository.restore(tenantId, id);
  }
}
