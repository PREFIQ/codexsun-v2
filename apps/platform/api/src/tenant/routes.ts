import { ok } from "@codexsun/framework/http";
import type { FastifyInstance } from "fastify";
import { requireSuperAdmin } from "../auth/guards.js";

function responseMeta(request: { correlationId?: string; id: string; tenantId?: string }) {
  return {
    requestId: request.id,
    ...(request.correlationId ? { correlationId: request.correlationId } : {}),
    ...(request.tenantId ? { tenantId: request.tenantId } : {})
  };
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
    const input = request.body as {
      tenantCode: string;
      tenantName: string;
      status?: string;
    };
    const tenant = await app.tenantService.create({
      tenantCode: input.tenantCode,
      tenantName: input.tenantName,
      ...(input.status ? { status: input.status } : {})
    });
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
    const input: { tenantName?: string; status?: string } = {};
    if (typeof body.tenantName === "string") input.tenantName = body.tenantName;
    if (typeof body.status === "string") input.status = body.status;
    const changes: Record<string, unknown> = {};
    if (input.tenantName !== undefined) changes.tenantName = input.tenantName;
    if (input.status !== undefined) changes.status = input.status;
    const tenant = await app.tenantService.update(id, input);
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
