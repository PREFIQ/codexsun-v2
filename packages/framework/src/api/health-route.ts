import type { FastifyInstance } from "fastify";
import { runHealthChecks, type HealthCheck } from "../health/index.js";
import { ok } from "../http/index.js";

export function registerHealthRoute(app: FastifyInstance, checks: HealthCheck[]) {
  app.get("/health", async (request) =>
    ok(await runHealthChecks(checks), {
      requestId: request.id
    })
  );
}
