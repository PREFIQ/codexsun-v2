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
      id: number | string;
      status: TenantProfile["status"];
      tenant_code: string;
      tenant_name: string;
    }>>(
      "SELECT id, tenant_code, tenant_name, status FROM tenants WHERE tenant_code = ? LIMIT 1",
      [tenantCode]
    );

    const row = rows[0];
    if (!row) return null;

    return {
      id: String(row.id),
      tenantCode: row.tenant_code,
      name: row.tenant_name,
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
