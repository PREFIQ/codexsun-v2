import { AppError } from "@codexsun/framework/errors";
import type { PincodeRecord, PincodeCreateInput, PincodeUpdateInput } from "./contracts.js";
import type { PincodeRepository } from "./repository.js";

export class PincodeService {
  constructor(private readonly repository: PincodeRepository) {}

  async list(tenantId: string): Promise<PincodeRecord[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId);
  }

  async getById(tenantId: string, id: string): Promise<PincodeRecord> {
    const record = await this.repository.getById(tenantId, id);
    if (!record) throw AppError.notFound("Pincode not found");
    return record;
  }

  async create(input: PincodeCreateInput): Promise<PincodeRecord> {
    if (!input.tenantId) throw AppError.validation("tenantId is required");
    if (!input.name?.trim()) throw AppError.validation("name is required");
    const record: PincodeRecord = {
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

  async update(input: PincodeUpdateInput): Promise<PincodeRecord> {
    const existing = await this.getById(input.tenantId, input.id);
    const updated: PincodeRecord = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(input as any).filter(([k]) => k !== "tenantId" && k !== "id" && k !== "updatedBy")
      ),
      updatedAt: new Date().toISOString(),
    } as unknown as PincodeRecord;
    await this.repository.update(updated);
    return updated;
  }

  async archive(tenantId: string, id: string): Promise<void> {
    const existing = await this.getById(tenantId, id);
    if (!existing.isActive) throw AppError.conflict("Pincode is already archived");
    await this.repository.archive(tenantId, id);
  }

  async restore(tenantId: string, id: string): Promise<void> {
    const existing = await this.repository.getById(tenantId, id);
    if (!existing) throw AppError.notFound("Pincode not found");
    if (existing.isActive) throw AppError.conflict("Pincode is already active");
    await this.repository.restore(tenantId, id);
  }
}
