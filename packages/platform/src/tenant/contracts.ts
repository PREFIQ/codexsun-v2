export type TenantStatus = "active" | "inactive" | "provisioning" | "suspended";

export type TenantProfile = {
  id: string;
  name: string;
  status: TenantStatus;
  tenantCode: string;
};

export type TenantDatabaseMapping = {
  databaseName: string;
  status: "failed" | "pending" | "ready";
  tenantId: string;
};

export type TenantContext = {
  activeFeatures: string[];
  activeModules: string[];
  databaseName: string;
  tenantCode: string;
  tenantId: string;
};
