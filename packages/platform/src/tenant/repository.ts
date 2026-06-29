import type { TenantProfile } from "./contracts.js";

export type TenantRow = {
  id: number | string;
  created_at?: Date | string;
  tenant_code: string;
  tenant_name: string;
  status: string;
  updated_at?: Date | string;
};

export type IdRow = {
  id: number | string;
};

export type InsertResult = {
  insertId: number | string;
};

export interface TenantRepository {
  list(): Promise<TenantProfile[]>;
  getById(id: string): Promise<TenantProfile | null>;
  findByCode(code: string): Promise<TenantProfile | null>;
  create(input: { tenantCode: string; tenantName: string; status?: string }): Promise<string>;
  update(id: string, input: { tenantName?: string; status?: string }): Promise<boolean>;
  delete(id: string): Promise<boolean>;
  resolveDatabase(tenantId: string): Promise<{ databaseName: string } | null>;
}

export class MasterDbTenantRepository implements TenantRepository {
  constructor(
    private readonly db: {
      execute<TResult = unknown>(sql: string, values?: unknown[]): Promise<[TResult, unknown]>;
    }
  ) {}

  async list(): Promise<TenantProfile[]> {
    const [rows] = await this.db.execute<TenantRow[]>(
      "SELECT id, tenant_code, tenant_name, status FROM tenants ORDER BY created_at DESC"
    );
    return rows.map((row) => ({
      id: String(row.id),
      tenantCode: row.tenant_code,
      name: row.tenant_name,
      status: row.status as TenantProfile["status"]
    }));
  }

  async getById(id: string): Promise<TenantProfile | null> {
    const [rows] = await this.db.execute<TenantRow[]>(
      "SELECT id, tenant_code, tenant_name, status FROM tenants WHERE id = ?",
      [id]
    );
    const row = rows[0];
    if (!row) return null;
    return {
      id: String(row.id),
      tenantCode: row.tenant_code,
      name: row.tenant_name,
      status: row.status as TenantProfile["status"]
    };
  }

  async findByCode(code: string): Promise<TenantProfile | null> {
    const [rows] = await this.db.execute<TenantRow[]>(
      "SELECT id, tenant_code, tenant_name, status FROM tenants WHERE tenant_code = ? LIMIT 1",
      [code]
    );
    const row = rows[0];
    if (!row) return null;
    return {
      id: String(row.id),
      tenantCode: row.tenant_code,
      name: row.tenant_name,
      status: row.status as TenantProfile["status"]
    };
  }

  async create(input: { tenantCode: string; tenantName: string; status?: string }): Promise<string> {
    const [result] = await this.db.execute<InsertResult>(
      "INSERT INTO tenants (tenant_code, tenant_name, status) VALUES (?, ?, ?)",
      [input.tenantCode, input.tenantName, input.status || "active"]
    );
    return String(result.insertId);
  }

  async update(id: string, input: { tenantName?: string; status?: string }): Promise<boolean> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.tenantName !== undefined) {
      updates.push("tenant_name = ?");
      values.push(input.tenantName);
    }
    if (input.status !== undefined) {
      updates.push("status = ?");
      values.push(input.status);
    }

    if (updates.length === 0) return false;

    values.push(id);
    await this.db.execute(
      `UPDATE tenants SET ${updates.join(", ")} WHERE id = ?`,
      values
    );
    return true;
  }

  async delete(id: string): Promise<boolean> {
    const [existing] = await this.db.execute<IdRow[]>(
      "SELECT id FROM tenants WHERE id = ?",
      [id]
    );
    if (!existing[0]) return false;

    await this.db.execute("DELETE FROM tenants WHERE id = ?", [id]);
    return true;
  }

  async resolveDatabase(tenantId: string): Promise<{ databaseName: string } | null> {
    const [rows] = await this.db.execute<Array<{ database_name: string }>>(
      "SELECT database_name FROM tenant_databases WHERE tenant_id = ? AND status = 'ready' LIMIT 1",
      [tenantId]
    );
    const row = rows[0];
    if (!row) return null;
    return { databaseName: row.database_name };
  }
}
