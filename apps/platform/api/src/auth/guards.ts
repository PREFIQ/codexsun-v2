import "fastify";
import "@fastify/cookie";
import { AppError } from "@codexsun/framework/errors";
import { userTypeHasPermission } from "@codexsun/platform/permissions";
import type { PlatformSessionRecord } from "@codexsun/platform/auth";
import type { FastifyInstance } from "fastify";

export async function requireSession(app: FastifyInstance, request: {
  headers: Record<string, unknown>;
  cookies?: Record<string, string | undefined>;
}): Promise<PlatformSessionRecord> {
  const bearerToken = tokenFromRequest(request);
  const cookieToken = request.cookies?.codexsun_session;
  const token = bearerToken || cookieToken;
  if (!token) {
    throw AppError.unauthorized("No active session");
  }
  try {
    return await app.authService.getSession(token);
  } catch {
    throw AppError.unauthorized("Invalid or expired session");
  }
}

export function requireUserType(session: PlatformSessionRecord, allowedTypes: string[]): void {
  if (!allowedTypes.includes(session.userType)) {
    throw AppError.forbidden("Access denied for this user type");
  }
}

export async function requireSuperAdmin(app: FastifyInstance, request: {
  headers: Record<string, unknown>;
  cookies?: Record<string, string | undefined>;
}): Promise<PlatformSessionRecord> {
  const session = await requireSession(app, request);
  requireUserType(session, ["super_admin"]);
  return session;
}

export function requireTenantMatch(request: { tenantId?: string }, session: { tenantId?: string }): void {
  const requestTenantId = request.tenantId;
  const sessionTenantId = session.tenantId;

  if (!requestTenantId) {
    throw AppError.validation("x-tenant-id header is required for tenant-scoped routes");
  }
  if (!sessionTenantId) {
    throw AppError.forbidden("Session does not have a tenant context");
  }
  if (requestTenantId !== sessionTenantId) {
    throw AppError.forbidden("Tenant mismatch: request tenant does not match session tenant");
  }
}

export function requirePermission(session: { userType: string }, permission: string): void {
  if (!userTypeHasPermission(session.userType as "staff" | "super_admin" | "system" | "tenant", permission)) {
    throw AppError.forbidden(`Missing permission: ${permission}`);
  }
}

export async function requireActiveTenant(app: FastifyInstance, tenantId: string): Promise<void> {
  const isActive = await app.activationService.isTenantActive(tenantId);
  if (!isActive) {
    throw AppError.forbidden("Tenant is not active");
  }
}

export async function requireFeatureEnabled(app: FastifyInstance, tenantId: string, featureKey: string): Promise<void> {
  await app.activationService.requireEnabled(tenantId, featureKey);
}

export async function requireSubscriptionAllowed(_app: FastifyInstance, _tenantId: string, _moduleKey: string): Promise<void> {
  // Placeholder: subscription check not yet implemented.
}

function tokenFromRequest(request: {
  headers: Record<string, unknown>;
}): string | undefined {
  const authorization = request.headers.authorization;
  return typeof authorization === "string" && authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : undefined;
}
