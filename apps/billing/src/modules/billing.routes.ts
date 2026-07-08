import "@codexsun/framework/api";
import type { CompatibleDbPool } from "@codexsun/framework/db";
import type { FastifyInstance, FastifyRequest } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    masterDbPool: CompatibleDbPool;
  }
}

export type BillingRouteSession = {
  email: string;
  userType: string;
  tenantId?: string | null;
};

export type BillingRouteContext = {
  guardActiveTenant: (app: FastifyInstance, tenantId: string) => Promise<void>;
  guardFeatureEnabled: (app: FastifyInstance, tenantId: string, featureKey: string) => Promise<void>;
  guardPermission: (session: BillingRouteSession, permission: string) => void;
  guardSession: (app: FastifyInstance, request: FastifyRequest) => Promise<BillingRouteSession>;
};


