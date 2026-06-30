import { AppError } from "@codexsun/framework/errors";
import { ok } from "@codexsun/framework/http";
import { requirePermission, requireSuperAdmin } from "../auth/guards.js";
import type { FastifyInstance } from "fastify";

function responseMeta(request: { correlationId?: string; id: string; tenantId?: string }) {
  return {
    requestId: request.id,
    ...(request.correlationId ? { correlationId: request.correlationId } : {}),
    ...(request.tenantId ? { tenantId: request.tenantId } : {})
  };
}

function toNumber(v: unknown): number {
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "number") return v;
  return Number(v) || 0;
}

function convertRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] = typeof value === "bigint" ? Number(value) : value;
  }
  return out;
}

function toDomainMapping(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    tenantCode: String(row.tenant_code ?? ""),
    tenantName: String(row.tenant_name ?? ""),
    domainName: String(row.domain_name),
    landingApp: typeof row.landing_app === "string" ? row.landing_app : "",
    isPrimary: Boolean(Number(row.is_primary ?? 0)),
    status: String(row.status ?? "active"),
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at
  };
}

function domainInputFromBody(body: Record<string, unknown>, requireIdentity: boolean) {
  const input: Record<string, unknown> = {};
  if (typeof body.tenantId === "string") input.tenantId = body.tenantId;
  if (typeof body.domainName === "string") input.domainName = body.domainName.trim();
  if (typeof body.landingApp === "string" || body.landingApp === null) input.landingApp = body.landingApp;
  if (typeof body.status === "string") input.status = body.status;
  if (typeof body.isPrimary === "boolean") input.isPrimary = body.isPrimary;
  if (typeof body.isPrimary === "number") input.isPrimary = Boolean(body.isPrimary);
  if (requireIdentity && (typeof input.tenantId !== "string" || typeof input.domainName !== "string" || !input.domainName)) {
    throw AppError.validation("tenantId and domainName are required");
  }
  return input;
}

function toTenantSubscription(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    tenantCode: String(row.tenant_code ?? ""),
    tenantName: String(row.tenant_name ?? ""),
    planName: String(row.plan_name),
    billingCycle: String(row.billing_cycle ?? "Monthly"),
    seats: toNumber(row.seats ?? 1),
    startsOn: row.starts_on,
    renewsOn: row.renews_on,
    amount: row.amount === null || row.amount === undefined ? null : Number(row.amount),
    currency: String(row.currency ?? "INR"),
    status: String(row.status ?? "active"),
    notes: typeof row.notes === "string" ? row.notes : "",
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at
  };
}

function subscriptionInputFromBody(body: Record<string, unknown>, requireIdentity: boolean) {
  const input: Record<string, unknown> = {};
  if (typeof body.tenantId === "string") input.tenantId = body.tenantId;
  if (typeof body.planName === "string") input.planName = body.planName.trim();
  if (typeof body.billingCycle === "string") input.billingCycle = body.billingCycle;
  if (typeof body.seats === "number") input.seats = body.seats;
  if (typeof body.seats === "string") input.seats = Number(body.seats) || 1;
  if (typeof body.startsOn === "string" || body.startsOn === null) input.startsOn = body.startsOn || null;
  if (typeof body.renewsOn === "string" || body.renewsOn === null) input.renewsOn = body.renewsOn || null;
  if (typeof body.amount === "number") input.amount = body.amount;
  if (typeof body.amount === "string") input.amount = body.amount.trim() ? Number(body.amount) : null;
  if (typeof body.currency === "string") input.currency = body.currency.trim() || "INR";
  if (typeof body.status === "string") input.status = body.status;
  if (typeof body.notes === "string" || body.notes === null) input.notes = body.notes ?? null;
  if (requireIdentity && (typeof input.tenantId !== "string" || typeof input.planName !== "string" || !input.planName)) {
    throw AppError.validation("tenantId and planName are required");
  }
  return input;
}

function toSubscriptionPlan(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    planName: String(row.plan_name),
    billingCycle: String(row.billing_cycle ?? "Monthly"),
    seats: toNumber(row.seats ?? 1),
    amount: row.amount === null || row.amount === undefined ? null : Number(row.amount),
    currency: String(row.currency ?? "INR"),
    status: String(row.status ?? "active"),
    description: typeof row.description === "string" ? row.description : "",
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at
  };
}

function subscriptionPlanInputFromBody(body: Record<string, unknown>, requireIdentity: boolean) {
  const input: Record<string, unknown> = {};
  if (typeof body.planName === "string") input.planName = body.planName.trim();
  if (typeof body.billingCycle === "string") input.billingCycle = body.billingCycle;
  if (typeof body.seats === "number") input.seats = body.seats;
  if (typeof body.seats === "string") input.seats = Number(body.seats) || 1;
  if (typeof body.amount === "number") input.amount = body.amount;
  if (typeof body.amount === "string") input.amount = body.amount.trim() ? Number(body.amount) : null;
  if (typeof body.currency === "string") input.currency = body.currency.trim() || "INR";
  if (typeof body.status === "string") input.status = body.status;
  if (typeof body.description === "string" || body.description === null) input.description = body.description ?? null;
  if (requireIdentity && (typeof input.planName !== "string" || !input.planName)) {
    throw AppError.validation("planName is required");
  }
  return input;
}

