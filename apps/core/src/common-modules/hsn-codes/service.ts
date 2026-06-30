import { AppError } from "@codexsun/framework/errors";
import type { HsnCodeRecord, HsnCodeCreateInput, HsnCodeUpdateInput } from "./contracts.js";
import type { HsnCodeRepository } from "./repository.js";

export class HsnCodeService {
  constructor(private readonly repository: HsnCodeRepository) {}

  async list(tenantId: string): Promise<HsnCodeRecord[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId);
  }

  async getById(tenantId: string, id: string): Promise<HsnCodeRecord> {
    const record = await this.repository.getById(tenantId, id);
    if (!record) throw AppError.notFound("HsnCode not found");
    return record;
  }

  async create(input: HsnCodeCreateInput): Promise<HsnCodeRecord> {
    if (!input.tenantId) throw AppError.validation("tenantId is required");
    if (!input.code?.trim()) throw AppError.validation("code is required");
    if (!input.description?.trim()) throw AppError.validation("description is required");
    const record: HsnCodeRecord = {
      id: crypto.randomUUID(),
      uuid: crypto.randomUUID().slice(0, 8),
      tenantId: input.tenantId,
      isActive: true,
      code: input.code,
      description: input.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.repository.create(record);
    return record;
  }

  async update(input: HsnCodeUpdateInput): Promise<HsnCodeRecord> {
    const existing = await this.getById(input.tenantId, input.id);
    const updated: HsnCodeRecord = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(input as any).filter(([k]) => k !== "tenantId" && k !== "id" && k !== "updatedBy")
      ),
      updatedAt: new Date().toISOString(),
    } as unknown as HsnCodeRecord;
    await this.repository.update(updated);
    return updated;
  }

  async archive(tenantId: string, id: string): Promise<void> {
    const existing = await this.getById(tenantId, id);
    if (!existing.isActive) throw AppError.conflict("HsnCode is already archived");
    await this.repository.archive(tenantId, id);
  }

  async restore(tenantId: string, id: string): Promise<void> {
    const existing = await this.repository.getById(tenantId, id);
    if (!existing) throw AppError.notFound("HsnCode not found");
    if (existing.isActive) throw AppError.conflict("HsnCode is already active");
    await this.repository.restore(tenantId, id);
  }
}
