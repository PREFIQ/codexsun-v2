import { ok } from "@codexsun/framework/http";
import type { FastifyInstance } from "fastify";
import type { BillingRouteContext } from "../billing.routes.js";
import { paymentEntryModule } from "./payment.module.js";
import {
  addEntryComment,
  getEntry,
  listEntries,
  recordEntryToolAction,
  requireTenantSession,
  runEntryComplianceAction,
  setEntryActive,
  upsertEntry,
  type EntryInput,
} from "./payment.service.js";

const moduleDefinition = paymentEntryModule;
const routeKinds = [moduleDefinition.kind, ...moduleDefinition.routeAliases] as const;

export async function registerPaymentRoutes(app: FastifyInstance, ctx: BillingRouteContext) {
  for (const basePath of ["/billing/entries", "/core/entries"]) {
    for (const routeKind of routeKinds) {
      registerPaymentRouteSet(app, ctx, `${basePath}/${routeKind}`);
    }
  }
}

function registerPaymentRouteSet(app: FastifyInstance, ctx: BillingRouteContext, routePath: string) {
  app.get(routePath, async (request) => {
    const session = await requireTenantSession(app, request, ctx);
    ctx.guardPermission(session, "core.common.view");
    const entries = await listEntries(app, request.tenantId!, moduleDefinition.kind);
    return ok(entries, responseMeta(request));
  });

  app.get(routePath + "/:id", async (request) => {
    const session = await requireTenantSession(app, request, ctx);
    ctx.guardPermission(session, "core.common.view");
    const { id } = request.params as { id: string };
    const entry = await getEntry(app, request.tenantId!, moduleDefinition.kind, id);
    return ok(entry, responseMeta(request));
  });

  app.post(routePath + "/upsert", async (request) => {
    const session = await requireTenantSession(app, request, ctx, true);
    ctx.guardPermission(session, "core.common.manage");
    const entry = await upsertEntry(app, request.tenantId!, moduleDefinition.kind, request.body as EntryInput, session.email);
    return ok({ ok: true, entry }, responseMeta(request));
  });

  app.post(routePath + "/:id/archive", async (request) => {
    const session = await requireTenantSession(app, request, ctx, true);
    ctx.guardPermission(session, "core.common.manage");
    const { id } = request.params as { id: string };
    const entry = await setEntryActive(app, request.tenantId!, moduleDefinition.kind, id, false, session.email);
    return ok({ ok: true, entry }, responseMeta(request));
  });

  app.post(routePath + "/:id/restore", async (request) => {
    const session = await requireTenantSession(app, request, ctx, true);
    ctx.guardPermission(session, "core.common.manage");
    const { id } = request.params as { id: string };
    const entry = await setEntryActive(app, request.tenantId!, moduleDefinition.kind, id, true, session.email);
    return ok({ ok: true, entry }, responseMeta(request));
  });

  app.post(routePath + "/:id/comments", async (request) => {
    const session = await requireTenantSession(app, request, ctx, true);
    ctx.guardPermission(session, "core.common.manage");
    const { id } = request.params as { id: string };
    const { body } = request.body as { body?: string };
    const entry = await addEntryComment(app, request.tenantId!, moduleDefinition.kind, id, body, session.email);
    return ok({ ok: true, entry }, responseMeta(request));
  });

  app.post(routePath + "/:id/tools", async (request) => {
    const session = await requireTenantSession(app, request, ctx, true);
    ctx.guardPermission(session, "core.common.manage");
    const { id } = request.params as { id: string };
    const entry = await recordEntryToolAction(app, request.tenantId!, moduleDefinition.kind, id, request.body as { tool?: string; value?: string }, session.email);
    return ok({ ok: true, entry }, responseMeta(request));
  });

  app.post(routePath + "/:id/compliance/:action", async (request) => {
    const session = await requireTenantSession(app, request, ctx, true);
    ctx.guardPermission(session, "core.common.manage");
    const { id, action } = request.params as { id: string; action: string };
    const result = await runEntryComplianceAction(app, request.tenantId!, moduleDefinition.kind, id, action, request.body as Record<string, unknown> | undefined, session.email);
    return ok({ ok: true, ...result }, responseMeta(request));
  });
}

function responseMeta(request: { correlationId?: string; id: string; tenantId?: string }) {
  return {
    requestId: request.id,
    ...(request.correlationId ? { correlationId: request.correlationId } : {}),
    ...(request.tenantId ? { tenantId: request.tenantId } : {}),
  };
}

