import { AppError } from "@codexsun/framework/errors";
import type { TransportRecord, TransportCreateInput, TransportUpdateInput } from "./contracts.js";
import type { TransportRepository } from "./repository.js";

export class TransportService {
  constructor(private readonly repository: TransportRepository) {}

  async list(tenantId: string): Promise<TransportRecord[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId);
  }

  async getById(tenantId: string, id: string): Promise<TransportRecord> {
    const record = await this.repository.getById(tenantId, id);
    if (!record) throw AppError.notFound("Transport not found");
    return record;
  }

  async create(input: TransportCreateInput): Promise<TransportRecord> {
    if (!input.tenantId) throw AppError.validation("tenantId is required");
    if (!input.name?.trim()) throw AppError.validation("name is required");
    const record: TransportRecord = {
      id: crypto.randomUUID(),
      uuid: crypto.randomUUID().slice(0, 8),
      tenantId: input.tenantId,
      isActive: true,
      name: input.name,
      ...(input.gst !== undefined ? { gst: input.gst } : {}),
      ...(input.vehicleNo !== undefined ? { vehicleNo: input.vehicleNo } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.contactNo !== undefined ? { contactNo: input.contactNo } : {}),
      ...(input.contactPerson !== undefined ? { contactPerson: input.contactPerson } : {}),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.repository.create(record);
    return record;
  }

  async update(input: TransportUpdateInput): Promise<TransportRecord> {
    const existing = await this.getById(input.tenantId, input.id);
    const updated: TransportRecord = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(input as any).filter(([k]) => k !== "tenantId" && k !== "id" && k !== "updatedBy")
      ),
      updatedAt: new Date().toISOString(),
    } as unknown as TransportRecord;
    await this.repository.update(updated);
    return updated;
  }

  async archive(tenantId: string, id: string): Promise<void> {
    const existing = await this.getById(tenantId, id);
    if (!existing.isActive) throw AppError.conflict("Transport is already archived");
    await this.repository.archive(tenantId, id);
  }

  async restore(tenantId: string, id: string): Promise<void> {
    const existing = await this.repository.getById(tenantId, id);
    if (!existing) throw AppError.notFound("Transport not found");
    if (existing.isActive) throw AppError.conflict("Transport is already active");
    await this.repository.restore(tenantId, id);
  }
}
