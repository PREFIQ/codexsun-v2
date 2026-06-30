import type { WorkOrderProfile } from "./contracts.js";

export interface WorkOrderRepository {
  list(tenantId: string): Promise<WorkOrderProfile[]>;
  getById(tenantId: string, orderId: string): Promise<WorkOrderProfile | null>;
  create(order: WorkOrderProfile): Promise<void>;
  update(order: WorkOrderProfile): Promise<void>;
  archive(tenantId: string, orderId: string): Promise<void>;
  restore(tenantId: string, orderId: string): Promise<void>;
}

export class InMemoryWorkOrderRepository implements WorkOrderRepository {
  private orders: WorkOrderProfile[] = [];

  async list(tenantId: string): Promise<WorkOrderProfile[]> {
    return this.orders
      .filter((o) => o.tenantId === tenantId && !o.deletedAt)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async getById(tenantId: string, orderId: string): Promise<WorkOrderProfile | null> {
    return this.orders.find((o) => o.orderId === orderId && o.tenantId === tenantId) ?? null;
  }

  async create(order: WorkOrderProfile): Promise<void> {
    this.orders.push(order);
  }

  async update(order: WorkOrderProfile): Promise<void> {
    const idx = this.orders.findIndex((o) => o.orderId === order.orderId && o.tenantId === order.tenantId);
    if (idx !== -1) this.orders[idx] = order;
  }

  async archive(tenantId: string, orderId: string): Promise<void> {
    const order = await this.getById(tenantId, orderId);
    if (order) {
      order.status = "archived";
      order.deletedAt = new Date().toISOString();
    }
  }

  async restore(tenantId: string, orderId: string): Promise<void> {
    const order = this.orders.find((o) => o.orderId === orderId && o.tenantId === tenantId);
    if (order) {
      order.status = "active";
      delete (order as { deletedAt?: unknown }).deletedAt;
    }
  }
}
