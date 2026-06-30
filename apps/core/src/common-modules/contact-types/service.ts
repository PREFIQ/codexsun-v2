import { AppError } from "@codexsun/framework/errors";
import type { ContactTypeRecord, ContactTypeCreateInput, ContactTypeUpdateInput } from "./contracts.js";
import type { ContactTypeRepository } from "./repository.js";

export class ContactTypeService {
  constructor(private readonly repository: ContactTypeRepository) {}

  async list(tenantId: string): Promise<ContactTypeRecord[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId);
  }

  async getById(tenantId: string, id: string): Promise<ContactTypeRecord> {
    const record = await this.repository.getById(tenantId, id);
    if (!record) throw AppError.notFound("ContactType not found");
    return record;
  }

  async create(input: ContactTypeCreateInput): Promise<ContactTypeRecord> {
    if (!input.tenantId) throw AppError.validation("tenantId is required");
    if (!input.name?.trim()) throw AppError.validation("name is required");
    const record: ContactTypeRecord = {
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

  async update(input: ContactTypeUpdateInput): Promise<ContactTypeRecord> {
    const existing = await this.getById(input.tenantId, input.id);
    const updated: ContactTypeRecord = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(input as any).filter(([k]) => k !== "tenantId" && k !== "id" && k !== "updatedBy")
      ),
      updatedAt: new Date().toISOString(),
    } as unknown as ContactTypeRecord;
    await this.repository.update(updated);
    return updated;
  }

  async archive(tenantId: string, id: string): Promise<void> {
    const existing = await this.getById(tenantId, id);
    if (!existing.isActive) throw AppError.conflict("ContactType is already archived");
    await this.repository.archive(tenantId, id);
  }

  async restore(tenantId: string, id: string): Promise<void> {
    const existing = await this.repository.getById(tenantId, id);
    if (!existing) throw AppError.notFound("ContactType not found");
    if (existing.isActive) throw AppError.conflict("ContactType is already active");
    await this.repository.restore(tenantId, id);
  }
}
