import { ok } from "@codexsun/framework/http";
import type { FastifyInstance } from "fastify";
import type { CoreRouteContext } from "./index.js";
import { requireTenantContext, responseMeta, auditRecordEvent } from "./index.js";

export async function registerCoreOrderRoutes(app: FastifyInstance, ctx: CoreRouteContext) {
  app.get("/core/orders", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    ctx.guardPermission(session, "core.work-order.view");
    const orders = await app.coreWorkOrderService.list(tenantId);
    return ok(orders, responseMeta(request));
  });

  app.get("/core/orders/:id", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    ctx.guardPermission(session, "core.work-order.view");
    const { id } = request.params as { id: string };
    const order = await app.coreWorkOrderService.getById(tenantId, id);
    return ok(order, responseMeta(request));
  });

  app.post("/core/orders", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.work-order.manage");
    const body = request.body as {
      code: string; name: string; description?: string;
    };
    const order = await app.coreWorkOrderService.create({
      tenantId, code: body.code, name: body.name,
      ...(body.description !== undefined ? { description: body.description } : {}),
      createdBy: session.email
    });
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.work-order.created",
      payload: { orderId: order.orderId, code: body.code, name: body.name },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {})
    });
    return ok(order, responseMeta(request));
  });

  app.put("/core/orders/:id", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.work-order.manage");
    const { id } = request.params as { id: string };
    const body = request.body as {
      name?: string; description?: string;
    };
    const order = await app.coreWorkOrderService.update({
      tenantId, orderId: id,
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      updatedBy: session.email
    });
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.work-order.updated",
      payload: { orderId: id },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {})
    });
    return ok(order, responseMeta(request));
  });

  app.post("/core/orders/:id/archive", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.work-order.manage");
    const { id } = request.params as { id: string };
    await app.coreWorkOrderService.archive(tenantId, id);
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.work-order.archived",
      payload: { orderId: id },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {})
    });
    return ok({ archived: true }, responseMeta(request));
  });

  app.post("/core/orders/:id/restore", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.work-order.manage");
    const { id } = request.params as { id: string };
    await app.coreWorkOrderService.restore(tenantId, id);
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.work-order.restored",
      payload: { orderId: id },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {})
    });
    return ok({ restored: true }, responseMeta(request));
  });
}
