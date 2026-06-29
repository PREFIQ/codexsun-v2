export type PermissionAction =
  | "approve"
  | "assign"
  | "cancel"
  | "create"
  | "delete"
  | "export"
  | "import"
  | "manage"
  | "repair"
  | "sync"
  | "update"
  | "view";

export type PermissionDefinition = {
  action: PermissionAction;
  description?: string;
  module: string;
  permission: string;
  resource: string;
  scope: string;
};

export function buildPermissionName(input: Omit<PermissionDefinition, "permission">) {
  return `${input.scope}.${input.module}.${input.resource}.${input.action}`;
}

export const platformBasePermissions = [
  buildPermissionName({ action: "view", module: "tenant", resource: "profile", scope: "platform" }),
  buildPermissionName({ action: "manage", module: "tenant", resource: "profile", scope: "platform" }),
  buildPermissionName({ action: "view", module: "audit", resource: "activity", scope: "platform" }),
  buildPermissionName({ action: "manage", module: "activation", resource: "feature", scope: "platform" }),
  buildPermissionName({ action: "view", module: "user", resource: "profile", scope: "platform" }),
  buildPermissionName({ action: "manage", module: "user", resource: "profile", scope: "platform" }),
  buildPermissionName({ action: "view", module: "module", resource: "catalog", scope: "platform" }),
  buildPermissionName({ action: "manage", module: "module", resource: "activation", scope: "platform" }),
  buildPermissionName({ action: "view", module: "migration", resource: "status", scope: "platform" })
] as const;

export const platformPermissionsAll = [...platformBasePermissions];

export type UserType = "staff" | "super_admin" | "system" | "tenant";

export const rolePermissionMap: Record<UserType, string[]> = {
  super_admin: [...platformPermissionsAll],
  staff: [
    buildPermissionName({ action: "view", module: "tenant", resource: "profile", scope: "platform" }),
    buildPermissionName({ action: "view", module: "audit", resource: "activity", scope: "platform" }),
    buildPermissionName({ action: "view", module: "user", resource: "profile", scope: "platform" }),
    buildPermissionName({ action: "view", module: "module", resource: "catalog", scope: "platform" }),
    buildPermissionName({ action: "view", module: "migration", resource: "status", scope: "platform" })
  ],
  tenant: [],
  system: []
};

export function userTypeHasPermission(userType: UserType, permission: string): boolean {
  const allowed = rolePermissionMap[userType];
  if (!allowed) return false;
  return allowed.includes(permission);
}
