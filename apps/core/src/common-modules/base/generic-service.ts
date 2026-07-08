import { AppError } from "@codexsun/framework/errors";
import { BaseInMemoryRepository, type CommonRepository } from "./repository.js";
import type { CommonRecord } from "./contracts.js";

export class GenericCommonModuleService {
  private readonly repository: CommonRepository<CommonRecord>;

  constructor(private readonly label: string, repository?: CommonRepository<CommonRecord>) {
    this.repository = repository ?? new BaseInMemoryRepository<CommonRecord>();
  }

  async list(tenantId: string): Promise<CommonRecord[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId);
  }

  async getById(tenantId: string, id: string): Promise<CommonRecord> {
    const record = await this.repository.getById(tenantId, id);
    if (!record) throw AppError.notFound(`${this.label} not found`);
    return record;
  }

  async create(input: Record<string, unknown>): Promise<CommonRecord> {
    const tenantId = String(input.tenantId ?? "");
    const name = String(input.name ?? "").trim();
    if (!tenantId) throw AppError.validation("tenantId is required");
    if (!name) throw AppError.validation("name is required");
    const code = String(input.code ?? "").trim();
    if (code) {
      const duplicate = (await this.repository.list(tenantId)).find((record) => String((record as { code?: unknown }).code ?? "").trim() === code);
      if (duplicate) throw AppError.conflict(`${this.label} with code '${code}' already exists`);
    }
    const now = new Date().toISOString();
    const record: CommonRecord = {
      ...input,
      id: crypto.randomUUID(),
      isActive: true,
      name,
      tenantId,
      uuid: crypto.randomUUID().slice(0, 8),
      createdAt: now,
      updatedAt: now,
    } as unknown as CommonRecord;
    await this.repository.create(record);
    return record;
  }

  async update(input: Record<string, unknown>): Promise<CommonRecord> {
    const tenantId = String(input.tenantId ?? "");
    const id = String(input.id ?? "");
    const existing = await this.getById(tenantId, id);
    const updated = {
      ...existing,
      ...Object.fromEntries(Object.entries(input).filter(([key]) => !["tenantId", "id", "updatedBy"].includes(key))),
      updatedAt: new Date().toISOString(),
    } as CommonRecord;
    await this.repository.update(updated);
    return updated;
  }

  async archive(tenantId: string, id: string): Promise<void> {
    const existing = await this.getById(tenantId, id);
    if (!existing.isActive) throw AppError.conflict(`${this.label} is already archived`);
    await this.repository.archive(tenantId, id);
  }

  async restore(tenantId: string, id: string): Promise<void> {
    const existing = await this.getById(tenantId, id);
    if (existing.isActive) throw AppError.conflict(`${this.label} is already active`);
    await this.repository.restore(tenantId, id);
  }

  async forceDelete(tenantId: string, id: string): Promise<void> {
    const removed = await this.repository.forceDelete(tenantId, id);
    if (!removed) throw AppError.notFound(`${this.label} not found`);
  }
}
