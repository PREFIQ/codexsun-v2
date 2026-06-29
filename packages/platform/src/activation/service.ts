import { AppError } from "@codexsun/framework/errors";
import type { CompatibleDbPool } from "@codexsun/framework/db";

export type ActivationStatus = "disabled" | "enabled" | "expired" | "suspended" | "trial";

export type TenantModuleActivation = {
  limits?: Record<string, unknown>;
  moduleKey: string;
  providerConfig?: Record<string, unknown>;
  status: ActivationStatus;
  tenantId: string;
};

export class ActivationService {
  constructor(private readonly db: CompatibleDbPool) {}

  async getActivation(tenantId: string, moduleKey: string): Promise<TenantModuleActivation | null> {
    const [rows] = await this.db.execute<Array<{
      id: number | string;
      limits: string | null;
      module_key: string;
      provider_config: string | null;
      status: string;
    }>>(
      "SELECT module_key, status, limits, provider_config FROM tenant_module_activation WHERE tenant_id = ? AND module_key = ? LIMIT 1",
      [tenantId, moduleKey]
    );
    const row = rows[0];
    if (!row) return null;
    return {
      moduleKey: row.module_key,
      status: row.status as ActivationStatus,
      tenantId,
      ...(row.limits ? { limits: JSON.parse(row.limits) as Record<string, unknown> } : {}),
      ...(row.provider_config ? { providerConfig: JSON.parse(row.provider_config) as Record<string, unknown> } : {})
    };
  }

  async isEnabled(tenantId: string, moduleKey: string): Promise<boolean> {
    const activation = await this.getActivation(tenantId, moduleKey);
    return activation?.status === "enabled" || activation?.status === "trial";
  }

  async requireEnabled(tenantId: string, moduleKey: string): Promise<void> {
    if (!(await this.isEnabled(tenantId, moduleKey))) {
      throw AppError.forbidden(`Module is not enabled: ${moduleKey}`);
    }
  }

  async isTenantActive(tenantId: string): Promise<boolean> {
    const [rows] = await this.db.execute<Array<{ status: string }>>(
      "SELECT status FROM tenants WHERE id = ? LIMIT 1",
      [tenantId]
    );
    const row = rows[0];
    return row?.status === "active";
  }

  async requireTenantActive(tenantId: string): Promise<void> {
    if (!(await this.isTenantActive(tenantId))) {
      throw AppError.forbidden("Tenant is not active");
    }
  }
}