function toPlatformApp(row: Record<string, unknown>) {
  return {
    id: String(row.module_key),
    moduleKey: String(row.module_key),
    displayName: String(row.display_name),
    scope: String(row.scope ?? "platform"),
    version: String(row.version ?? "1.0.0"),
    defaultEnabled: Boolean(Number(row.default_enabled ?? 0)),
    status: String(row.status ?? "active"),
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at
  };
}

function platformAppInputFromBody(body: Record<string, unknown>, requireIdentity: boolean) {
  const input: Record<string, unknown> = {};
  if (typeof body.moduleKey === "string") input.moduleKey = body.moduleKey.trim();
  if (typeof body.displayName === "string") input.displayName = body.displayName.trim();
  if (typeof body.scope === "string") input.scope = body.scope;
  if (typeof body.version === "string") input.version = body.version.trim();
  if (typeof body.defaultEnabled === "boolean") input.defaultEnabled = body.defaultEnabled;
  if (typeof body.defaultEnabled === "number") input.defaultEnabled = Boolean(body.defaultEnabled);
  if (typeof body.status === "string") input.status = body.status;
  if (requireIdentity && (typeof input.moduleKey !== "string" || !input.moduleKey || typeof input.displayName !== "string" || !input.displayName)) {
    throw AppError.validation("moduleKey and displayName are required");
  }
  return input;
}

function toPlatformIndustry(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    industryName: String(row.industry_name),
    industryCode: String(row.industry_code),
    segment: String(row.segment ?? "General"),
    defaultTemplate: typeof row.default_template === "string" ? row.default_template : "",
    status: String(row.status ?? "active"),
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at
  };
}

function platformIndustryInputFromBody(body: Record<string, unknown>, requireIdentity: boolean) {
  const input: Record<string, unknown> = {};
  if (typeof body.industryName === "string") input.industryName = body.industryName.trim();
  if (typeof body.industryCode === "string") input.industryCode = body.industryCode.trim();
  if (typeof body.segment === "string") input.segment = body.segment;
  if (typeof body.defaultTemplate === "string" || body.defaultTemplate === null) input.defaultTemplate = body.defaultTemplate ?? null;
  if (typeof body.status === "string") input.status = body.status;
  if (requireIdentity && (typeof input.industryName !== "string" || !input.industryName || typeof input.industryCode !== "string" || !input.industryCode)) {
    throw AppError.validation("industryName and industryCode are required");
  }
  return input;
}

function tenantInputFromBody(body: Record<string, unknown>, requireIdentity: true): {
  tenantCode: string;
  tenantName: string;
  corporateId?: string | null;
  dbHost?: string;
  dbName?: string;
  dbPort?: number;
  dbSecretRef?: string;
  dbType?: string;
  dbUser?: string;
  enabledModuleKeys?: string[];
  mobile?: string | null;
  payloadSettings?: Record<string, unknown>;
  slug?: string;
  status?: string;
};
function tenantInputFromBody(body: Record<string, unknown>, requireIdentity: false): {
  tenantCode?: string;
  tenantName?: string;
  corporateId?: string | null;
  dbHost?: string;
  dbName?: string;
  dbPort?: number;
  dbSecretRef?: string;
  dbType?: string;
  dbUser?: string;
  enabledModuleKeys?: string[];
  mobile?: string | null;
  payloadSettings?: Record<string, unknown>;
  slug?: string;
  status?: string;
};
function tenantInputFromBody(body: Record<string, unknown>, requireIdentity: boolean) {
  const input: Record<string, unknown> = {};
  if (typeof body.tenantCode === "string") input.tenantCode = body.tenantCode;
  if (typeof body.tenantName === "string") input.tenantName = body.tenantName;
  if (typeof body.corporateId === "string" || body.corporateId === null) input.corporateId = body.corporateId;
  if (typeof body.mobile === "string" || body.mobile === null) input.mobile = body.mobile;
  if (typeof body.slug === "string") input.slug = body.slug;
  if (typeof body.status === "string") input.status = body.status;
  if (typeof body.dbType === "string") input.dbType = body.dbType;
  if (typeof body.dbHost === "string") input.dbHost = body.dbHost;
  if (typeof body.dbPort === "number") input.dbPort = body.dbPort;
  if (typeof body.dbPort === "string") input.dbPort = Number(body.dbPort) || 3306;
  if (typeof body.dbName === "string") input.dbName = body.dbName;
  if (typeof body.dbUser === "string") input.dbUser = body.dbUser;
  if (typeof body.dbSecretRef === "string") input.dbSecretRef = body.dbSecretRef;
  if (isPlainObject(body.payloadSettings)) input.payloadSettings = body.payloadSettings;
  if (Array.isArray(body.enabledModuleKeys)) {
    input.enabledModuleKeys = body.enabledModuleKeys.filter((item): item is string => typeof item === "string");
  }
  if (requireIdentity && (typeof input.tenantCode !== "string" || typeof input.tenantName !== "string")) {
    throw AppError.validation("tenantCode and tenantName are required");
  }
  return input;
}

