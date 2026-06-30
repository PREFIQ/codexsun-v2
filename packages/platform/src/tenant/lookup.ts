import type { TenantProfile } from "./contracts.js";

export interface TenantDatabaseResolution {
  databaseName: string;
  tenantId: string;
}

export class TenantLookupService {
  constructor(
    private readonly db: {
      execute<TResult = unknown>(sql: string, values?: unknown[]): Promise<[TResult, unknown]>;
    }
  ) {}

  async findByCode(tenantCode: string): Promise<TenantProfile | null> {
    const [rows] = await this.db.execute<Array<{
      corporate_id: string | null;
      database_name: string | null;
      db_host: string | null;
      db_port: number | string | null;
      db_secret_ref: string | null;
      db_type: string | null;
      db_user: string | null;
      id: number | string;
      mobile: string | null;
      payload_settings: string | null;
      slug: string | null;
      status: TenantProfile["status"];
      tenant_code: string;
      tenant_name: string;
    }>>(
      `SELECT
        t.id, t.tenant_code, t.tenant_name, t.corporate_id, t.mobile, t.slug, t.payload_settings, t.status,
        d.db_type, d.db_host, d.db_port, d.database_name, d.db_user, d.db_secret_ref
       FROM tenants t
       LEFT JOIN tenant_databases d ON d.tenant_id = t.id
       WHERE t.tenant_code = ? LIMIT 1`,
      [tenantCode]
    );

    const row = rows[0];
    if (!row) return null;

    return {
      corporateId: row.corporate_id,
      dbHost: row.db_host ?? "localhost",
      dbName: row.database_name ?? `${row.tenant_code}_db`,
      dbPort: Number(row.db_port ?? 3306),
      dbSecretRef: row.db_secret_ref ?? "DB_PASSWORD",
      dbType: row.db_type ?? "mariadb",
      dbUser: row.db_user ?? "root",
      id: String(row.id),
      mobile: row.mobile,
      tenantCode: row.tenant_code,
      name: row.tenant_name,
      payloadSettings: parseJsonObject(row.payload_settings),
      slug: row.slug ?? row.tenant_code,
      status: row.status
    };
  }

  async resolveDatabase(tenantId: string): Promise<TenantDatabaseResolution | null> {
    const [rows] = await this.db.execute<Array<{ database_name: string }>>(
      "SELECT database_name FROM tenant_databases WHERE tenant_id = ? AND status = 'ready' LIMIT 1",
      [tenantId]
    );

    const row = rows[0];
    if (!row) return null;

    return {
      tenantId,
      databaseName: row.database_name
    };
  }
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
