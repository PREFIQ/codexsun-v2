export type ActivationLevel = "app" | "feature" | "limit" | "module" | "provider_config";

export type ActivationRecord = {
  enabled: boolean;
  key: string;
  level: ActivationLevel;
  tenantId: string;
  value?: string | number | boolean;
};

export type ActivationChangeRisk = "high" | "normal" | "sensitive";

export function classifyActivationChange(key: string, enabled: boolean): ActivationChangeRisk {
  const sensitiveKeys = ["billing", "accounting", "einvoice", "ewaybill", "offline-sync"];

  if (!enabled && sensitiveKeys.some((item) => key.toLowerCase().includes(item))) {
    return "high";
  }

  if (!enabled) {
    return "sensitive";
  }

  return "normal";
}

export type ActivationStatus = "disabled" | "enabled" | "expired" | "suspended" | "trial";

export type TenantModuleActivation = {
  limits?: Record<string, unknown>;
  moduleKey: string;
  providerConfig?: Record<string, unknown>;
  status: ActivationStatus;
  tenantId: string;
};
