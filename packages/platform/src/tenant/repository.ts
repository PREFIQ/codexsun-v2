import type { TenantProfile } from "./contracts.js";

export type TenantRow = {
  corporate_id?: string | null;
  id: number | string;
  created_at?: Date | string;
  database_name?: string | null;
  db_host?: string | null;
  db_port?: number | string | null;
  db_secret_ref?: string | null;
  db_type?: string | null;
  db_user?: string | null;
  mobile?: string | null;
  payload_settings?: string | null;
  slug?: string | null;
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
  create(input: TenantWriteInput): Promise<string>;
  update(id: string, input: Partial<TenantWriteInput>): Promise<boolean>;
  delete(id: string): Promise<boolean>;
  resolveDatabase(tenantId: string): Promise<{ databaseName: string } | null>;
}

export type TenantWriteInput = {
  corporateId?: string | null;
  dbHost?: string;
  dbName?: string;
  dbPort?: number;
  dbSecretRef?: string;
  dbType?: string;
  dbUser?: string;
  mobile?: string | null;
  payloadSettings?: Record<string, unknown>;
  slug?: string;
  status?: string;
  tenantCode: string;
  tenantName: string;
};

export class MasterDbTenantRepository implements TenantRepository {
  constructor(
    private readonly db: {
      execute<TResult = unknown>(sql: string, values?: unknown[]): Promise<[TResult, unknown]>;
    }
  ) {}

  async list(): Promise<TenantProfile[]> {
    const [rows] = await this.db.execute<TenantRow[]>(
      `SELECT
        t.id, t.tenant_code, t.tenant_name, t.corporate_id, t.mobile, t.slug, t.payload_settings, t.status,
        d.db_type, d.db_host, d.db_port, d.database_name, d.db_user, d.db_secret_ref
       FROM tenants t
       LEFT JOIN tenant_databases d ON d.tenant_id = t.id
       ORDER BY t.created_at DESC`
    );
    return rows.map(toTenantProfile);
  }

  async getById(id: string): Promise<TenantProfile | null> {
    const [rows] = await this.db.execute<TenantRow[]>(
      `SELECT
        t.id, t.tenant_code, t.tenant_name, t.corporate_id, t.mobile, t.slug, t.payload_settings, t.status,
        d.db_type, d.db_host, d.db_port, d.database_name, d.db_user, d.db_secret_ref
       FROM tenants t
       LEFT JOIN tenant_databases d ON d.tenant_id = t.id
       WHERE t.id = ?`,
      [id]
    );
    const row = rows[0];
    if (!row) return null;
    return toTenantProfile(row);
  }

  async findByCode(code: string): Promise<TenantProfile | null> {
    const [rows] = await this.db.execute<TenantRow[]>(
      `SELECT
        t.id, t.tenant_code, t.tenant_name, t.corporate_id, t.mobile, t.slug, t.payload_settings, t.status,
        d.db_type, d.db_host, d.db_port, d.database_name, d.db_user, d.db_secret_ref
       FROM tenants t
       LEFT JOIN tenant_databases d ON d.tenant_id = t.id
       WHERE t.tenant_code = ? LIMIT 1`,
      [code]
    );
    const row = rows[0];
    if (!row) return null;
    return toTenantProfile(row);
  }

  async create(input: TenantWriteInput): Promise<string> {
    const [result] = await this.db.execute<InsertResult>(
      "INSERT INTO tenants (tenant_code, tenant_name, corporate_id, mobile, slug, payload_settings, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        input.tenantCode,
        input.tenantName,
        input.corporateId ?? null,
        input.mobile ?? null,
        input.slug ?? input.tenantCode,
        JSON.stringify(input.payloadSettings ?? {}),
        input.status || "active"
      ]
    );
    const id = String(result.insertId);
    await this.upsertDatabase(id, input);
    return id;
  }

  async update(id: string, input: Partial<TenantWriteInput>): Promise<boolean> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.tenantCode !== undefined) {
      updates.push("tenant_code = ?");
      values.push(input.tenantCode);
    }
    if (input.tenantName !== undefined) {
      updates.push("tenant_name = ?");
      values.push(input.tenantName);
    }
    if (input.corporateId !== undefined) {
      updates.push("corporate_id = ?");
      values.push(input.corporateId);
    }
    if (input.mobile !== undefined) {
      updates.push("mobile = ?");
      values.push(input.mobile);
    }
    if (input.slug !== undefined) {
      updates.push("slug = ?");
      values.push(input.slug);
    }
    if (input.payloadSettings !== undefined) {
      updates.push("payload_settings = ?");
      values.push(JSON.stringify(input.payloadSettings));
    }
    if (input.status !== undefined) {
      updates.push("status = ?");
      values.push(input.status);
    }

    if (updates.length > 0) {
      values.push(id);
      await this.db.execute(
        `UPDATE tenants SET ${updates.join(", ")} WHERE id = ?`,
        values
      );
    }
    await this.upsertDatabase(id, input);
    return true;
  }

  private async upsertDatabase(id: string, input: Partial<TenantWriteInput>): Promise<void> {
    if (
      input.dbName === undefined &&
      input.dbType === undefined &&
      input.dbHost === undefined &&
      input.dbPort === undefined &&
      input.dbUser === undefined &&
      input.dbSecretRef === undefined
    ) {
      return;
    }

    const databaseName = input.dbName ?? `${input.tenantCode ?? id}_db`;
    await this.db.execute(
      `INSERT INTO tenant_databases (tenant_id, db_type, db_host, db_port, database_name, db_user, db_secret_ref, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ready')
       ON DUPLICATE KEY UPDATE
         db_type = VALUES(db_type),
         db_host = VALUES(db_host),
         db_port = VALUES(db_port),
         database_name = VALUES(database_name),
         db_user = VALUES(db_user),
         db_secret_ref = VALUES(db_secret_ref),
         status = 'ready'`,
      [
        id,
        input.dbType ?? "mariadb",
        input.dbHost ?? "localhost",
        input.dbPort ?? 3306,
        databaseName,
        input.dbUser ?? "root",
        input.dbSecretRef ?? "DB_PASSWORD"
      ]
    );
  }

  async delete(id: string): Promise<boolean> {
    const [existing] = await this.db.execute<IdRow[]>(
      "SELECT id FROM tenants WHERE id = ?",
      [id]
    );
    if (!existing[0]) return false;

    await this.db.execute("UPDATE tenants SET status = 'inactive' WHERE id = ?", [id]);
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

function toTenantProfile(row: TenantRow): TenantProfile {
  return {
    corporateId: row.corporate_id ?? null,
    dbHost: row.db_host ?? "localhost",
    dbName: row.database_name ?? `${row.tenant_code}_db`,
    dbPort: Number(row.db_port ?? 3306),
    dbSecretRef: row.db_secret_ref ?? "DB_PASSWORD",
    dbType: row.db_type ?? "mariadb",
    dbUser: row.db_user ?? "root",
    id: String(row.id),
    mobile: row.mobile ?? null,
    name: row.tenant_name,
    payloadSettings: parseJsonObject(row.payload_settings),
    slug: row.slug ?? row.tenant_code,
    status: row.status as TenantProfile["status"],
    tenantCode: row.tenant_code
  };
}

function parseJsonObject(value: string | null | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}
