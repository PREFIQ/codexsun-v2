import { describe, it, expect } from "vitest";
import { findModuleByKey, listModulesByScope, platformModuleCatalog } from "../catalog/contracts.js";

describe("Module Catalog Contracts", () => {
  it("should return all platform module keys", () => {
    const keys = platformModuleCatalog.map((m) => m.moduleKey);
    expect(keys).toContain("platform.tenants");
    expect(keys).toContain("platform.users");
    expect(keys).toContain("platform.roles");
    expect(keys).toContain("platform.permissions");
    expect(keys).toContain("platform.activation");
    expect(keys).toContain("platform.audit");
    expect(keys).toContain("platform.settings");
    expect(keys).toContain("platform.notifications");
  });

  it("should return future tenant module keys", () => {
    const keys = platformModuleCatalog.map((m) => m.moduleKey);
    expect(keys).toContain("business.contacts");
    expect(keys).toContain("business.items");
    expect(keys).toContain("business.billing");
    expect(keys).toContain("business.accounting");
    expect(keys).toContain("business.reports");
    expect(keys).toContain("business.offline-sync");
  });

  it("should find module by key", () => {
    const module = findModuleByKey("platform.tenants");
    expect(module).toBeDefined();
    expect(module!.displayName).toBe("Tenant Management");
    expect(module!.scope).toBe("platform");
  });

  it("should return undefined for unknown module key", () => {
    expect(findModuleByKey("unknown.module")).toBeUndefined();
  });

  it("should list modules by scope", () => {
    const platformModules = listModulesByScope("platform");
    expect(platformModules.length).toBeGreaterThan(0);
    expect(platformModules.every((m) => m.scope === "platform")).toBe(true);

    const tenantModules = listModulesByScope("tenant");
    expect(tenantModules.length).toBeGreaterThan(0);
    expect(tenantModules.every((m) => m.scope === "tenant")).toBe(true);
  });
});