async function syncTenantModules(app: FastifyInstance, tenantId: string, enabledModuleKeys: string[]) {
  const catalogKeys = app.moduleCatalog.getAll().map((module) => module.moduleKey);
  for (const moduleKey of catalogKeys) {
    const status = enabledModuleKeys.includes(moduleKey) ? "enabled" : "disabled";
    await app.masterDbPool.execute(
      `INSERT INTO tenant_module_activation (tenant_id, module_key, status)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [tenantId, moduleKey, status]
    );
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export async function registerAdminRoutes(app: FastifyInstance) {
  // ── Console Dashboard ──────────────────────────────────────────
  app.get("/admin/console", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.view");

    const [tenantRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT COUNT(*) as total, SUM(status='active') as active, SUM(status='suspended') as suspended FROM tenants"
    );
    const r = tenantRows[0] || {};
    const tenantStats = { total: toNumber(r.total), active: toNumber(r.active), suspended: toNumber(r.suspended) };

    const [moduleRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT COUNT(DISTINCT module_key) as total FROM tenant_module_activation WHERE status = 'enabled'"
    );
    const enabledModules = toNumber(moduleRows[0]?.total);

    const [auditRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT COUNT(*) as total FROM audit_events WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)"
    );
    const recentAudits = toNumber(auditRows[0]?.total);

    const [migrationRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT COUNT(*) as total FROM platform_migrations"
    );
    const migrationCount = toNumber(migrationRows[0]?.total);

    return ok({
      tenants: tenantStats,
      enabledModules,
      recentAudits,
      migrations: migrationCount,
      dbStatus: {
        masterDatabase: "codexsun_master_db",
        ready: true
      }
    }, responseMeta(request));
  });

  // ── Tenant Registry Routes ─────────────────────────────────────
  app.get("/admin/tenants", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.view");
    const tenants = await app.tenantService.list();
    return ok(tenants, responseMeta(request));
  });

  app.get("/admin/tenants/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.view");
    const { id } = request.params as { id: string };
    const tenant = await app.tenantService.getById(id);
    return ok(tenant, responseMeta(request));
  });

  app.post("/admin/tenants", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const body = request.body as Record<string, unknown>;
    const tenant = await app.tenantService.create({
      ...tenantInputFromBody(body, true)
    });
    await syncTenantModules(app, tenant.id, tenant.enabledModuleKeys);
    await app.auditService.tenantCreated({
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      tenantId: tenant.id,
      tenantCode: tenant.tenantCode
    });
    return ok(tenant, responseMeta(request));
  });

  app.put("/admin/tenants/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    const input = tenantInputFromBody(body, false);
    const changes: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) changes[key] = value;
    }
    const tenant = await app.tenantService.update(id, input);
    if (input.enabledModuleKeys !== undefined) {
      await syncTenantModules(app, tenant.id, input.enabledModuleKeys);
    }
    await app.auditService.tenantUpdated({
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      tenantId: id,
      changes
    });
    return ok(tenant, responseMeta(request));
  });

  app.post("/admin/tenants/:id/suspend", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const { id } = request.params as { id: string };
    const tenant = await app.tenantService.update(id, { status: "suspended" });
    await app.auditService.tenantUpdated({
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      tenantId: id,
      changes: { status: "suspended" }
    });
    return ok(tenant, responseMeta(request));
  });

  app.post("/admin/tenants/:id/restore", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const { id } = request.params as { id: string };
    const tenant = await app.tenantService.update(id, { status: "active" });
    await app.auditService.tenantUpdated({
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      tenantId: id,
      changes: { status: "active" }
    });
    return ok(tenant, responseMeta(request));
  });

  // ── Module Activation ──────────────────────────────────────────
  app.get("/admin/domains", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.view");
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT
         d.id, d.tenant_id, d.domain_name, d.landing_app, d.is_primary, d.status, d.created_at, d.updated_at,
         t.tenant_code, t.tenant_name
       FROM tenant_domain_mappings d
       INNER JOIN tenants t ON t.id = d.tenant_id
       ORDER BY d.updated_at DESC, d.created_at DESC`
    );
    return ok(rows.map(toDomainMapping), responseMeta(request));
  });

  app.post("/admin/domains", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const body = request.body as Record<string, unknown>;
    const input = domainInputFromBody(body, true);
    const tenantId = String(input.tenantId);
    if (input.isPrimary) {
      await app.masterDbPool.execute("UPDATE tenant_domain_mappings SET is_primary = 0 WHERE tenant_id = ?", [tenantId]);
    }
    const [result] = await app.masterDbPool.execute<{ insertId: number | string }>(
      `INSERT INTO tenant_domain_mappings (tenant_id, domain_name, landing_app, is_primary, status)
       VALUES (?, ?, ?, ?, ?)`,
      [
        tenantId,
        input.domainName,
        input.landingApp ?? null,
        input.isPrimary ? 1 : 0,
        input.status ?? "active"
      ]
    );
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "tenant.domain.added",
      tenantId,
      payload: { domainName: input.domainName }
    });
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT
         d.id, d.tenant_id, d.domain_name, d.landing_app, d.is_primary, d.status, d.created_at, d.updated_at,
         t.tenant_code, t.tenant_name
       FROM tenant_domain_mappings d
       INNER JOIN tenants t ON t.id = d.tenant_id
       WHERE d.id = ?`,
      [String(result.insertId)]
    );
    return ok(toDomainMapping(rows[0] ?? {}), responseMeta(request));
  });

  app.put("/admin/domains/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    const input = domainInputFromBody(body, false);
    const [existingRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT id, tenant_id, is_primary FROM tenant_domain_mappings WHERE id = ? LIMIT 1",
      [id]
    );
    const existing = existingRows[0];
    if (!existing) throw AppError.notFound("Domain mapping not found");
    const tenantId = String(input.tenantId ?? existing.tenant_id);
    if (input.isPrimary) {
      await app.masterDbPool.execute("UPDATE tenant_domain_mappings SET is_primary = 0 WHERE tenant_id = ? AND id <> ?", [tenantId, id]);
    }
    const nextPrimary = input.isPrimary === undefined ? Boolean(Number(existing.is_primary ?? 0)) : Boolean(input.isPrimary);
    await app.masterDbPool.execute(
      `UPDATE tenant_domain_mappings
       SET tenant_id = ?, domain_name = COALESCE(?, domain_name), landing_app = ?, is_primary = ?, status = COALESCE(?, status)
       WHERE id = ?`,
      [
        tenantId,
        input.domainName ?? null,
        input.landingApp ?? null,
        nextPrimary ? 1 : 0,
        input.status ?? null,
        id
      ]
    );
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "tenant.domain.updated",
      tenantId,
      payload: { domainId: id }
    });
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT
         d.id, d.tenant_id, d.domain_name, d.landing_app, d.is_primary, d.status, d.created_at, d.updated_at,
         t.tenant_code, t.tenant_name
       FROM tenant_domain_mappings d
       INNER JOIN tenants t ON t.id = d.tenant_id
       WHERE d.id = ?`,
      [id]
    );
    return ok(toDomainMapping(rows[0] ?? {}), responseMeta(request));
  });

  app.delete("/admin/domains/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const { id } = request.params as { id: string };
    const [existingRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT id, tenant_id, domain_name FROM tenant_domain_mappings WHERE id = ? LIMIT 1",
      [id]
    );
    const existing = existingRows[0];
    if (!existing) throw AppError.notFound("Domain mapping not found");

    await app.masterDbPool.execute("DELETE FROM tenant_domain_mappings WHERE id = ?", [id]);
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "tenant.domain.deleted",
      tenantId: String(existing.tenant_id),
      payload: { domainId: id, domainName: existing.domain_name }
    });
    return ok({ deleted: true, id, domainName: existing.domain_name }, responseMeta(request));
  });

  app.get("/admin/subscriptions", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.view");
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT
         s.id, s.tenant_id, s.plan_name, s.billing_cycle, s.seats, s.starts_on, s.renews_on,
         s.amount, s.currency, s.status, s.notes, s.created_at, s.updated_at,
         t.tenant_code, t.tenant_name
       FROM tenant_subscriptions s
       INNER JOIN tenants t ON t.id = s.tenant_id
       ORDER BY s.updated_at DESC, s.created_at DESC`
    );
    return ok(rows.map(toTenantSubscription), responseMeta(request));
  });

  app.post("/admin/subscriptions", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const body = request.body as Record<string, unknown>;
    const input = subscriptionInputFromBody(body, true);
    const tenantId = String(input.tenantId);
    const [result] = await app.masterDbPool.execute<{ insertId: number | string }>(
      `INSERT INTO tenant_subscriptions
         (tenant_id, plan_name, billing_cycle, seats, starts_on, renews_on, amount, currency, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId,
        input.planName,
        input.billingCycle ?? "Monthly",
        input.seats ?? 1,
        input.startsOn ?? null,
        input.renewsOn ?? null,
        input.amount ?? null,
        input.currency ?? "INR",
        input.status ?? "active",
        input.notes ?? null
      ]
    );
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "tenant.subscription.added",
      tenantId,
      payload: { planName: input.planName }
    });
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT
         s.id, s.tenant_id, s.plan_name, s.billing_cycle, s.seats, s.starts_on, s.renews_on,
         s.amount, s.currency, s.status, s.notes, s.created_at, s.updated_at,
         t.tenant_code, t.tenant_name
       FROM tenant_subscriptions s
       INNER JOIN tenants t ON t.id = s.tenant_id
       WHERE s.id = ?`,
      [String(result.insertId)]
    );
    return ok(toTenantSubscription(rows[0] ?? {}), responseMeta(request));
  });

  app.put("/admin/subscriptions/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    const input = subscriptionInputFromBody(body, false);
    const [existingRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT id, tenant_id FROM tenant_subscriptions WHERE id = ? LIMIT 1",
      [id]
    );
    const existing = existingRows[0];
    if (!existing) throw AppError.notFound("Subscription not found");
    const tenantId = String(input.tenantId ?? existing.tenant_id);
    await app.masterDbPool.execute(
      `UPDATE tenant_subscriptions
       SET tenant_id = ?,
           plan_name = COALESCE(?, plan_name),
           billing_cycle = COALESCE(?, billing_cycle),
           seats = COALESCE(?, seats),
           starts_on = ?,
           renews_on = ?,
           amount = ?,
           currency = COALESCE(?, currency),
           status = COALESCE(?, status),
           notes = ?
       WHERE id = ?`,
      [
        tenantId,
        input.planName ?? null,
        input.billingCycle ?? null,
        input.seats ?? null,
        input.startsOn ?? null,
        input.renewsOn ?? null,
        input.amount ?? null,
        input.currency ?? null,
        input.status ?? null,
        input.notes ?? null,
        id
      ]
    );
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "tenant.subscription.updated",
      tenantId,
      payload: { subscriptionId: id }
    });
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT
         s.id, s.tenant_id, s.plan_name, s.billing_cycle, s.seats, s.starts_on, s.renews_on,
         s.amount, s.currency, s.status, s.notes, s.created_at, s.updated_at,
         t.tenant_code, t.tenant_name
       FROM tenant_subscriptions s
       INNER JOIN tenants t ON t.id = s.tenant_id
       WHERE s.id = ?`,
      [id]
    );
    return ok(toTenantSubscription(rows[0] ?? {}), responseMeta(request));
  });

  app.get("/admin/subscription-plans", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.view");
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT id, plan_name, billing_cycle, seats, amount, currency, status, description, created_at, updated_at
       FROM subscription_plans
       ORDER BY updated_at DESC, created_at DESC`
    );
    return ok(rows.map(toSubscriptionPlan), responseMeta(request));
  });

  app.post("/admin/subscription-plans", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const input = subscriptionPlanInputFromBody(request.body as Record<string, unknown>, true);
    const [result] = await app.masterDbPool.execute<{ insertId: number | string }>(
      `INSERT INTO subscription_plans (plan_name, billing_cycle, seats, amount, currency, status, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        input.planName,
        input.billingCycle ?? "Monthly",
        input.seats ?? 1,
        input.amount ?? null,
        input.currency ?? "INR",
        input.status ?? "active",
        input.description ?? null
      ]
    );
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "tenant.subscription.plan.added",
      payload: { planName: input.planName }
    });
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT id, plan_name, billing_cycle, seats, amount, currency, status, description, created_at, updated_at
       FROM subscription_plans
       WHERE id = ?`,
      [String(result.insertId)]
    );
    return ok(toSubscriptionPlan(rows[0] ?? {}), responseMeta(request));
  });

  app.put("/admin/subscription-plans/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const { id } = request.params as { id: string };
    const input = subscriptionPlanInputFromBody(request.body as Record<string, unknown>, false);
    const [existingRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT id FROM subscription_plans WHERE id = ? LIMIT 1",
      [id]
    );
    if (!existingRows[0]) throw AppError.notFound("Subscription plan not found");
    await app.masterDbPool.execute(
      `UPDATE subscription_plans
       SET plan_name = COALESCE(?, plan_name),
           billing_cycle = COALESCE(?, billing_cycle),
           seats = COALESCE(?, seats),
           amount = ?,
           currency = COALESCE(?, currency),
           status = COALESCE(?, status),
           description = ?
       WHERE id = ?`,
      [
        input.planName ?? null,
        input.billingCycle ?? null,
        input.seats ?? null,
        input.amount ?? null,
        input.currency ?? null,
        input.status ?? null,
        input.description ?? null,
        id
      ]
    );
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "tenant.subscription.plan.updated",
      payload: { planId: id }
    });
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT id, plan_name, billing_cycle, seats, amount, currency, status, description, created_at, updated_at
       FROM subscription_plans
       WHERE id = ?`,
      [id]
    );
    return ok(toSubscriptionPlan(rows[0] ?? {}), responseMeta(request));
  });

  app.get("/admin/platform-apps", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT module_key, display_name, scope, version, default_enabled, status, created_at, updated_at
       FROM platform_modules
       ORDER BY updated_at DESC, created_at DESC`
    );
    return ok(rows.map(toPlatformApp), responseMeta(request));
  });

  app.post("/admin/platform-apps", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const input = platformAppInputFromBody(request.body as Record<string, unknown>, true);
    await app.masterDbPool.execute(
      `INSERT INTO platform_modules (module_key, display_name, scope, version, default_enabled, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        input.moduleKey,
        input.displayName,
        input.scope ?? "tenant",
        input.version ?? "1.0.0",
        input.defaultEnabled ? 1 : 0,
        input.status ?? "active"
      ]
    );
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "platform.app.added",
      payload: { moduleKey: input.moduleKey }
    });
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT module_key, display_name, scope, version, default_enabled, status, created_at, updated_at
       FROM platform_modules
       WHERE module_key = ?`,
      [input.moduleKey]
    );
    return ok(toPlatformApp(rows[0] ?? {}), responseMeta(request));
  });

  app.put("/admin/platform-apps/:moduleKey", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { moduleKey } = request.params as { moduleKey: string };
    const input = platformAppInputFromBody(request.body as Record<string, unknown>, false);
    const [existingRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT module_key, default_enabled FROM platform_modules WHERE module_key = ? LIMIT 1",
      [moduleKey]
    );
    const existing = existingRows[0];
    if (!existing) throw AppError.notFound("Platform app not found");
    const nextModuleKey = typeof input.moduleKey === "string" && input.moduleKey ? input.moduleKey : moduleKey;
    const nextDefaultEnabled = input.defaultEnabled === undefined ? Boolean(Number(existing.default_enabled ?? 0)) : Boolean(input.defaultEnabled);
    await app.masterDbPool.execute(
      `UPDATE platform_modules
       SET module_key = ?,
           display_name = COALESCE(?, display_name),
           scope = COALESCE(?, scope),
           version = COALESCE(?, version),
           default_enabled = ?,
           status = COALESCE(?, status)
       WHERE module_key = ?`,
      [
        nextModuleKey,
        input.displayName ?? null,
        input.scope ?? null,
        input.version ?? null,
        nextDefaultEnabled ? 1 : 0,
        input.status ?? null,
        moduleKey
      ]
    );
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "platform.app.updated",
      payload: { moduleKey: nextModuleKey }
    });
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT module_key, display_name, scope, version, default_enabled, status, created_at, updated_at
       FROM platform_modules
       WHERE module_key = ?`,
      [nextModuleKey]
    );
    return ok(toPlatformApp(rows[0] ?? {}), responseMeta(request));
  });

  app.get("/admin/industries", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT id, industry_name, industry_code, segment, default_template, status, created_at, updated_at
       FROM platform_industries
       ORDER BY updated_at DESC, created_at DESC`
    );
    return ok(rows.map(toPlatformIndustry), responseMeta(request));
  });

  app.post("/admin/industries", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const input = platformIndustryInputFromBody(request.body as Record<string, unknown>, true);
    const [result] = await app.masterDbPool.execute<{ insertId: number | string }>(
      `INSERT INTO platform_industries (industry_name, industry_code, segment, default_template, status)
       VALUES (?, ?, ?, ?, ?)`,
      [
        input.industryName,
        input.industryCode,
        input.segment ?? "General",
        input.defaultTemplate ?? null,
        input.status ?? "active"
      ]
    );
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "platform.industry.added",
      payload: { industryCode: input.industryCode }
    });
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT id, industry_name, industry_code, segment, default_template, status, created_at, updated_at
       FROM platform_industries
       WHERE id = ?`,
      [String(result.insertId)]
    );
    return ok(toPlatformIndustry(rows[0] ?? {}), responseMeta(request));
  });

  app.put("/admin/industries/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { id } = request.params as { id: string };
    const input = platformIndustryInputFromBody(request.body as Record<string, unknown>, false);
    const [existingRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT id FROM platform_industries WHERE id = ? LIMIT 1",
      [id]
    );
    if (!existingRows[0]) throw AppError.notFound("Industry not found");
    await app.masterDbPool.execute(
      `UPDATE platform_industries
       SET industry_name = COALESCE(?, industry_name),
           industry_code = COALESCE(?, industry_code),
           segment = COALESCE(?, segment),
           default_template = ?,
           status = COALESCE(?, status)
       WHERE id = ?`,
      [
        input.industryName ?? null,
        input.industryCode ?? null,
        input.segment ?? null,
        input.defaultTemplate ?? null,
        input.status ?? null,
        id
      ]
    );
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "platform.industry.updated",
      payload: { industryId: id }
    });
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT id, industry_name, industry_code, segment, default_template, status, created_at, updated_at
       FROM platform_industries
       WHERE id = ?`,
      [id]
    );
    return ok(toPlatformIndustry(rows[0] ?? {}), responseMeta(request));
  });

  app.get("/admin/modules/catalog", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const modules = app.moduleCatalog.getAll();
    return ok(modules, responseMeta(request));
  });

  app.get("/admin/modules/tenant/:tenantId", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.activation.view");
    const { tenantId } = request.params as { tenantId: string };
    const enabled = await app.moduleCatalog.getTenantEnabledModules(tenantId);
    return ok(enabled, responseMeta(request));
  });

  app.post("/admin/modules/tenant/:tenantId/enable", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.activation.manage");
    const { tenantId } = request.params as { tenantId: string };
    const body = request.body as { moduleKey: string };
    const moduleKey = body.moduleKey;
    const alreadyEnabled = await app.moduleCatalog.isModuleEnabledForTenant(tenantId, moduleKey);
    if (!alreadyEnabled) {
      await app.masterDbPool.execute(
        `INSERT INTO tenant_module_activation (tenant_id, module_key, status) VALUES (?, ?, 'enabled')
         ON DUPLICATE KEY UPDATE status = 'enabled'`,
        [tenantId, moduleKey]
      );
    }
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "module.activation.enabled",
      tenantId,
      payload: { moduleKey }
    });
    return ok({ enabled: true, moduleKey }, responseMeta(request));
  });

  app.post("/admin/modules/tenant/:tenantId/disable", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.activation.manage");
    const { tenantId } = request.params as { tenantId: string };
    const body = request.body as { moduleKey: string };
    const moduleKey = body.moduleKey;
    await app.masterDbPool.execute(
      "UPDATE tenant_module_activation SET status = 'disabled' WHERE tenant_id = ? AND module_key = ?",
      [tenantId, moduleKey]
    );
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "module.activation.disabled",
      tenantId,
      payload: { moduleKey }
    });
    return ok({ enabled: false, moduleKey }, responseMeta(request));
  });

  // ── Audit Viewer ───────────────────────────────────────────────
  app.get("/admin/audit", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.audit.activity.view");
    const query = request.query as Record<string, string | undefined>;
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (query.actorEmail) { conditions.push("actor_email = ?"); values.push(query.actorEmail); }
    if (query.eventName) { conditions.push("event_name = ?"); values.push(query.eventName); }
    if (query.fromDate) { conditions.push("created_at >= ?"); values.push(query.fromDate); }
    if (query.toDate) { conditions.push("created_at <= ?"); values.push(query.toDate); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = Math.min(Math.max(Number(query.limit) || 100, 1), 500);
    const offset = Math.max(Number(query.offset) || 0, 0);

    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT id, actor_type, actor_email, correlation_id, event_name, event_payload, created_at FROM audit_events ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );
    return ok(rows.map(convertRow), responseMeta(request));
  });

  app.get("/admin/audit/actors", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.audit.activity.view");
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT DISTINCT actor_email FROM audit_events WHERE actor_email IS NOT NULL ORDER BY actor_email"
    );
    return ok(rows.map((r) => r.actor_email), responseMeta(request));
  });

  // ── Migration Status ───────────────────────────────────────────
  app.get("/admin/migrations", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.migration.status.view");
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT id, applied_at FROM platform_migrations ORDER BY id ASC"
    );
    return ok(rows.map(convertRow), responseMeta(request));
  });

  // ── Health ─────────────────────────────────────────────────────
  app.get("/admin/health", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.migration.status.view");
    const health = {
      status: "ok" as const,
      api: { status: "ok" as const, uptime: process.uptime() },
      database: { status: "ok" as const, name: "codexsun_master_db" },
      modules: app.moduleCatalog.getAll().map((m) => ({ key: m.moduleKey, name: m.displayName, status: "registered" as const }))
    };
    return ok(health, responseMeta(request));
  });

  // ── Platform Users ─────────────────────────────────────────────
  app.get("/admin/users/:userType", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.user.profile.view");
    const { userType } = request.params as { userType: string };
    if (userType !== "super_admin" && userType !== "staff") {
      return ok([], responseMeta(request));
    }
    const users = await app.userService.list(userType);
    return ok(users, responseMeta(request));
  });

  app.get("/admin/users/:userType/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.user.profile.view");
    const { userType, id } = request.params as { userType: string; id: string };
    const user = await app.userService.getById(userType as "super_admin" | "staff", id);
    return ok(user, responseMeta(request));
  });

  app.post("/admin/users", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.user.profile.manage");
    const body = request.body as { displayName: string; email: string; password: string; userType: string; status?: string };
    const user = await app.userService.create({
      displayName: body.displayName,
      email: body.email,
      password: body.password,
      userType: body.userType as "super_admin" | "staff",
      ...(body.status ? { status: body.status } : {})
    });
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "user.created",
      payload: { userId: user.id, userType: user.userType, email: user.email }
    });
    return ok(user, responseMeta(request));
  });

  app.put("/admin/users/:userType/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.user.profile.manage");
    const { userType, id } = request.params as { userType: string; id: string };
    const body = request.body as { displayName?: string; status?: string };
    const user = await app.userService.update(userType as "super_admin" | "staff", id, body);
    return ok(user, responseMeta(request));
  });

  app.post("/admin/users/:userType/:id/suspend", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.user.profile.manage");
    const { userType, id } = request.params as { userType: string; id: string };
    await app.userService.suspend(userType as "super_admin" | "staff", id);
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "user.suspended",
      payload: { userId: id, userType }
    });
    return ok({ suspended: true }, responseMeta(request));
  });

  app.post("/admin/users/:userType/:id/activate", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.user.profile.manage");
    const { userType, id } = request.params as { userType: string; id: string };
    await app.userService.activate(userType as "super_admin" | "staff", id);
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "user.activated",
      payload: { userId: id, userType }
    });
    return ok({ activated: true }, responseMeta(request));
  });

  // ── Role Management ────────────────────────────────────────────
  app.get("/admin/roles", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const roles = await app.roleService.list();
    return ok(roles, responseMeta(request));
  });

  app.get("/admin/roles/system", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    return ok(app.roleService.getAllSystemRoles(), responseMeta(request));
  });

  app.post("/admin/roles", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const body = request.body as { description: string; key: string; label: string; permissions: string[]; userType: string };
    const role = await app.roleService.create({
      ...body,
      userType: body.userType as "super_admin" | "staff" | "tenant"
    });
    return ok(role, responseMeta(request));
  });

  app.put("/admin/roles/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { id } = request.params as { id: string };
    const body = request.body as { description?: string; label?: string; permissions?: string[]; status?: string };
    const role = await app.roleService.update(id, body);
    return ok(role, responseMeta(request));
  });

  app.put("/admin/roles/:id/permissions", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { id } = request.params as { id: string };
    const body = request.body as { permissions: string[] };
    const role = await app.roleService.updatePermissions(id, body.permissions);
    return ok(role, responseMeta(request));
  });

  // ── Permission Matrix ─────────────────────────────────────────
  app.get("/admin/permissions/matrix", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const matrix = app.roleService.getPermissionsMatrix();
    const allPermissions = (await import("@codexsun/platform/permissions")).platformPermissionsAll;
    return ok({ matrix, allPermissions }, responseMeta(request));
  });

  // ── Active Sessions ────────────────────────────────────────────
  app.get("/admin/sessions", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.user.profile.view");
    const sessions = await app.authService.getSessionStore().listAsync();
    return ok(sessions, responseMeta(request));
  });

  app.delete("/admin/sessions/:token", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.user.profile.manage");
    const { token } = request.params as { token: string };
    await app.authService.getSessionStore().destroyAsync(token);
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "session.revoked",
      payload: { revokedToken: token }
    });
    return ok({ revoked: true }, responseMeta(request));
  });

  // ── Tenant Domain Mappings ─────────────────────────────────────
  app.get("/admin/tenants/:tenantId/domains", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.view");
    const { tenantId } = request.params as { tenantId: string };
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT id, tenant_id, domain_name, status, created_at FROM tenant_domain_mappings WHERE tenant_id = ? ORDER BY created_at ASC",
      [tenantId]
    );
    return ok(rows.map(convertRow), responseMeta(request));
  });

  app.post("/admin/tenants/:tenantId/domains", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const { tenantId } = request.params as { tenantId: string };
    const body = request.body as { domainName: string };
    if (!body.domainName?.trim()) throw AppError.validation("domainName is required");
    await app.masterDbPool.execute(
      "INSERT INTO tenant_domain_mappings (tenant_id, domain_name, status) VALUES (?, ?, 'active')",
      [tenantId, body.domainName.trim()]
    );
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "tenant.domain.added",
      tenantId,
      payload: { domainName: body.domainName }
    });
    return ok({ domainName: body.domainName }, responseMeta(request));
  });

  app.delete("/admin/tenants/:tenantId/domains/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const { tenantId, id } = request.params as { tenantId: string; id: string };
    await app.masterDbPool.execute(
      "DELETE FROM tenant_domain_mappings WHERE id = ? AND tenant_id = ?",
      [id, tenantId]
    );
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "tenant.domain.removed",
      tenantId,
      payload: { domainId: id }
    });
    return ok({ removed: true }, responseMeta(request));
  });

  // ── Migration Runner (Database Manager) ────────────────────────
  app.post("/admin/migrations/run", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.migration.status.view");
    const { MigrationRunner } = await import("../db/migration-runner.js");
    const { masterMigrations } = await import("../db/migrations/master-index.js");
    const runner = new MigrationRunner(app.masterDbPool);
    await runner.initialize();
    const pending = runner.listPending(masterMigrations);
    const results: Array<{ id: string; status: string }> = [];
    for (const migration of pending) {
      try {
        await runner.run(migration);
        results.push({ id: migration.id, status: "applied" });
      } catch {
        results.push({ id: migration.id, status: "error" });
      }
    }
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "migration.run",
      payload: { results }
    });
    return ok({ applied: results.length, results }, responseMeta(request));
  });

  // ── Database Connection Status ────────────────────────────────
  app.get("/admin/databases", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.migration.status.view");
    const [dbRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT id, tenant_id, database_name, status, created_at FROM tenant_databases ORDER BY created_at ASC"
    );
    const databases = dbRows.map(convertRow).map((r) => ({
      ...r,
      dbStatus: "unknown"
    }));
    return ok(databases, responseMeta(request));
  });
}
