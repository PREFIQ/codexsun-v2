import type { FastifyInstance } from "fastify";
import { createStructuredLog } from "../logger/logger.js";

const requestStartTimes = new WeakMap<object, [number, number]>();

export function registerRequestLogging(app: FastifyInstance): void {
  app.addHook("onRequest", async (request) => {
    requestStartTimes.set(request.raw, process.hrtime());

    const log = createStructuredLog({
      level: "info",
      message: `Incoming request: ${request.method} ${request.url}`,
      requestId: request.id,
      action: "request.start"
    });
    if (request.correlationId) {
      log.correlationId = request.correlationId;
    }
    if (request.tenantId) {
      log.tenantId = request.tenantId;
    }

    request.log.info(log);
  });

  app.addHook("onResponse", async (request, reply) => {
    const start = requestStartTimes.get(request.raw);
    let durationMs: number | undefined;
    if (start) {
      const diff = process.hrtime(start);
      durationMs = (diff[0] * 1e3) + (diff[1] / 1e6);
    }

    const log = createStructuredLog({
      level: reply.statusCode >= 500 ? "error" : reply.statusCode >= 400 ? "warn" : "info",
      message: `Request completed: ${request.method} ${request.url} - Status ${reply.statusCode}`,
      requestId: request.id,
      action: "request.end"
    });
    if (request.correlationId) {
      log.correlationId = request.correlationId;
    }
    if (request.tenantId) {
      log.tenantId = request.tenantId;
    }
    if (durationMs !== undefined) {
      log.durationMs = durationMs;
    }

    if (reply.statusCode >= 500) {
      request.log.error(log);
    } else if (reply.statusCode >= 400) {
      request.log.warn(log);
    } else {
      request.log.info(log);
    }
  });
}
