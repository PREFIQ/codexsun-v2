import { AppError } from "@codexsun/framework/errors";
import type { WorkOrderProfile, WorkOrderCreateInput, WorkOrderUpdateInput } from "./contracts.js";
import type { WorkOrderRepository } from "./repository.js";

export class WorkOrderService {
  constructor(private readonly repository: WorkOrderRepository) {}

  async list(tenantId: string): Promise<WorkOrderProfile[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId);
  }

  async getById(tenantId: string, orderId: string): Promise<WorkOrderProfile> {
    const order = await this.repository.getById(tenantId, orderId);
    if (!order) throw AppError.notFound("Work order not found");
    return order;
  }

  async create(input: WorkOrderCreateInput): Promise<WorkOrderProfile> {
    if (!input.tenantId) throw AppError.validation("tenantId is required");
    if (!input.code?.trim()) throw AppError.validation("code is required");
    if (!input.name?.trim()) throw AppError.validation("name is required");
    const order: WorkOrderProfile = {
      orderId: crypto.randomUUID(),
      tenantId: input.tenantId,
      code: input.code,
      name: input.name,
      ...(input.description !== undefined ? { description: input.description } : {}),
      status: "active",
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
      updatedBy: input.createdBy,
      updatedAt: new Date().toISOString()
    };
    await this.repository.create(order);
    return order;
  }

  async update(input: WorkOrderUpdateInput): Promise<WorkOrderProfile> {
    const existing = await this.getById(input.tenantId, input.orderId);
    const updated: WorkOrderProfile = {
      ...existing,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      updatedBy: input.updatedBy,
      updatedAt: new Date().toISOString()
    };
    await this.repository.update(updated);
    return updated;
  }

  async archive(tenantId: string, orderId: string): Promise<void> {
    const existing = await this.getById(tenantId, orderId);
    if (existing.status === "archived") throw AppError.conflict("Work order is already archived");
    await this.repository.archive(tenantId, orderId);
  }

  async restore(tenantId: string, orderId: string): Promise<void> {
    const existing = await this.repository.getById(tenantId, orderId);
    if (!existing) throw AppError.notFound("Work order not found");
    if (existing.status === "active") throw AppError.conflict("Work order is already active");
    await this.repository.restore(tenantId, orderId);
  }
}
