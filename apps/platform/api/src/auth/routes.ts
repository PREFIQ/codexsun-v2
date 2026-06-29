import "fastify";
import "@fastify/cookie";
import { AppError } from "@codexsun/framework/errors";
import { ok } from "@codexsun/framework/http";
import { loginRequestSchema } from "@codexsun/platform/auth";
import type { FastifyInstance } from "fastify";

function responseMeta(request: { correlationId?: string; id: string; tenantId?: string }) {
  return {
    requestId: request.id,
    ...(request.correlationId ? { correlationId: request.correlationId } : {}),
    ...(request.tenantId ? { tenantId: request.tenantId } : {})
  };
}

function tokenFromRequest(request: {
  headers: Record<string, unknown>;
}) {
  const authorization = request.headers.authorization;
  return typeof authorization === "string" && authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : undefined;
}

function userTypeToActorType(userType: string): "staff" | "super_admin" | "system" | "tenant" {
  if (userType === "super_admin") return "super_admin";
  if (userType === "staff") return "staff";
  if (userType === "tenant") return "tenant";
  return "system";
}

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post("/auth/login", async (request, reply) => {
    const parsed = loginRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      throw AppError.validation("Login details are invalid", parsed.error.flatten());
    }

    const { desk, email, password, tenantCode } = parsed.data;
    let session;
    try {
      session = await app.authService.login({
        desk,
        email,
        password,
        ...(tenantCode ? { tenantCode } : {})
      });
    } catch (error) {
      await app.auditService.authLoginFailed({
        actorType: desk === "sa" ? "super_admin" : desk === "admin" ? "staff" : "tenant",
        actorEmail: email,
        ...(request.correlationId ? { correlationId: request.correlationId } : {})
      });
      throw error;
    }

    await app.auditService.authLoginSuccess({
      actorType: userTypeToActorType(session.userType),
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      ...(session.tenantId ? { tenantId: session.tenantId } : {})
    });

    reply.setCookie("codexsun_session", session.token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: false
    });

    return ok(
      {
        accessToken: session.token,
        email: session.email,
        tenantId: session.tenantId,
        tenantCode: session.tenantCode,
        userType: session.userType
      },
      responseMeta(request)
    );
  });

  app.get("/auth/session", async (request) => {
    const bearerToken = tokenFromRequest(request);
    const cookieToken = request.cookies?.codexsun_session;
    const token = bearerToken || cookieToken;
    if (!token) {
      return ok(
        {
          authenticated: false
        },
        responseMeta(request)
      );
    }

    try {
      const session = await app.authService.getSession(token);
      return ok(
        {
          authenticated: true,
          email: session.email,
          tenantId: session.tenantId,
          tenantCode: session.tenantCode,
          userType: session.userType
        },
        responseMeta(request)
      );
    } catch {
      return ok(
        {
          authenticated: false
        },
        responseMeta(request)
      );
    }
  });

  app.post("/auth/logout", async (request, reply) => {
    const bearerToken = tokenFromRequest(request);
    const cookieToken = request.cookies?.codexsun_session;
    const token = bearerToken || cookieToken;

    try {
      const session = await app.authService.getSession(token);
      await app.auditService.authLogout({
        actorType: userTypeToActorType(session.userType),
        actorEmail: session.email,
        ...(request.correlationId ? { correlationId: request.correlationId } : {}),
        ...(session.tenantId ? { tenantId: session.tenantId } : {})
      });
    } catch {
      // Session already invalid; audit without details
    }

    await app.authService.logout(token);
    reply.clearCookie("codexsun_session", { path: "/" });

    return ok(
      {
        loggedOut: true
      },
      responseMeta(request)
    );
  });
}
