import { AppError } from "@codexsun/framework/errors";
import type { AddressTypeRecord, AddressTypeCreateInput, AddressTypeUpdateInput } from "./contracts.js";
import type { AddressTypeRepository } from "./repository.js";

export class AddressTypeService {
  constructor(private readonly repository: AddressTypeRepository) {}

  async list(tenantId: string): Promise<AddressTypeRecord[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId);
  }

  async getById(tenantId: string, id: string): Promise<AddressTypeRecord> {
    const record = await this.repository.getById(tenantId, id);
    if (!record) throw AppError.notFound("AddressType not found");
    return record;
  }

  async create(input: AddressTypeCreateInput): Promise<AddressTypeRecord> {
    if (!input.tenantId) throw AppError.validation("tenantId is required");
    if (!input.name?.trim()) throw AppError.validation("name is required");
    const record: AddressTypeRecord = {
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

  async update(input: AddressTypeUpdateInput): Promise<AddressTypeRecord> {
    const existing = await this.getById(input.tenantId, input.id);
    const updated: AddressTypeRecord = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(input as any).filter(([k]) => k !== "tenantId" && k !== "id" && k !== "updatedBy")
      ),
      updatedAt: new Date().toISOString(),
    } as unknown as AddressTypeRecord;
    await this.repository.update(updated);
    return updated;
  }

  async archive(tenantId: string, id: string): Promise<void> {
    const existing = await this.getById(tenantId, id);
    if (!existing.isActive) throw AppError.conflict("AddressType is already archived");
    await this.repository.archive(tenantId, id);
  }

  async restore(tenantId: string, id: string): Promise<void> {
    const existing = await this.repository.getById(tenantId, id);
    if (!existing) throw AppError.notFound("AddressType not found");
    if (existing.isActive) throw AppError.conflict("AddressType is already active");
    await this.repository.restore(tenantId, id);
  }
}
