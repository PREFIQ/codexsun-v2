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

export async function registerAdminRoutes(app: FastifyInstance) {
  // GET /admin/modules - registered modules catalog
  app.get("/admin/modules", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const modules = app.moduleCatalog.getAll();
    return ok(modules, responseMeta(request));
  });

  // GET /admin/modules/:tenantId - enabled tenant modules
  app.get("/admin/modules/:tenantId", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.activation.view");
    const { tenantId } = request.params as { tenantId: string };
    const enabled = await app.moduleCatalog.getTenantEnabledModules(tenantId);
    return ok(enabled, responseMeta(request));
  });

  // GET /admin/audit - recent audit events (last 100)
  app.get("/admin/audit", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.audit.activity.view");
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT id, actor_type, actor_email, correlation_id, event_name, event_payload, tenant_id, created_at FROM audit_events ORDER BY id DESC LIMIT 100"
    );
    return ok(rows, responseMeta(request));
  });

  // GET /admin/migrations - migration status
  app.get("/admin/migrations", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.migration.status.view");
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT id, applied_at FROM platform_migrations ORDER BY id ASC"
    );
    return ok(rows, responseMeta(request));
  });
}
