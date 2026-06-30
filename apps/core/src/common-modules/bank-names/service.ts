import { AppError } from "@codexsun/framework/errors";
import type { BankNameRecord, BankNameCreateInput, BankNameUpdateInput } from "./contracts.js";
import type { BankNameRepository } from "./repository.js";

export class BankNameService {
  constructor(private readonly repository: BankNameRepository) {}

  async list(tenantId: string): Promise<BankNameRecord[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId);
  }

  async getById(tenantId: string, id: string): Promise<BankNameRecord> {
    const record = await this.repository.getById(tenantId, id);
    if (!record) throw AppError.notFound("BankName not found");
    return record;
  }

  async create(input: BankNameCreateInput): Promise<BankNameRecord> {
    if (!input.tenantId) throw AppError.validation("tenantId is required");
    if (!input.name?.trim()) throw AppError.validation("name is required");
    const record: BankNameRecord = {
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

  async update(input: BankNameUpdateInput): Promise<BankNameRecord> {
    const existing = await this.getById(input.tenantId, input.id);
    const updated: BankNameRecord = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(input as any).filter(([k]) => k !== "tenantId" && k !== "id" && k !== "updatedBy")
      ),
      updatedAt: new Date().toISOString(),
    } as unknown as BankNameRecord;
    await this.repository.update(updated);
    return updated;
  }

  async archive(tenantId: string, id: string): Promise<void> {
    const existing = await this.getById(tenantId, id);
    if (!existing.isActive) throw AppError.conflict("BankName is already archived");
    await this.repository.archive(tenantId, id);
  }

  async restore(tenantId: string, id: string): Promise<void> {
    const existing = await this.repository.getById(tenantId, id);
    if (!existing) throw AppError.notFound("BankName not found");
    if (existing.isActive) throw AppError.conflict("BankName is already active");
    await this.repository.restore(tenantId, id);
  }
}
