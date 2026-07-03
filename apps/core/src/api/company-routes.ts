import { ok } from "@codexsun/framework/http";
import type { FastifyInstance } from "fastify";
import type { CoreRouteContext } from "./index.js";
import { requireTenantContext, responseMeta, auditRecordEvent } from "./index.js";

export async function registerCoreCompanyRoutes(app: FastifyInstance, ctx: CoreRouteContext) {
  app.get("/core/companies", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    ctx.guardPermission(session, "core.company.view");
    const companies = await app.coreCompanyService.list(tenantId);
    return ok(companies, responseMeta(request));
  });

  app.get("/core/companies/:id", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    ctx.guardPermission(session, "core.company.view");
    const { id } = request.params as { id: string };
    const company = await app.coreCompanyService.getById(tenantId, id);
    return ok(company, responseMeta(request));
  });

  app.post("/core/companies", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.company.manage");
    const body = request.body as {
      legalName: string; tradeName?: string; companyGroupId?: string;
      phone?: any[]; email?: any[]; addresses?: any[];
      bankAccounts?: any[]; taxIdentities?: any[];
      website?: string; logoUrl?: string; logoDarkUrl?: string; faviconUrl?: string; notes?: string;
    };
    const company = await app.coreCompanyService.create({
      tenantId, legalName: body.legalName,
      ...(body.tradeName !== undefined ? { tradeName: body.tradeName } : {}),
      ...(body.companyGroupId !== undefined ? { companyGroupId: body.companyGroupId } : {}),
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
      ...(body.email !== undefined ? { email: body.email } : {}),
      ...(body.addresses !== undefined ? { addresses: body.addresses } : {}),
      ...(body.bankAccounts !== undefined ? { bankAccounts: body.bankAccounts } : {}),
      ...(body.taxIdentities !== undefined ? { taxIdentities: body.taxIdentities } : {}),
      ...(body.website !== undefined ? { website: body.website } : {}),
      ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl } : {}),
      ...(body.logoDarkUrl !== undefined ? { logoDarkUrl: body.logoDarkUrl } : {}),
      ...(body.faviconUrl !== undefined ? { faviconUrl: body.faviconUrl } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      createdBy: session.email
    });
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.company.created",
      payload: { companyId: company.companyId, legalName: body.legalName },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {})
    });
    return ok(company, responseMeta(request));
  });

  app.put("/core/companies/:id", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.company.manage");
    const { id } = request.params as { id: string };
    const body = request.body as {
      legalName?: string; tradeName?: string; companyGroupId?: string;
      phone?: any[]; email?: any[]; addresses?: any[];
      bankAccounts?: any[]; taxIdentities?: any[];
      website?: string; logoUrl?: string; logoDarkUrl?: string; faviconUrl?: string; notes?: string;
    };
    const company = await app.coreCompanyService.update({
      tenantId, companyId: id,
      ...(body.legalName !== undefined ? { legalName: body.legalName } : {}),
      ...(body.tradeName !== undefined ? { tradeName: body.tradeName } : {}),
      ...(body.companyGroupId !== undefined ? { companyGroupId: body.companyGroupId } : {}),
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
      ...(body.email !== undefined ? { email: body.email } : {}),
      ...(body.addresses !== undefined ? { addresses: body.addresses } : {}),
      ...(body.bankAccounts !== undefined ? { bankAccounts: body.bankAccounts } : {}),
      ...(body.taxIdentities !== undefined ? { taxIdentities: body.taxIdentities } : {}),
      ...(body.website !== undefined ? { website: body.website } : {}),
      ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl } : {}),
      ...(body.logoDarkUrl !== undefined ? { logoDarkUrl: body.logoDarkUrl } : {}),
      ...(body.faviconUrl !== undefined ? { faviconUrl: body.faviconUrl } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      updatedBy: session.email
    });
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.company.updated",
      payload: { companyId: id },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {})
    });
    return ok(company, responseMeta(request));
  });

  app.post("/core/companies/:id/archive", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.company.manage");
    const { id } = request.params as { id: string };
    await app.coreCompanyService.archive(tenantId, id);
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.company.archived",
      payload: { companyId: id },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {})
    });
    return ok({ archived: true }, responseMeta(request));
  });

  app.post("/core/companies/:id/restore", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.company.manage");
    const { id } = request.params as { id: string };
    await app.coreCompanyService.restore(tenantId, id);
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.company.restored",
      payload: { companyId: id },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {})
    });
    return ok({ restored: true }, responseMeta(request));
  });
}
