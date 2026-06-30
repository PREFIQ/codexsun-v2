export type TenantStatus = "active" | "inactive" | "provisioning" | "suspended";

export type TenantProfile = {
  corporateId: string | null;
  dbHost: string;
  dbName: string;
  dbPort: number;
  dbSecretRef: string;
  dbType: string;
  dbUser: string;
  id: string;
  mobile: string | null;
  name: string;
  payloadSettings: Record<string, unknown>;
  slug: string;
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
