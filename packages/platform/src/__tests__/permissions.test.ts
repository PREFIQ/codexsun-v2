import { describe, it, expect } from "vitest";
import {
  buildPermissionName,
  userTypeHasPermission,
  platformPermissionsAll
} from "../permissions/contracts.js";

describe("Permission Contracts", () => {
  it("should build correct permission names", () => {
    expect(buildPermissionName({ action: "view", module: "tenant", resource: "profile", scope: "platform" }))
      .toBe("platform.tenant.profile.view");
    expect(buildPermissionName({ action: "manage", module: "tenant", resource: "profile", scope: "platform" }))
      .toBe("platform.tenant.profile.manage");
  });

  it("should allow super_admin for all platform permissions", () => {
    for (const permission of platformPermissionsAll) {
      expect(userTypeHasPermission("super_admin", permission)).toBe(true);
    }
  });

  it("should deny staff for manage permissions", () => {
    expect(userTypeHasPermission("staff", "platform.tenant.profile.manage")).toBe(false);
    expect(userTypeHasPermission("staff", "platform.activation.feature.manage")).toBe(false);
    expect(userTypeHasPermission("staff", "platform.module.activation.manage")).toBe(false);
  });

  it("should allow staff for view permissions", () => {
    expect(userTypeHasPermission("staff", "platform.tenant.profile.view")).toBe(true);
    expect(userTypeHasPermission("staff", "platform.audit.activity.view")).toBe(true);
    expect(userTypeHasPermission("staff", "platform.user.profile.view")).toBe(true);
    expect(userTypeHasPermission("staff", "platform.module.catalog.view")).toBe(true);
  });

  it("should deny tenant for all platform admin permissions", () => {
    for (const permission of platformPermissionsAll) {
      expect(userTypeHasPermission("tenant", permission)).toBe(false);
    }
  });

  it("should return false for unknown user types", () => {
    expect(userTypeHasPermission("system" as never, "platform.tenant.profile.view")).toBe(false);
  });
});
