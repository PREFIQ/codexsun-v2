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
  buildPermissionName({ action: "manage", module: "activation", resource: "feature", scope: "platform" })
] as const;
