import type { ModuleScope } from "@codexsun/framework/modules";

export type CatalogModuleRecord = {
  displayName: string;
  moduleKey: string;
  requiredFeatureKey?: string;
  scope: ModuleScope;
  version: string;
};

export const platformModuleCatalog: CatalogModuleRecord[] = [
  { moduleKey: "platform.tenants", displayName: "Tenant Management", scope: "platform", version: "1.0.0" },
  { moduleKey: "platform.users", displayName: "User Management", scope: "platform", version: "1.0.0" },
  { moduleKey: "platform.roles", displayName: "Role Management", scope: "platform", version: "1.0.0" },
  { moduleKey: "platform.permissions", displayName: "Permission Management", scope: "platform", version: "1.0.0" },
  { moduleKey: "platform.activation", displayName: "Feature Activation", scope: "platform", version: "1.0.0" },
  { moduleKey: "platform.audit", displayName: "Audit Trail", scope: "platform", version: "1.0.0" },
  { moduleKey: "platform.settings", displayName: "Platform Settings", scope: "platform", version: "1.0.0" },
  { moduleKey: "platform.notifications", displayName: "Notifications", scope: "platform", version: "1.0.0" },
  { moduleKey: "core", displayName: "Core Modules", scope: "tenant", version: "1.0.0" },
  { moduleKey: "core.contact", displayName: "Contacts", scope: "tenant", version: "1.0.0" },
  { moduleKey: "core.company", displayName: "Companies", scope: "tenant", version: "1.0.0" },
  { moduleKey: "core.product", displayName: "Products", scope: "tenant", version: "1.0.0" },
  { moduleKey: "business.items", displayName: "Items / Products", scope: "tenant", version: "1.0.0" },
  { moduleKey: "business.billing", displayName: "Billing", scope: "tenant", version: "1.0.0" },
  { moduleKey: "business.accounting", displayName: "Accounting", scope: "tenant", version: "1.0.0" },
  { moduleKey: "business.reports", displayName: "Reports", scope: "tenant", version: "1.0.0" },
  { moduleKey: "business.offline-sync", displayName: "Offline Sync", scope: "tenant", version: "1.0.0" },
  { moduleKey: "app.zetro", displayName: "ZETRO", scope: "tenant", version: "1.0.0" },
  { moduleKey: "app.mail", displayName: "Mail", scope: "tenant", version: "1.0.0" },
  { moduleKey: "app.blog", displayName: "Blog", scope: "tenant", version: "1.0.0" },
  { moduleKey: "app.sites", displayName: "Sites", scope: "tenant", version: "1.0.0" }
];

export function findModuleByKey(moduleKey: string): CatalogModuleRecord | undefined {
  return platformModuleCatalog.find((m) => m.moduleKey === moduleKey);
}

export function listModulesByScope(scope: ModuleScope): CatalogModuleRecord[] {
  return platformModuleCatalog.filter((m) => m.scope === scope);
}
