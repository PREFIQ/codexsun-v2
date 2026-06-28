export type PlatformUserType = "staff" | "super_admin" | "tenant";

export type PlatformUserStatus = "active" | "disabled" | "invited" | "locked";

export type PlatformUser = {
  displayName: string;
  email: string;
  id: string;
  status: PlatformUserStatus;
  tenantId?: string;
  userType: PlatformUserType;
};
