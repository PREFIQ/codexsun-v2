import { ok } from "@codexsun/framework/http";
import type { FastifyInstance } from "fastify";
import { AppError } from "@codexsun/framework/errors";
import { type CoreRouteContext, auditRecordEvent } from "./index.js";
import { commonModuleDefinitions } from "../common-modules/base/setup.js";
import type { CommonModuleService, CommonModuleServiceMap } from "../common-modules/base/service-types.js";

function getService(map: CommonModuleServiceMap, key: string) {
  const svc = map[key];
  if (!svc) throw AppError.notFound(`Common module '${key}' not found`);
  return svc;
}

export async function registerCoreCommonRoutes(app: FastifyInstance, ctx: CoreRouteContext) {
  app.get("/core/common/definitions", async (request) => {
    const session = await ctx.guardSession(app, request);
    ctx.guardPermission(session, "core.common.view");
    return ok(commonModuleDefinitions.map((definition) => ({
      ...definition,
      definitionKey: definition.key,
    })), responseMeta(request));
  });

  app.get("/core/common/records", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    ctx.guardPermission(session, "core.common.view");
    const query = request.query as { definitionKey?: string };
    if (!query.definitionKey) throw AppError.validation("definitionKey query parameter is required");
    const svc = getService(app.coreCommonServices, query.definitionKey);
    const records = await svc.list(tenantId);
    return ok(records, responseMeta(request));
  });

  app.post("/core/common/records", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.common.manage");
    const body = request.body as { definitionKey: string; code?: string; name: string; [key: string]: unknown };
    if (!body.definitionKey) throw AppError.validation("definitionKey is required");
    const svc = getService(app.coreCommonServices, body.definitionKey);
    const record = await svc.create({
      tenantId,
      ...(body.code !== undefined ? { code: body.code } : {}),
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...Object.fromEntries(
        Object.entries(body).filter(([k]) => k !== "definitionKey" && k !== "tenantId")
      ),
      createdBy: session.email,
    });
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.record.created",
      payload: { recordId: (record as any).id ?? (record as any).recordId, definitionKey: body.definitionKey },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {}),
    });
    return ok(record, responseMeta(request));
  });

  app.get("/core/common/records/:id", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    ctx.guardPermission(session, "core.common.view");
    const query = request.query as { definitionKey?: string };
    if (!query.definitionKey) throw AppError.validation("definitionKey query parameter is required");
    const svc = getService(app.coreCommonServices, query.definitionKey);
    const { id } = request.params as { id: string };
    const record = await svc.getById(tenantId, id);
    return ok(record, responseMeta(request));
  });

  app.put("/core/common/records/:id", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.common.manage");
    const { id } = request.params as { id: string };
    const body = request.body as { definitionKey: string; [key: string]: unknown };
    if (!body.definitionKey) throw AppError.validation("definitionKey is required");
    const svc = getService(app.coreCommonServices, body.definitionKey);
    const record = await svc.update({
      tenantId, id,
      ...Object.fromEntries(
        Object.entries(body).filter(([k]) => k !== "definitionKey" && k !== "tenantId" && k !== "id")
      ),
      updatedBy: session.email,
    });
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.record.updated",
      payload: { recordId: id },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {}),
    });
    return ok(record, responseMeta(request));
  });

  app.post("/core/common/records/:id/archive", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.common.manage");
    const query = request.query as { definitionKey?: string };
    if (!query.definitionKey) throw AppError.validation("definitionKey query parameter is required");
    const svc = getService(app.coreCommonServices, query.definitionKey);
    const { id } = request.params as { id: string };
    await svc.archive(tenantId, id);
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.record.archived",
      payload: { recordId: id },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {}),
    });
    return ok({ archived: true }, responseMeta(request));
  });

  app.post("/core/common/records/:id/restore", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.common.manage");
    const query = request.query as { definitionKey?: string };
    if (!query.definitionKey) throw AppError.validation("definitionKey query parameter is required");
    const svc = getService(app.coreCommonServices, query.definitionKey);
    const { id } = request.params as { id: string };
    await svc.restore(tenantId, id);
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.record.restored",
      payload: { recordId: id },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {}),
    });
    return ok({ restored: true }, responseMeta(request));
  });

  app.delete("/core/common/records/:id", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.common.manage");
    const query = request.query as { definitionKey?: string };
    if (!query.definitionKey) throw AppError.validation("definitionKey query parameter is required");
    const svc = getService(app.coreCommonServices, query.definitionKey);
    const { id } = request.params as { id: string };
    await forceDeleteRecord(svc, tenantId, id);
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.record.deleted",
      payload: { recordId: id, definitionKey: query.definitionKey },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {}),
    });
    return ok({ deleted: true }, responseMeta(request));
  });
}

async function forceDeleteRecord(svc: CommonModuleService, tenantId: string, id: string) {
  if (svc.forceDelete) {
    await svc.forceDelete(tenantId, id);
    return;
  }
  const serviceWithRepository = svc as CommonModuleService & {
    repository?: { forceDelete?: (tenantId: string, id: string) => Promise<boolean> };
  };
  const deleted = await serviceWithRepository.repository?.forceDelete?.(tenantId, id);
  if (deleted) return;
  throw AppError.notFound("Common record not found");
}

function requireTenantContext(request: { tenantId?: string }, session: { tenantId?: string }): string {
  const requestTenantId = request.tenantId;
  if (!requestTenantId) {
    throw AppError.validation("x-tenant-id header is required for tenant-scoped routes");
  }
  if (session.tenantId && session.tenantId !== requestTenantId) {
    throw AppError.forbidden("Tenant mismatch: request tenant does not match session tenant");
  }
  return requestTenantId;
}

function responseMeta(request: { correlationId?: string; id: string; tenantId?: string }) {
  return {
    requestId: request.id,
    ...(request.correlationId ? { correlationId: request.correlationId } : {}),
    ...(request.tenantId ? { tenantId: request.tenantId } : {}),
  };
}
