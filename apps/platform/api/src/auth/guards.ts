import "fastify";
import "@fastify/cookie";
import { AppError } from "@codexsun/framework/errors";
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

/**
 * Permission guard placeholder.
 * Currently allows super_admin for all permissions and denies other roles.
 * Replace with full RBAC check when role-permission mapping is available.
 */
export function requirePermission(session: { userType: string }, permission: string): void {
  if (session.userType === "super_admin") return;
  throw AppError.forbidden(`Missing permission: ${permission}`);
}

/**
 * Activation guard placeholder.
 * Currently allows all requests. Replace with tenant feature/subscription check when available.
 */
export function requireActiveTenant(_session: { tenantId?: string }): void {
  // Placeholder: allow all until tenant activation checks are implemented
}

/**
 * Feature enablement guard placeholder.
 * Currently allows all features. Replace with feature-toggle check when available.
 */
export function requireFeatureEnabled(_tenantId: string | undefined, _featureKey: string): void {
  // Placeholder: allow all until feature toggle service is implemented
}

function tokenFromRequest(request: {
  headers: Record<string, unknown>;
}): string | undefined {
  const authorization = request.headers.authorization;
  return typeof authorization === "string" && authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : undefined;
}
