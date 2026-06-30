import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import { isAppError } from "../errors/index.js";
import { fail, ok } from "../http/index.js";
import { registerShutdownHooks, type ShutdownHook } from "./graceful-shutdown.js";
import { registerTenantContext } from "./tenant-context.js";

export type CreateApiAppOptions = {
  appName: string;
  cookieSecret: string;
  corsOrigins: string[];
  environment: string;
  onReady?: () => Promise<void> | void;
  shutdownHooks?: ShutdownHook[];
};

function requestMeta(request: { correlationId?: string; id: string; tenantId?: string }) {
  return {
    requestId: request.id,
    ...(request.correlationId ? { correlationId: request.correlationId } : {}),
    ...(request.tenantId ? { tenantId: request.tenantId } : {})
  };
}

export async function createApiApp(options: CreateApiAppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.environment === "development" ? false : { level: "warn" }
  });

  await app.register(cors, {
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    origin: options.corsOrigins
  });

  await app.register(cookie, {
    secret: options.cookieSecret
  });

  app.addHook("onRequest", async (_request, reply) => {
    reply.header("Permissions-Policy", "unload=*");
  });

  registerTenantContext(app);

  app.setErrorHandler((error, request, reply) => {
    if (isAppError(error)) {
      return reply.code(error.statusCode).send(
        fail(
          {
            code: error.code,
            details: error.details,
            message: error.message
          },
          requestMeta(request)
        )
      );
    }

    request.log.error(error);

    return reply.code(500).send(
      fail(
        {
          code: "INTERNAL_ERROR",
          message: "Something went wrong"
        },
        requestMeta(request)
      )
    );
  });

  if (options.onReady) {
    app.addHook("onReady", options.onReady);
  }

  if (options.shutdownHooks?.length) {
    registerShutdownHooks(app, options.shutdownHooks);
  }

  app.get("/", async (request) =>
    ok(
      {
        name: options.appName,
        status: "ready"
      },
      requestMeta(request)
    )
  );

  return app;
}
