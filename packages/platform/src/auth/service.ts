import { AppError } from "@codexsun/framework/errors";
import { verifyPassword } from "./password.js";
import { createJWT, verifyJWT, type JWTPayload } from "./jwt.js";
import { InMemorySessionStore, type PlatformSessionRecord, type SessionStore } from "./session.js";
import type { TenantLookupService } from "../tenant/lookup.js";
import type { AuthMode } from "./contracts.js";

export type AuthUserRecord = {
  email: string;
  password_hash: string;
  status: string;
};

export interface UserFinder {
  findMasterUser(desk: "sa" | "admin", email: string): Promise<AuthUserRecord | null>;
  findTenantUser(databaseName: string, email: string): Promise<AuthUserRecord | null>;
}

export class AuthService {
  constructor(
    private readonly jwtSecret: string,
    private readonly tenantLookup: TenantLookupService,
    private readonly userFinder: UserFinder,
    private readonly authMode: AuthMode = "jwt",
    private readonly sessionStore: SessionStore = new InMemorySessionStore()
  ) {}

  async login(input: {
    desk: "sa" | "admin" | "tenant";
    email: string;
    password: string;
    tenantCode?: string;
  }): Promise<PlatformSessionRecord> {
    let user: AuthUserRecord | null = null;
    let resolvedTenantId: string | undefined;
    let resolvedTenantCode: string | undefined;

    if (input.desk === "tenant") {
      if (!input.tenantCode) {
        throw AppError.validation("Tenant code is required for tenant login");
      }

      const tenant = await this.tenantLookup.findByCode(input.tenantCode);
      if (!tenant) {
        throw AppError.unauthorized("Invalid tenant code");
      }
      if (tenant.status !== "active") {
        throw AppError.forbidden("Tenant is not active");
      }

      const resolution = await this.tenantLookup.resolveDatabase(tenant.id);
      if (!resolution) {
        throw AppError.internal("Tenant database not provisioned");
      }

      resolvedTenantId = tenant.id;
      resolvedTenantCode = tenant.tenantCode;
      user = await this.userFinder.findTenantUser(resolution.databaseName, input.email);
    } else {
      user = await this.userFinder.findMasterUser(input.desk, input.email);
    }

    if (!user || !verifyPassword(input.password, user.password_hash)) {
      throw AppError.unauthorized("Email or password is incorrect");
    }

    if (user.status !== "active") {
      throw AppError.forbidden("User account is not active");
    }

    const userType = input.desk === "sa" ? "super_admin" : input.desk === "admin" ? "staff" : "tenant";

    if (this.authMode === "cookie" || this.authMode === "hybrid") {
      const session = await this.sessionStore.createAsync({
        email: input.email,
        userType,
        ...(resolvedTenantId ? { tenantId: resolvedTenantId } : {}),
        ...(resolvedTenantCode ? { tenantCode: resolvedTenantCode } : {})
      });

      return {
        ...session,
        ...(resolvedTenantId ? { tenantId: resolvedTenantId } : {}),
        ...(resolvedTenantCode ? { tenantCode: resolvedTenantCode } : {})
      };
    }

    // JWT mode
    const token = createJWT(
      {
        email: input.email,
        userType,
        ...(resolvedTenantId ? { tenantId: resolvedTenantId } : {}),
        ...(resolvedTenantCode ? { tenantCode: resolvedTenantCode } : {})
      },
      this.jwtSecret
    );

    return {
      createdAt: new Date().toISOString(),
      email: input.email,
      ...(resolvedTenantId ? { tenantId: resolvedTenantId } : {}),
      ...(resolvedTenantCode ? { tenantCode: resolvedTenantCode } : {}),
      token,
      userType
    };
  }

  async getSession(token?: string): Promise<PlatformSessionRecord> {
    if (!token) {
      throw AppError.unauthorized("No active session");
    }

    // In cookie/hybrid mode, check session store first
    if (this.authMode === "cookie" || this.authMode === "hybrid") {
      const session = await this.sessionStore.getAsync(token);
      if (!session) {
        throw AppError.unauthorized("Session not found or expired");
      }
      return session;
    }

    // JWT mode: verify the token
    let payload: JWTPayload;
    try {
      payload = verifyJWT(token, this.jwtSecret);
    } catch {
      throw AppError.unauthorized("Invalid or expired session");
    }

    return {
      createdAt: new Date(payload.iat * 1000).toISOString(),
      email: payload.email,
      ...(payload.tenantId ? { tenantId: payload.tenantId } : {}),
      ...(payload.tenantCode ? { tenantCode: payload.tenantCode } : {}),
      token,
      userType: payload.userType
    };
  }

  async logout(token?: string): Promise<void> {
    if (this.authMode === "cookie" || this.authMode === "hybrid") {
      await this.sessionStore.destroyAsync(token);
    }
    // JWT mode: stateless, no server-side invalidation
  }
}
