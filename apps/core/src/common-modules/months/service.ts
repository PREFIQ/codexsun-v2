import { AppError } from "@codexsun/framework/errors";
import type { MonthRecord, MonthCreateInput, MonthUpdateInput } from "./contracts.js";
import type { MonthRepository } from "./repository.js";

export class MonthService {
  constructor(private readonly repository: MonthRepository) {}

  async list(tenantId: string): Promise<MonthRecord[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId);
  }

  async getById(tenantId: string, id: string): Promise<MonthRecord> {
    const record = await this.repository.getById(tenantId, id);
    if (!record) throw AppError.notFound("Month not found");
    return record;
  }

  async create(input: MonthCreateInput): Promise<MonthRecord> {
    if (!input.tenantId) throw AppError.validation("tenantId is required");
    if (!input.name?.trim()) throw AppError.validation("name is required");
    const record: MonthRecord = {
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

  async update(input: MonthUpdateInput): Promise<MonthRecord> {
    const existing = await this.getById(input.tenantId, input.id);
    const updated: MonthRecord = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(input as any).filter(([k]) => k !== "tenantId" && k !== "id" && k !== "updatedBy")
      ),
      updatedAt: new Date().toISOString(),
    } as unknown as MonthRecord;
    await this.repository.update(updated);
    return updated;
  }

  async archive(tenantId: string, id: string): Promise<void> {
    const existing = await this.getById(tenantId, id);
    if (!existing.isActive) throw AppError.conflict("Month is already archived");
    await this.repository.archive(tenantId, id);
  }

  async restore(tenantId: string, id: string): Promise<void> {
    const existing = await this.repository.getById(tenantId, id);
    if (!existing) throw AppError.notFound("Month not found");
    if (existing.isActive) throw AppError.conflict("Month is already active");
    await this.repository.restore(tenantId, id);
  }
}
