import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import { isAppError } from "../errors/index.js";
import { fail, ok } from "../http/index.js";

export type CreateApiAppOptions = {
  appName: string;
  cookieSecret: string;
  corsOrigins: string[];
  environment: string;
  onReady?: () => Promise<void> | void;
};

export async function createApiApp(options: CreateApiAppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: options.environment === "development" ? "info" : "warn"
    }
  });

  await app.register(cors, {
    credentials: true,
    origin: options.corsOrigins
  });

  await app.register(cookie, {
    secret: options.cookieSecret
  });

  app.setErrorHandler((error, request, reply) => {
    if (isAppError(error)) {
      return reply.code(error.statusCode).send(
        fail(
          {
            code: error.code,
            details: error.details,
            message: error.message
          },
          {
            requestId: request.id
          }
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
        {
          requestId: request.id
        }
      )
    );
  });

  if (options.onReady) {
    app.addHook("onReady", options.onReady);
  }

  app.get("/", async (request) =>
    ok(
      {
        name: options.appName,
        status: "ready"
      },
      {
        requestId: request.id
      }
    )
  );

  return app;
}
