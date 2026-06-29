import { AppError } from "@codexsun/framework/errors";
import type { CompatibleDbPool } from "@codexsun/framework/db";
import { findModuleByKey, listModulesByScope, platformModuleCatalog, type CatalogModuleRecord } from "./contracts.js";

export class ModuleCatalogService {
  constructor(private readonly db: CompatibleDbPool) {}

  getAll(): CatalogModuleRecord[] {
    return platformModuleCatalog;
  }

  getByKey(moduleKey: string): CatalogModuleRecord {
    const record = findModuleByKey(moduleKey);
    if (!record) {
      throw AppError.notFound(`Module not found: ${moduleKey}`);
    }
    return record;
  }

  listByScope(scope: "industry" | "integration" | "platform" | "tenant"): CatalogModuleRecord[] {
    return listModulesByScope(scope);
  }

  async getTenantEnabledModules(tenantId: string): Promise<CatalogModuleRecord[]> {
    const [rows] = await this.db.execute<Array<{ module_key: string; status: string }>>(
      "SELECT module_key, status FROM tenant_module_activation WHERE tenant_id = ? AND status = 'enabled'",
      [tenantId]
    );
    return rows
      .map((row) => findModuleByKey(row.module_key))
      .filter((m): m is CatalogModuleRecord => m !== undefined);
  }

  async isModuleEnabledForTenant(tenantId: string, moduleKey: string): Promise<boolean> {
    const [rows] = await this.db.execute<Array<{ id: number | string }>>(
      "SELECT id FROM tenant_module_activation WHERE tenant_id = ? AND module_key = ? AND status = 'enabled' LIMIT 1",
      [tenantId, moduleKey]
    );
    return rows.length > 0;
  }
}
