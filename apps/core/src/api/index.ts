import "fastify";
import "@codexsun/framework/api";
import type { FastifyInstance } from "fastify";
import { AppError } from "@codexsun/framework/errors";
import type { CoreDefinitionService, CoreRecordService } from "../common/service.js";
import type { ContactService } from "../master/contacts/service.js";
import type { CompanyService } from "../master/companies/service.js";
import type { ProductService } from "../master/products/service.js";
import type { WorkOrderService } from "../master/orders/service.js";
import type { CommonModuleServiceMap } from "../common-modules/base/service-types.js";
import { registerCoreCommonRoutes } from "./common-routes.js";
import { registerCoreContactRoutes } from "./contact-routes.js";
import { registerCoreCompanyRoutes } from "./company-routes.js";
import { registerCoreProductRoutes } from "./product-routes.js";
import { registerCoreOrderRoutes } from "./order-routes.js";

declare module "fastify" {
  interface FastifyInstance {
    coreDefinitionService: CoreDefinitionService;
    coreRecordService: CoreRecordService;
    coreContactService: ContactService;
    coreCompanyService: CompanyService;
    coreProductService: ProductService;
    coreWorkOrderService: WorkOrderService;
    coreCommonServices: CommonModuleServiceMap;
  }
}

export type GuardSessionFn = (app: FastifyInstance, request: any) => Promise<any>;
export type GuardActiveTenantFn = (app: FastifyInstance, tenantId: string) => Promise<void>;
export type GuardFeatureEnabledFn = (app: FastifyInstance, tenantId: string, featureKey: string) => Promise<void>;
export type GuardPermissionFn = (session: any, permission: string) => void;

export interface CoreRouteContext {
  guardSession: GuardSessionFn;
  guardActiveTenant: GuardActiveTenantFn;
  guardFeatureEnabled: GuardFeatureEnabledFn;
  guardPermission: GuardPermissionFn;
}

export function auditRecordEvent(app: FastifyInstance, event: {
  actorType: string; actorEmail: string;
  eventName: string; payload?: Record<string, unknown>;
  correlationId?: string; tenantId?: string;
}): Promise<void> {
  return (app as any).auditService.recordEvent(event);
}

export function requireTenantContext(request: { tenantId?: string }, session: { tenantId?: string }): string {
  const requestTenantId = request.tenantId;
  if (!requestTenantId) {
    throw AppError.validation("x-tenant-id header is required for tenant-scoped routes");
  }
  if (session.tenantId && session.tenantId !== requestTenantId) {
    throw AppError.forbidden("Tenant mismatch: request tenant does not match session tenant");
  }
  return requestTenantId;
}

export function responseMeta(request: { correlationId?: string; id: string; tenantId?: string }) {
  return {
    requestId: request.id,
    ...(request.correlationId ? { correlationId: request.correlationId } : {}),
    ...(request.tenantId ? { tenantId: request.tenantId } : {})
  };
}

export async function registerAllCoreRoutes(app: FastifyInstance, ctx: CoreRouteContext): Promise<void> {
  await registerCoreCommonRoutes(app, ctx);
  await registerCoreContactRoutes(app, ctx);
  await registerCoreCompanyRoutes(app, ctx);
  await registerCoreProductRoutes(app, ctx);
  await registerCoreOrderRoutes(app, ctx);
}

export { createAllCommonModuleServices, commonModuleDefinitions } from "../common-modules/base/setup.js";
export type { CommonModuleServiceMap } from "../common-modules/base/service-types.js";
