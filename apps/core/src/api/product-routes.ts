import { ok } from "@codexsun/framework/http";
import type { FastifyInstance } from "fastify";
import type { CoreRouteContext } from "./index.js";
import { requireTenantContext, responseMeta, auditRecordEvent } from "./index.js";

export async function registerCoreProductRoutes(app: FastifyInstance, ctx: CoreRouteContext) {
  app.get("/core/products", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    ctx.guardPermission(session, "core.product.view");
    const products = await app.coreProductService.list(tenantId);
    return ok(products, responseMeta(request));
  });

  app.get("/core/products/by-code/:code", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    ctx.guardPermission(session, "core.product.view");
    const { code } = request.params as { code: string };
    const product = await app.coreProductService.getByCode(tenantId, code);
    return ok(product, responseMeta(request));
  });

  app.get("/core/products/:id", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    ctx.guardPermission(session, "core.product.view");
    const { id } = request.params as { id: string };
    const product = await app.coreProductService.getById(tenantId, id);
    return ok(product, responseMeta(request));
  });

  app.post("/core/products", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.product.manage");
    const body = request.body as {
      code: string; name: string;
      productTypeId?: string; hsnCodeId?: string; unitId?: string; taxId?: string;
    };
    const product = await app.coreProductService.create({
      tenantId, code: body.code, name: body.name,
      ...(body.productTypeId !== undefined ? { productTypeId: body.productTypeId } : {}),
      ...(body.hsnCodeId !== undefined ? { hsnCodeId: body.hsnCodeId } : {}),
      ...(body.unitId !== undefined ? { unitId: body.unitId } : {}),
      ...(body.taxId !== undefined ? { taxId: body.taxId } : {}),
      createdBy: session.email
    });
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.product.created",
      payload: { itemId: product.itemId, code: body.code },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {})
    });
    return ok(product, responseMeta(request));
  });

  app.put("/core/products/:id", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.product.manage");
    const { id } = request.params as { id: string };
    const body = request.body as {
      name?: string;
      productTypeId?: string; hsnCodeId?: string; unitId?: string; taxId?: string;
    };
    const product = await app.coreProductService.update({
      tenantId, itemId: id,
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.productTypeId !== undefined ? { productTypeId: body.productTypeId } : {}),
      ...(body.hsnCodeId !== undefined ? { hsnCodeId: body.hsnCodeId } : {}),
      ...(body.unitId !== undefined ? { unitId: body.unitId } : {}),
      ...(body.taxId !== undefined ? { taxId: body.taxId } : {}),
      updatedBy: session.email
    });
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.product.updated",
      payload: { itemId: id },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {})
    });
    return ok(product, responseMeta(request));
  });

  app.post("/core/products/:id/archive", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.product.manage");
    const { id } = request.params as { id: string };
    await app.coreProductService.archive(tenantId, id);
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.product.archived",
      payload: { itemId: id },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {})
    });
    return ok({ archived: true }, responseMeta(request));
  });

  app.post("/core/products/:id/restore", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.product.manage");
    const { id } = request.params as { id: string };
    await app.coreProductService.restore(tenantId, id);
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.product.restored",
      payload: { itemId: id },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {})
    });
    return ok({ restored: true }, responseMeta(request));
  });
}
