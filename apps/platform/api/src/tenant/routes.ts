import { ok } from "@codexsun/framework/http";
import { AppError } from "@codexsun/framework/errors";
import type { FastifyInstance } from "fastify";
import { requireSuperAdmin } from "../auth/guards.js";

function responseMeta(request: { correlationId?: string; id: string; tenantId?: string }) {
  return {
    requestId: request.id,
    ...(request.correlationId ? { correlationId: request.correlationId } : {}),
    ...(request.tenantId ? { tenantId: request.tenantId } : {})
  };
}

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

export async function registerTenantRoutes(app: FastifyInstance) {
  app.get("/tenants", async (request) => {
    await requireSuperAdmin(app, request);
    const tenants = await app.tenantService.list();
    return ok(tenants, responseMeta(request));
  });

  app.get("/tenants/:id", async (request) => {
    await requireSuperAdmin(app, request);
    const { id } = request.params as { id: string };
    const tenant = await app.tenantService.getById(id);
    return ok(tenant, responseMeta(request));
  });

  app.post("/tenants", async (request) => {
    const session = await requireSuperAdmin(app, request);
    const input = tenantInputFromBody(request.body as Record<string, unknown>, true) as Parameters<typeof app.tenantService.create>[0];
    const tenant = await app.tenantService.create(input);
    await syncTenantModules(app, tenant.id, tenant.enabledModuleKeys);
    await app.auditService.tenantCreated({
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      tenantId: tenant.id,
      tenantCode: tenant.tenantCode
    });
    return ok(tenant, responseMeta(request));
  });

  app.put("/tenants/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    const input = tenantInputFromBody(body, false) as Parameters<typeof app.tenantService.update>[1];
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

  app.delete("/tenants/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    const { id } = request.params as { id: string };
    const existing = await app.tenantService.getById(id);
    await app.tenantService.delete(id);
    await app.auditService.tenantDeleted({
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      tenantId: id,
      tenantCode: existing.tenantCode
    });
    return ok({ deleted: true }, responseMeta(request));
  });
}
