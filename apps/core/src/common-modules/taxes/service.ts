import { AppError } from "@codexsun/framework/errors";
import type { TaxRecord, TaxCreateInput, TaxUpdateInput } from "./contracts.js";
import type { TaxRepository } from "./repository.js";

export class TaxService {
  constructor(private readonly repository: TaxRepository) {}

  async list(tenantId: string): Promise<TaxRecord[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId);
  }

  async getById(tenantId: string, id: string): Promise<TaxRecord> {
    const record = await this.repository.getById(tenantId, id);
    if (!record) throw AppError.notFound("Tax not found");
    return record;
  }

  async create(input: TaxCreateInput): Promise<TaxRecord> {
    if (!input.tenantId) throw AppError.validation("tenantId is required");
    if (input.ratePercent === undefined || input.ratePercent === null) throw AppError.validation("ratePercent is required");
    if (!input.description?.trim()) throw AppError.validation("description is required");
    const record: TaxRecord = {
      id: crypto.randomUUID(),
      uuid: crypto.randomUUID().slice(0, 8),
      tenantId: input.tenantId,
      isActive: true,
      ratePercent: input.ratePercent,
      description: input.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.repository.create(record);
    return record;
  }

  async update(input: TaxUpdateInput): Promise<TaxRecord> {
    const existing = await this.getById(input.tenantId, input.id);
    const updated: TaxRecord = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(input as any).filter(([k]) => k !== "tenantId" && k !== "id" && k !== "updatedBy")
      ),
      updatedAt: new Date().toISOString(),
    } as unknown as TaxRecord;
    await this.repository.update(updated);
    return updated;
  }

  async archive(tenantId: string, id: string): Promise<void> {
    const existing = await this.getById(tenantId, id);
    if (!existing.isActive) throw AppError.conflict("Tax is already archived");
    await this.repository.archive(tenantId, id);
  }

  async restore(tenantId: string, id: string): Promise<void> {
    const existing = await this.repository.getById(tenantId, id);
    if (!existing) throw AppError.notFound("Tax not found");
    if (existing.isActive) throw AppError.conflict("Tax is already active");
    await this.repository.restore(tenantId, id);
  }
}
