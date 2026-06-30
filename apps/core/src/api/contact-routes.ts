import { ok } from "@codexsun/framework/http";
import type { FastifyInstance } from "fastify";
import type { CoreRouteContext } from "./index.js";
import { requireTenantContext, responseMeta, auditRecordEvent } from "./index.js";

export async function registerCoreContactRoutes(app: FastifyInstance, ctx: CoreRouteContext) {
  app.get("/core/contacts", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    ctx.guardPermission(session, "core.contact.view");
    const contacts = await app.coreContactService.list(tenantId);
    return ok(contacts, responseMeta(request));
  });

  app.get("/core/contacts/:id", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    ctx.guardPermission(session, "core.contact.view");
    const { id } = request.params as { id: string };
    const contact = await app.coreContactService.getById(tenantId, id);
    return ok(contact, responseMeta(request));
  });

  app.post("/core/contacts", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.contact.manage");
    const body = request.body as {
      code: string; name: string; contactTypeId?: string;
      ledgerId?: string; ledgerName?: string; legalName?: string;
      pan?: string; gstin?: string; msmeType?: string; msmeNo?: string;
      tan?: string; tdsAvailable?: boolean; tcsAvailable?: boolean;
      openingBalance?: number; balanceType?: string; creditLimit?: number;
      website?: string; primaryEmail?: string; primaryPhone?: string; description?: string;
      addressBook?: any[]; contactEmails?: any[]; contactPhones?: any[];
      contactSocialLinks?: any[]; contactBankAccounts?: any[]; contactGstDetails?: any[];
    };
    const contact = await app.coreContactService.create({
      tenantId, code: body.code, name: body.name,
      ...(body.contactTypeId !== undefined ? { contactTypeId: body.contactTypeId } : {}),
      ...(body.ledgerId !== undefined ? { ledgerId: body.ledgerId } : {}),
      ...(body.ledgerName !== undefined ? { ledgerName: body.ledgerName } : {}),
      ...(body.legalName !== undefined ? { legalName: body.legalName } : {}),
      ...(body.pan !== undefined ? { pan: body.pan } : {}),
      ...(body.gstin !== undefined ? { gstin: body.gstin } : {}),
      ...(body.msmeType !== undefined ? { msmeType: body.msmeType } : {}),
      ...(body.msmeNo !== undefined ? { msmeNo: body.msmeNo } : {}),
      ...(body.tan !== undefined ? { tan: body.tan } : {}),
      ...(body.tdsAvailable !== undefined ? { tdsAvailable: body.tdsAvailable } : {}),
      ...(body.tcsAvailable !== undefined ? { tcsAvailable: body.tcsAvailable } : {}),
      ...(body.openingBalance !== undefined ? { openingBalance: body.openingBalance } : {}),
      ...(body.balanceType !== undefined ? { balanceType: body.balanceType } : {}),
      ...(body.creditLimit !== undefined ? { creditLimit: body.creditLimit } : {}),
      ...(body.website !== undefined ? { website: body.website } : {}),
      ...(body.primaryEmail !== undefined ? { primaryEmail: body.primaryEmail } : {}),
      ...(body.primaryPhone !== undefined ? { primaryPhone: body.primaryPhone } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.addressBook !== undefined ? { addressBook: body.addressBook } : {}),
      ...(body.contactEmails !== undefined ? { contactEmails: body.contactEmails } : {}),
      ...(body.contactPhones !== undefined ? { contactPhones: body.contactPhones } : {}),
      ...(body.contactSocialLinks !== undefined ? { contactSocialLinks: body.contactSocialLinks } : {}),
      ...(body.contactBankAccounts !== undefined ? { contactBankAccounts: body.contactBankAccounts } : {}),
      ...(body.contactGstDetails !== undefined ? { contactGstDetails: body.contactGstDetails } : {}),
      createdBy: session.email
    });
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.contact.created",
      payload: { contactId: contact.contactId, name: body.name },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {})
    });
    return ok(contact, responseMeta(request));
  });

  app.put("/core/contacts/:id", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.contact.manage");
    const { id } = request.params as { id: string };
    const body = request.body as {
      code?: string; name?: string; contactTypeId?: string;
      ledgerId?: string; ledgerName?: string; legalName?: string;
      pan?: string; gstin?: string; msmeType?: string; msmeNo?: string;
      tan?: string; tdsAvailable?: boolean; tcsAvailable?: boolean;
      openingBalance?: number; balanceType?: string; creditLimit?: number;
      website?: string; primaryEmail?: string; primaryPhone?: string; description?: string;
      addressBook?: any[]; contactEmails?: any[]; contactPhones?: any[];
      contactSocialLinks?: any[]; contactBankAccounts?: any[]; contactGstDetails?: any[];
    };
    const contact = await app.coreContactService.update({
      tenantId, contactId: id,
      ...(body.code !== undefined ? { code: body.code } : {}),
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.contactTypeId !== undefined ? { contactTypeId: body.contactTypeId } : {}),
      ...(body.ledgerId !== undefined ? { ledgerId: body.ledgerId } : {}),
      ...(body.ledgerName !== undefined ? { ledgerName: body.ledgerName } : {}),
      ...(body.legalName !== undefined ? { legalName: body.legalName } : {}),
      ...(body.pan !== undefined ? { pan: body.pan } : {}),
      ...(body.gstin !== undefined ? { gstin: body.gstin } : {}),
      ...(body.msmeType !== undefined ? { msmeType: body.msmeType } : {}),
      ...(body.msmeNo !== undefined ? { msmeNo: body.msmeNo } : {}),
      ...(body.tan !== undefined ? { tan: body.tan } : {}),
      ...(body.tdsAvailable !== undefined ? { tdsAvailable: body.tdsAvailable } : {}),
      ...(body.tcsAvailable !== undefined ? { tcsAvailable: body.tcsAvailable } : {}),
      ...(body.openingBalance !== undefined ? { openingBalance: body.openingBalance } : {}),
      ...(body.balanceType !== undefined ? { balanceType: body.balanceType } : {}),
      ...(body.creditLimit !== undefined ? { creditLimit: body.creditLimit } : {}),
      ...(body.website !== undefined ? { website: body.website } : {}),
      ...(body.primaryEmail !== undefined ? { primaryEmail: body.primaryEmail } : {}),
      ...(body.primaryPhone !== undefined ? { primaryPhone: body.primaryPhone } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.addressBook !== undefined ? { addressBook: body.addressBook } : {}),
      ...(body.contactEmails !== undefined ? { contactEmails: body.contactEmails } : {}),
      ...(body.contactPhones !== undefined ? { contactPhones: body.contactPhones } : {}),
      ...(body.contactSocialLinks !== undefined ? { contactSocialLinks: body.contactSocialLinks } : {}),
      ...(body.contactBankAccounts !== undefined ? { contactBankAccounts: body.contactBankAccounts } : {}),
      ...(body.contactGstDetails !== undefined ? { contactGstDetails: body.contactGstDetails } : {}),
      updatedBy: session.email
    });
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.contact.updated",
      payload: { contactId: id },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {})
    });
    return ok(contact, responseMeta(request));
  });

  app.post("/core/contacts/:id/archive", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.contact.manage");
    const { id } = request.params as { id: string };
    await app.coreContactService.archive(tenantId, id);
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.contact.archived",
      payload: { contactId: id },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {})
    });
    return ok({ archived: true }, responseMeta(request));
  });

  app.post("/core/contacts/:id/restore", async (request) => {
    const session = await ctx.guardSession(app, request);
    const tenantId = requireTenantContext(request, session);
    await ctx.guardActiveTenant(app, tenantId);
    await ctx.guardFeatureEnabled(app, tenantId, "core");
    ctx.guardPermission(session, "core.contact.manage");
    const { id } = request.params as { id: string };
    await app.coreContactService.restore(tenantId, id);
    await auditRecordEvent(app, {
      actorType: "tenant", actorEmail: session.email,
      eventName: "core.contact.restored",
      payload: { contactId: id },
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(request.tenantId ? { tenantId: request.tenantId } : {})
    });
    return ok({ restored: true }, responseMeta(request));
  });
}
