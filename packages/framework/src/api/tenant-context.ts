import type { FastifyInstance } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    tenantId?: string;
  }
}

export type TenantContextOptions = {
  headerName?: string;
};

export function registerTenantContext(app: FastifyInstance, options?: TenantContextOptions): void {
  const headerName = options?.headerName ?? "x-tenant-id";

  app.decorateRequest("tenantId", undefined);

  app.addHook("onRequest", async (request, reply) => {
    const tenantIdHeader = request.headers[headerName];
    if (typeof tenantIdHeader === "string" && tenantIdHeader.trim().length > 0) {
      request.tenantId = tenantIdHeader;
      reply.header("x-tenant-id", tenantIdHeader);
    }
  });
}
