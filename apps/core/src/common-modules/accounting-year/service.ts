import { AppError } from "@codexsun/framework/errors";
import type { AccountingYearRecord, AccountingYearCreateInput, AccountingYearUpdateInput } from "./contracts.js";
import type { AccountingYearRepository } from "./repository.js";

export class AccountingYearService {
  constructor(private readonly repository: AccountingYearRepository) {}

  async list(tenantId: string): Promise<AccountingYearRecord[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId);
  }

  async getById(tenantId: string, id: string): Promise<AccountingYearRecord> {
    const record = await this.repository.getById(tenantId, id);
    if (!record) throw AppError.notFound("AccountingYear not found");
    return record;
  }

  async create(input: AccountingYearCreateInput): Promise<AccountingYearRecord> {
    if (!input.tenantId) throw AppError.validation("tenantId is required");
    if (!input.name?.trim()) throw AppError.validation("name is required");
    if (!input.startDate?.trim()) throw AppError.validation("startDate is required");
    if (!input.endDate?.trim()) throw AppError.validation("endDate is required");
    if (!input.booksStart?.trim()) throw AppError.validation("booksStart is required");
    if (input.isCurrentYear === undefined || input.isCurrentYear === null) throw AppError.validation("isCurrentYear is required");
    const record: AccountingYearRecord = {
      id: crypto.randomUUID(),
      uuid: crypto.randomUUID().slice(0, 8),
      tenantId: input.tenantId,
      isActive: true,
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      booksStart: input.booksStart,
      isCurrentYear: input.isCurrentYear,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.repository.create(record);
    return record;
  }

  async update(input: AccountingYearUpdateInput): Promise<AccountingYearRecord> {
    const existing = await this.getById(input.tenantId, input.id);
    const updated: AccountingYearRecord = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(input as any).filter(([k]) => k !== "tenantId" && k !== "id" && k !== "updatedBy")
      ),
      updatedAt: new Date().toISOString(),
    } as unknown as AccountingYearRecord;
    await this.repository.update(updated);
    return updated;
  }

  async archive(tenantId: string, id: string): Promise<void> {
    const existing = await this.getById(tenantId, id);
    if (!existing.isActive) throw AppError.conflict("AccountingYear is already archived");
    await this.repository.archive(tenantId, id);
  }

  async restore(tenantId: string, id: string): Promise<void> {
    const existing = await this.repository.getById(tenantId, id);
    if (!existing) throw AppError.notFound("AccountingYear not found");
    if (existing.isActive) throw AppError.conflict("AccountingYear is already active");
    await this.repository.restore(tenantId, id);
  }
}
