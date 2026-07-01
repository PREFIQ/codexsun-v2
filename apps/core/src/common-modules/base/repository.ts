import type { CommonRecord } from "./contracts.js";

export interface CommonRepository<T extends CommonRecord> {
  list(tenantId: string): Promise<T[]>;
  getById(tenantId: string, id: string): Promise<T | null>;
  create(record: T): Promise<void>;
  update(record: T): Promise<void>;
  archive(tenantId: string, id: string): Promise<void>;
  restore(tenantId: string, id: string): Promise<void>;
  forceDelete(tenantId: string, id: string): Promise<boolean>;
}

export class BaseInMemoryRepository<T extends CommonRecord> implements CommonRepository<T> {
  protected records: T[] = [];

  async list(tenantId: string): Promise<T[]> {
    return this.records
      .filter((r) => r.tenantId === tenantId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)) as T[];
  }

  async getById(tenantId: string, id: string): Promise<T | null> {
    return this.records.find((r) => r.id === id && r.tenantId === tenantId) ?? null;
  }

  async create(record: T): Promise<void> {
    this.records.push(record);
  }

  async update(record: T): Promise<void> {
    const idx = this.records.findIndex((r) => r.id === record.id && r.tenantId === record.tenantId);
    if (idx !== -1) this.records[idx] = record;
  }

  async archive(tenantId: string, id: string): Promise<void> {
    const record = await this.getById(tenantId, id);
    if (record) {
      record.isActive = false;
    }
  }

  async restore(tenantId: string, id: string): Promise<void> {
    const record = this.records.find((r) => r.id === id && r.tenantId === tenantId);
    if (record) {
      record.isActive = true;
      delete (record as { deletedAt?: unknown }).deletedAt;
    }
  }

  async forceDelete(tenantId: string, id: string): Promise<boolean> {
    const index = this.records.findIndex((r) => r.id === id && r.tenantId === tenantId);
    if (index === -1) return false;
    this.records.splice(index, 1);
    return true;
  }
}
