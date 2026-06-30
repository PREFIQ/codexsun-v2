import { AppError } from "@codexsun/framework/errors";
import type { DestinationRecord, DestinationCreateInput, DestinationUpdateInput } from "./contracts.js";
import type { DestinationRepository } from "./repository.js";

export class DestinationService {
  constructor(private readonly repository: DestinationRepository) {}

  async list(tenantId: string): Promise<DestinationRecord[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId);
  }

  async getById(tenantId: string, id: string): Promise<DestinationRecord> {
    const record = await this.repository.getById(tenantId, id);
    if (!record) throw AppError.notFound("Destination not found");
    return record;
  }

  async create(input: DestinationCreateInput): Promise<DestinationRecord> {
    if (!input.tenantId) throw AppError.validation("tenantId is required");
    if (!input.name?.trim()) throw AppError.validation("name is required");
    const record: DestinationRecord = {
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

  async update(input: DestinationUpdateInput): Promise<DestinationRecord> {
    const existing = await this.getById(input.tenantId, input.id);
    const updated: DestinationRecord = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(input as any).filter(([k]) => k !== "tenantId" && k !== "id" && k !== "updatedBy")
      ),
      updatedAt: new Date().toISOString(),
    } as unknown as DestinationRecord;
    await this.repository.update(updated);
    return updated;
  }

  async archive(tenantId: string, id: string): Promise<void> {
    const existing = await this.getById(tenantId, id);
    if (!existing.isActive) throw AppError.conflict("Destination is already archived");
    await this.repository.archive(tenantId, id);
  }

  async restore(tenantId: string, id: string): Promise<void> {
    const existing = await this.repository.getById(tenantId, id);
    if (!existing) throw AppError.notFound("Destination not found");
    if (existing.isActive) throw AppError.conflict("Destination is already active");
    await this.repository.restore(tenantId, id);
  }
}
