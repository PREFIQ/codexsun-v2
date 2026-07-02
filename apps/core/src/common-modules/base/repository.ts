import type { CommonRecord } from "./contracts.js";
import type { CompatibleDbPool } from "@codexsun/framework/db";

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

export class DatabaseCommonRepository<T extends CommonRecord> implements CommonRepository<T> {
  constructor(
    private readonly pool: CompatibleDbPool,
    private readonly moduleKey: string
  ) {}

  async list(tenantId: string): Promise<T[]> {
    const [rows] = await this.pool.execute<CommonRecordRow[]>(
      `SELECT payload_json, is_active, created_at, updated_at, deleted_at
       FROM tenant_common_records
       WHERE tenant_id = ? AND module_key = ?
       ORDER BY created_at ASC`,
      [tenantId, this.moduleKey]
    );
    return rows.map((row) => rowToRecord<T>(row));
  }

  async getById(tenantId: string, id: string): Promise<T | null> {
    const [rows] = await this.pool.execute<CommonRecordRow[]>(
      `SELECT payload_json, is_active, created_at, updated_at, deleted_at
       FROM tenant_common_records
       WHERE tenant_id = ? AND module_key = ? AND record_id = ?
       LIMIT 1`,
      [tenantId, this.moduleKey, id]
    );
    const row = rows[0];
    return row ? rowToRecord<T>(row) : null;
  }

  async create(record: T): Promise<void> {
    await this.pool.execute(
      `INSERT INTO tenant_common_records
         (tenant_id, module_key, record_id, is_active, payload_json, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         is_active = VALUES(is_active),
         payload_json = VALUES(payload_json),
         updated_at = VALUES(updated_at),
         deleted_at = VALUES(deleted_at)`,
      recordValues(this.moduleKey, record)
    );
  }

  async update(record: T): Promise<void> {
    await this.create(record);
  }

  async archive(tenantId: string, id: string): Promise<void> {
    const existing = await this.getById(tenantId, id);
    if (!existing) return;
    const archived = {
      ...existing,
      isActive: false,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.update(archived);
  }

  async restore(tenantId: string, id: string): Promise<void> {
    const existing = await this.getById(tenantId, id);
    if (!existing) return;
    const restored = {
      ...existing,
      isActive: true,
      updatedAt: new Date().toISOString()
    };
    delete (restored as { deletedAt?: unknown }).deletedAt;
    await this.update(restored);
  }

  async forceDelete(tenantId: string, id: string): Promise<boolean> {
    const [result] = await this.pool.execute<{ affectedRows?: number }>(
      "DELETE FROM tenant_common_records WHERE tenant_id = ? AND module_key = ? AND record_id = ?",
      [tenantId, this.moduleKey, id]
    );
    return Number(result?.affectedRows ?? 0) > 0;
  }
}

type CommonRecordRow = {
  created_at: Date | string;
  deleted_at: Date | string | null;
  is_active: number | boolean;
  payload_json: string | Record<string, unknown>;
  updated_at: Date | string;
};

function recordValues(moduleKey: string, record: CommonRecord) {
  return [
    record.tenantId,
    moduleKey,
    record.id,
    record.isActive ? 1 : 0,
    JSON.stringify(record),
    toSqlTimestamp(record.createdAt),
    toSqlTimestamp(record.updatedAt),
    record.deletedAt ? toSqlTimestamp(record.deletedAt) : null
  ];
}

function rowToRecord<T extends CommonRecord>(row: CommonRecordRow): T {
  const payload = typeof row.payload_json === "string" ? JSON.parse(row.payload_json) : row.payload_json;
  return {
    ...payload,
    isActive: Boolean(row.is_active),
    createdAt: fromSqlTimestamp(row.created_at),
    updatedAt: fromSqlTimestamp(row.updated_at),
    ...(row.deleted_at ? { deletedAt: fromSqlTimestamp(row.deleted_at) } : {})
  } as T;
}

function toSqlTimestamp(value: string) {
  return value.includes("T") ? value.slice(0, 19).replace("T", " ") : value;
}

function fromSqlTimestamp(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
