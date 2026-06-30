import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { createApp } from "../app.js";
import { hashPassword } from "@codexsun/platform/auth";

describe("Admin Endpoints", () => {
  let app: FastifyInstance;
  let saToken: string;

  beforeAll(async () => {
    app = await createApp();
    await app.ready();

    const hash = hashPassword("test-sa-pass", "codexsun-super-admin");
    await app.masterDbPool.execute(
      `INSERT INTO super_admin_users (display_name, email, password_hash)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      ["Test SA Admin", "test-admin-sa@codexsun.com", hash]
    );

    const loginRes = await app.inject({
      method: "POST",
      url: "/auth/login",
      body: { desk: "sa", email: "test-admin-sa@codexsun.com", password: "test-sa-pass" }
    });
    saToken = JSON.parse(loginRes.body).data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Console Dashboard ──────────────────────────────────────────
  it("GET /admin/console returns dashboard stats", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/console",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.tenants).toBeDefined();
    expect(typeof body.data.enabledModules).toBe("number");
    expect(typeof body.data.recentAudits).toBe("number");
  });

  it("GET /admin/console rejects non-super-admin", async () => {
    const res = await app.inject({ method: "GET", url: "/admin/console" });
    expect(res.statusCode).toBe(401);
  });

  // ── Tenant Registry ────────────────────────────────────────────
  it("GET /admin/tenants lists tenants", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/tenants",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("POST /admin/tenants creates a tenant", async () => {
    const code = "test-" + Date.now();
    const res = await app.inject({
      method: "POST",
      url: "/admin/tenants",
      headers: { Authorization: `Bearer ${saToken}` },
      body: { tenantCode: code, tenantName: "Admin Test Tenant" }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.tenantCode).toBe(code.toLowerCase());
  });

  it("POST /admin/tenants/:id/suspend suspends a tenant", async () => {
    const listRes = await app.inject({
      method: "GET",
      url: "/admin/tenants",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    const tenants = JSON.parse(listRes.body).data;
    const tenant = tenants.find((t: { tenantCode: string }) => t.tenantCode.startsWith("test-"));
    const res = await app.inject({
      method: "POST",
      url: `/admin/tenants/${tenant.id}/suspend`,
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.status).toBe("suspended");
  });

  it("POST /admin/tenants/:id/restore restores a tenant", async () => {
    const listRes = await app.inject({
      method: "GET",
      url: "/admin/tenants",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    const tenants = JSON.parse(listRes.body).data;
    const tenant = tenants.find((t: { status: string }) => t.status === "suspended");
    const res = await app.inject({
      method: "POST",
      url: `/admin/tenants/${tenant.id}/restore`,
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.status).toBe("active");
  });

  // ── Module Activation ──────────────────────────────────────────
  it("POST and DELETE /admin/domains persist and force delete a tenant domain mapping", async () => {
    const code = "domain-test-" + Date.now();
    const tenantRes = await app.inject({
      method: "POST",
      url: "/admin/tenants",
      headers: { Authorization: `Bearer ${saToken}` },
      body: { tenantCode: code, tenantName: "Domain Test Tenant" }
    });
    expect(tenantRes.statusCode).toBe(200);
    const tenant = JSON.parse(tenantRes.body).data;

    const domainName = `${code}.local`;
    const createRes = await app.inject({
      method: "POST",
      url: "/admin/domains",
      headers: { Authorization: `Bearer ${saToken}` },
      body: {
        domainName,
        isPrimary: true,
        landingApp: "Billing",
        status: "active",
        tenantId: tenant.id
      }
    });
    expect(createRes.statusCode).toBe(200);
    const created = JSON.parse(createRes.body).data;
    expect(created.domainName).toBe(domainName);
    expect(created.tenantCode).toBe(code);
    expect(created.isPrimary).toBe(true);

    const listRes = await app.inject({
      method: "GET",
      url: "/admin/domains",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(listRes.statusCode).toBe(200);
    const domains = JSON.parse(listRes.body).data;
    expect(domains.some((item: { domainName: string }) => item.domainName === domainName)).toBe(true);

    const deleteRes = await app.inject({
      method: "DELETE",
      url: `/admin/domains/${created.id}`,
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(deleteRes.statusCode).toBe(200);
    expect(JSON.parse(deleteRes.body).data.deleted).toBe(true);

    const afterDeleteRes = await app.inject({
      method: "GET",
      url: "/admin/domains",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(afterDeleteRes.statusCode).toBe(200);
    const domainsAfterDelete = JSON.parse(afterDeleteRes.body).data;
    expect(domainsAfterDelete.some((item: { domainName: string }) => item.domainName === domainName)).toBe(false);
  });

  it("POST and PUT /admin/subscriptions persist tenant subscription details", async () => {
    const code = "subscription-test-" + Date.now();
    const tenantRes = await app.inject({
      method: "POST",
      url: "/admin/tenants",
      headers: { Authorization: `Bearer ${saToken}` },
      body: { tenantCode: code, tenantName: "Subscription Test Tenant" }
    });
    expect(tenantRes.statusCode).toBe(200);
    const tenant = JSON.parse(tenantRes.body).data;

    const createRes = await app.inject({
      method: "POST",
      url: "/admin/subscriptions",
      headers: { Authorization: `Bearer ${saToken}` },
      body: {
        amount: 2500,
        billingCycle: "Monthly",
        currency: "INR",
        planName: "Professional",
        renewsOn: "2026-07-31",
        seats: 25,
        startsOn: "2026-07-01",
        status: "active",
        tenantId: tenant.id
      }
    });
    expect(createRes.statusCode).toBe(200);
    const created = JSON.parse(createRes.body).data;
    expect(created.planName).toBe("Professional");
    expect(created.tenantCode).toBe(code);
    expect(created.billingCycle).toBe("Monthly");
    expect(created.seats).toBe(25);

    const updateRes = await app.inject({
      method: "PUT",
      url: `/admin/subscriptions/${created.id}`,
      headers: { Authorization: `Bearer ${saToken}` },
      body: {
        billingCycle: "Yearly",
        planName: "Enterprise",
        seats: 50,
        status: "trial",
        tenantId: tenant.id
      }
    });
    expect(updateRes.statusCode).toBe(200);
    const updated = JSON.parse(updateRes.body).data;
    expect(updated.planName).toBe("Enterprise");
    expect(updated.billingCycle).toBe("Yearly");
    expect(updated.status).toBe("trial");

    const listRes = await app.inject({
      method: "GET",
      url: "/admin/subscriptions",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(listRes.statusCode).toBe(200);
    const subscriptions = JSON.parse(listRes.body).data;
    expect(subscriptions.some((item: { id: string }) => item.id === created.id)).toBe(true);

    const deleteRes = await app.inject({
      method: "DELETE",
      url: `/admin/subscriptions/${created.id}`,
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(deleteRes.statusCode).toBe(200);
    expect(JSON.parse(deleteRes.body).data.deleted).toBe(true);
  });

  it("POST and PUT /admin/subscription-plans persist reusable plans", async () => {
    const planName = "Plan Test " + Date.now();
    const createRes = await app.inject({
      method: "POST",
      url: "/admin/subscription-plans",
      headers: { Authorization: `Bearer ${saToken}` },
      body: {
        amount: 1500,
        billingCycle: "Monthly",
        currency: "INR",
        description: "Reusable plan for tests",
        planName,
        seats: 10,
        status: "active"
      }
    });
    expect(createRes.statusCode).toBe(200);
    const created = JSON.parse(createRes.body).data;
    expect(created.planName).toBe(planName);
    expect(created.billingCycle).toBe("Monthly");

    const updateRes = await app.inject({
      method: "PUT",
      url: `/admin/subscription-plans/${created.id}`,
      headers: { Authorization: `Bearer ${saToken}` },
      body: {
        amount: 12000,
        billingCycle: "Yearly",
        planName,
        seats: 25,
        status: "trial"
      }
    });
    expect(updateRes.statusCode).toBe(200);
    const updated = JSON.parse(updateRes.body).data;
    expect(updated.billingCycle).toBe("Yearly");
    expect(updated.seats).toBe(25);
    expect(updated.status).toBe("trial");

    const listRes = await app.inject({
      method: "GET",
      url: "/admin/subscription-plans",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(listRes.statusCode).toBe(200);
    const plans = JSON.parse(listRes.body).data;
    expect(plans.some((item: { id: string }) => item.id === created.id)).toBe(true);

    const deleteRes = await app.inject({
      method: "DELETE",
      url: `/admin/subscription-plans/${created.id}`,
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(deleteRes.statusCode).toBe(200);
    expect(JSON.parse(deleteRes.body).data.deleted).toBe(true);
  });

  it("DELETE /admin/subscription-plans blocks plans used by subscriptions", async () => {
    const planName = "Protected Plan " + Date.now();
    const planRes = await app.inject({
      method: "POST",
      url: "/admin/subscription-plans",
      headers: { Authorization: `Bearer ${saToken}` },
      body: { billingCycle: "Monthly", planName, seats: 5, status: "active" }
    });
    expect(planRes.statusCode).toBe(200);
    const plan = JSON.parse(planRes.body).data;

    const code = "protected-sub-" + Date.now();
    const tenantRes = await app.inject({
      method: "POST",
      url: "/admin/tenants",
      headers: { Authorization: `Bearer ${saToken}` },
      body: { tenantCode: code, tenantName: "Protected Subscription Tenant" }
    });
    expect(tenantRes.statusCode).toBe(200);
    const tenant = JSON.parse(tenantRes.body).data;

    const subRes = await app.inject({
      method: "POST",
      url: "/admin/subscriptions",
      headers: { Authorization: `Bearer ${saToken}` },
      body: { billingCycle: "Monthly", planName, seats: 5, status: "active", tenantId: tenant.id }
    });
    expect(subRes.statusCode).toBe(200);

    const blockedDeleteRes = await app.inject({
      method: "DELETE",
      url: `/admin/subscription-plans/${plan.id}`,
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(blockedDeleteRes.statusCode).toBe(409);
  });

  it("POST and PUT /admin/platform-apps persist platform app records", async () => {
    const moduleKey = "test.app." + Date.now();
    const createRes = await app.inject({
      method: "POST",
      url: "/admin/platform-apps",
      headers: { Authorization: `Bearer ${saToken}` },
      body: {
        defaultEnabled: true,
        displayName: "Test App",
        moduleKey,
        scope: "tenant",
        status: "active",
        version: "1.0.0"
      }
    });
    expect(createRes.statusCode).toBe(200);
    const created = JSON.parse(createRes.body).data;
    expect(created.moduleKey).toBe(moduleKey);
    expect(created.defaultEnabled).toBe(true);

    const updateRes = await app.inject({
      method: "PUT",
      url: `/admin/platform-apps/${encodeURIComponent(moduleKey)}`,
      headers: { Authorization: `Bearer ${saToken}` },
      body: {
        defaultEnabled: false,
        displayName: "Updated Test App",
        moduleKey,
        scope: "industry",
        status: "planned",
        version: "1.1.0"
      }
    });
    expect(updateRes.statusCode).toBe(200);
    const updated = JSON.parse(updateRes.body).data;
    expect(updated.displayName).toBe("Updated Test App");
    expect(updated.scope).toBe("industry");
    expect(updated.defaultEnabled).toBe(false);

    const listRes = await app.inject({
      method: "GET",
      url: "/admin/platform-apps",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(listRes.statusCode).toBe(200);
    const appRecords = JSON.parse(listRes.body).data;
    expect(appRecords.some((item: { moduleKey: string }) => item.moduleKey === moduleKey)).toBe(true);

    const deleteRes = await app.inject({
      method: "DELETE",
      url: `/admin/platform-apps/${encodeURIComponent(moduleKey)}`,
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(deleteRes.statusCode).toBe(200);
    expect(JSON.parse(deleteRes.body).data.deleted).toBe(true);
  });

  it("GET /admin/activity/:module/:recordId returns matching audit events", async () => {
    const moduleKey = "activity.app." + Date.now();
    const createRes = await app.inject({
      method: "POST",
      url: "/admin/platform-apps",
      headers: { Authorization: `Bearer ${saToken}` },
      body: {
        displayName: "Activity App",
        moduleKey,
        scope: "tenant",
        status: "active",
        version: "1.0.0"
      }
    });
    expect(createRes.statusCode).toBe(200);

    const activityRes = await app.inject({
      method: "GET",
      url: `/admin/activity/app/${encodeURIComponent(moduleKey)}`,
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(activityRes.statusCode).toBe(200);
    const activity = JSON.parse(activityRes.body).data;
    expect(activity.some((item: { event_name: string }) => item.event_name === "platform.app.added")).toBe(true);

    await app.inject({
      method: "DELETE",
      url: `/admin/platform-apps/${encodeURIComponent(moduleKey)}`,
      headers: { Authorization: `Bearer ${saToken}` }
    });
  });

  it("POST and PUT /admin/industries persist industry records", async () => {
    const code = "industry-test-" + Date.now();
    const createRes = await app.inject({
      method: "POST",
      url: "/admin/industries",
      headers: { Authorization: `Bearer ${saToken}` },
      body: {
        defaultTemplate: "Retail template",
        industryCode: code,
        industryName: "Industry Test",
        segment: "Retail",
        status: "active"
      }
    });
    expect(createRes.statusCode).toBe(200);
    const created = JSON.parse(createRes.body).data;
    expect(created.industryCode).toBe(code);
    expect(created.segment).toBe("Retail");

    const updateRes = await app.inject({
      method: "PUT",
      url: `/admin/industries/${created.id}`,
      headers: { Authorization: `Bearer ${saToken}` },
      body: {
        defaultTemplate: "Manufacturing template",
        industryCode: code,
        industryName: "Updated Industry Test",
        segment: "Manufacturing",
        status: "planned"
      }
    });
    expect(updateRes.statusCode).toBe(200);
    const updated = JSON.parse(updateRes.body).data;
    expect(updated.industryName).toBe("Updated Industry Test");
    expect(updated.segment).toBe("Manufacturing");
    expect(updated.status).toBe("planned");

    const listRes = await app.inject({
      method: "GET",
      url: "/admin/industries",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(listRes.statusCode).toBe(200);
    const industries = JSON.parse(listRes.body).data;
    expect(industries.some((item: { industryCode: string }) => item.industryCode === code)).toBe(true);

    const deleteRes = await app.inject({
      method: "DELETE",
      url: `/admin/industries/${created.id}`,
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(deleteRes.statusCode).toBe(200);
    expect(JSON.parse(deleteRes.body).data.deleted).toBe(true);
  });

  it("GET /admin/modules/catalog returns module catalog", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/modules/catalog",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it("POST /admin/modules/tenant/:tenantId/enable enables a module", async () => {
    const listRes = await app.inject({
      method: "GET",
      url: "/admin/tenants",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    const tenants = JSON.parse(listRes.body).data;
    const testTenant = tenants.find((t: { tenantCode: string }) => t.tenantCode.startsWith("test-"));
    const res = await app.inject({
      method: "POST",
      url: `/admin/modules/tenant/${testTenant.id}/enable`,
      headers: { Authorization: `Bearer ${saToken}` },
      body: { moduleKey: "platform.audit" }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.enabled).toBe(true);
  });

  // ── Audit Viewer ───────────────────────────────────────────────
  it("GET /admin/audit returns audit events", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/audit",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("GET /admin/audit filters by event name", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/audit?eventName=tenant.created",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
  });

  it("GET /admin/audit/actors returns actor list", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/audit/actors",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.data)).toBe(true);
  });

  // ── Migration Status ───────────────────────────────────────────
  it("GET /admin/migrations returns migration records", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/migrations",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("GET /admin/database-operations/preflight returns migration safety checks", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/database-operations/preflight",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(typeof body.data.allowed).toBe("boolean");
    expect(Array.isArray(body.data.checks)).toBe(true);
  });

  it("POST /admin/database-operations/backups records a verified backup checkpoint", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/admin/database-operations/backups",
      headers: { Authorization: `Bearer ${saToken}` },
      body: { databaseName: "codexsun_master_db", scope: "platform" }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.status).toBe("verified");
    expect(body.data.checksum).toBeTruthy();
  });

  it("POST /admin/legacy-import/mappings and dry-run track legacy migration readiness", async () => {
    const clientKey = "legacy-test-" + Date.now();
    const mappingRes = await app.inject({
      method: "POST",
      url: "/admin/legacy-import/mappings",
      headers: { Authorization: `Bearer ${saToken}` },
      body: {
        clientKey,
        conflictRule: "report",
        sourceColumn: "name",
        sourceTable: "customers",
        targetColumn: "name",
        targetModule: "contacts",
        targetTable: "masters_contacts",
        transformRule: "trim"
      }
    });
    expect(mappingRes.statusCode).toBe(200);

    const dryRunRes = await app.inject({
      method: "POST",
      url: "/admin/legacy-import/dry-run",
      headers: { Authorization: `Bearer ${saToken}` },
      body: { clientKey }
    });
    expect(dryRunRes.statusCode).toBe(200);
    const body = JSON.parse(dryRunRes.body);
    expect(body.data.status).toBe("completed");
    expect(body.data.summary.mappingCount).toBeGreaterThan(0);
  });

  // ── System Health ──────────────────────────────────────────────
  it("GET /admin/health returns health status", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/health",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.api).toBeDefined();
    expect(body.data.database).toBeDefined();
    expect(body.data.modules).toBeDefined();
  });

  // ── Platform Users ─────────────────────────────────────────────
  it("GET /admin/users/:userType lists users", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/users/super_admin",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("POST /admin/users creates a new user", async () => {
    const email = `new-user-${Date.now()}@codexsun.com`;
    const res = await app.inject({
      method: "POST",
      url: "/admin/users",
      headers: { Authorization: `Bearer ${saToken}` },
      body: { displayName: "New User", email, password: "test-pass-123", userType: "staff" }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.email).toBe(email);
    expect(body.data.userType).toBe("staff");
  });

  it("POST /admin/users rejects duplicate email", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/admin/users",
      headers: { Authorization: `Bearer ${saToken}` },
      body: { displayName: "Duplicate", email: "test-admin-sa@codexsun.com", password: "test", userType: "super_admin" }
    });
    expect(res.statusCode).toBe(409);
  });

  it("POST /admin/users/:userType/:id/suspend suspends a user", async () => {
    const listRes = await app.inject({
      method: "GET",
      url: "/admin/users/super_admin",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    const users = JSON.parse(listRes.body).data;
    const target = users.find((u: { email: string }) => u.email === "test-admin-sa@codexsun.com");
    const res = await app.inject({
      method: "POST",
      url: `/admin/users/super_admin/${target.id}/suspend`,
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.suspended).toBe(true);

    // Reactivate for other tests
    await app.inject({
      method: "POST",
      url: `/admin/users/super_admin/${target.id}/activate`,
      headers: { Authorization: `Bearer ${saToken}` }
    });
  });

  // ── Roles ──────────────────────────────────────────────────────
  it("GET /admin/roles returns seeded system roles", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/roles",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it("GET /admin/roles/system returns system role definitions", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/roles/system",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it("POST /admin/roles creates a custom role", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/admin/roles",
      headers: { Authorization: `Bearer ${saToken}` },
      body: { key: "test-role", label: "Test Role", description: "A test role", userType: "staff", permissions: [] }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.key).toBe("test-role");
  });

  // ── Permission Matrix ──────────────────────────────────────────
  it("GET /admin/permissions/matrix returns permission matrix", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/permissions/matrix",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.matrix).toBeDefined();
    expect(body.data.allPermissions).toBeDefined();
    expect(body.data.matrix.length).toBeGreaterThan(0);
  });

  // ── Sessions ───────────────────────────────────────────────────
  it("GET /admin/sessions returns session list (JWT mode may be empty)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/sessions",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.data)).toBe(true);
  });

  // ── STAFF/TENANT ACCESS CHECK ─────────────────────────────────
  it("rejects staff user from accessing admin endpoints", async () => {
    const hash = hashPassword("staff-pass", "codexsun-staff");
    await app.masterDbPool.execute(
      `INSERT INTO staff_users (display_name, email, password_hash)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      ["Test Staff", "test-staff@codexsun.com", hash]
    );

    const loginRes = await app.inject({
      method: "POST",
      url: "/auth/login",
      body: { desk: "admin", email: "test-staff@codexsun.com", password: "staff-pass" }
    });
    const staffToken = JSON.parse(loginRes.body).data.accessToken;

    const res = await app.inject({
      method: "GET",
      url: "/admin/console",
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    expect(res.statusCode).toBe(403);
  });

  // ── Audit mutation produces audit event ───────────────────────
  it("tenant activation mutation writes audit event", async () => {
    const listRes = await app.inject({
      method: "GET",
      url: "/admin/tenants",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    const tenants = JSON.parse(listRes.body).data;
    const tenant = tenants.find((t: { tenantCode: string }) => t.tenantCode.startsWith("test-"));

    await app.inject({
      method: "POST",
      url: `/admin/modules/tenant/${tenant.id}/enable`,
      headers: { Authorization: `Bearer ${saToken}` },
      body: { moduleKey: "platform.tenants" }
    });

    const auditRes = await app.inject({
      method: "GET",
      url: "/admin/audit?eventName=module.activation.enabled",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    const body = JSON.parse(auditRes.body);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].event_name).toBe("module.activation.enabled");
  });

  // ── Health/migration handle empty states ──────────────────────
  it("GET /admin/health handles degraded state gracefully", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/health",
      headers: { Authorization: `Bearer ${saToken}` }
    });
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.status).toBeDefined();
  });
});
