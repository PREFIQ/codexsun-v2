import type { PlatformUserType } from "../users/index.js";

export type RoleDefinition = {
  key: string;
  label: string;
  system: boolean;
  userType: PlatformUserType;
};

export const tenantSystemRoles: RoleDefinition[] = [
  { key: "owner", label: "Owner", system: true, userType: "tenant" },
  { key: "admin", label: "Admin", system: true, userType: "tenant" },
  { key: "manager", label: "Manager", system: true, userType: "tenant" },
  { key: "accountant", label: "Accountant", system: true, userType: "tenant" },
  { key: "staff", label: "Staff", system: true, userType: "tenant" },
  { key: "viewer", label: "Viewer", system: true, userType: "tenant" }
];

export const staffSystemRoles: RoleDefinition[] = [
  { key: "support", label: "Support", system: true, userType: "staff" },
  { key: "support_manager", label: "Support Manager", system: true, userType: "staff" },
  { key: "marketing", label: "Marketing", system: true, userType: "staff" },
  { key: "operations", label: "Operations", system: true, userType: "staff" },
  { key: "developer", label: "Developer", system: true, userType: "staff" },
  { key: "admin", label: "Admin", system: true, userType: "staff" }
];

export const superAdminSystemRoles: RoleDefinition[] = [
  { key: "super_admin", label: "Super Admin", system: true, userType: "super_admin" },
  { key: "system_operator", label: "System Operator", system: true, userType: "super_admin" }
];
