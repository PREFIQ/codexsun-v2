import { describe, it, expect } from "vitest";
import { runHealthChecks, type HealthCheck } from "../health/health.js";
import { createTestApiApp } from "../testing/index.js";
import { registerHealthRoute } from "../api/health-route.js";

describe("Health Check System", () => {
  it("should aggregate health check results correctly", async () => {
    const checks: HealthCheck[] = [
      { name: "db", check: () => ({ status: "ok" }) },
      { name: "cache", check: () => ({ status: "degraded" }) }
    ];

    const result = await runHealthChecks(checks);
    expect(result.status).toBe("degraded");
    expect(result.checks.db?.status).toBe("ok");
    expect(result.checks.cache?.status).toBe("degraded");
  });

  it("should aggregate to down if any check is down", async () => {
    const checks: HealthCheck[] = [
      { name: "db", check: () => ({ status: "ok" }) },
      { name: "queue", check: () => ({ status: "down" }) }
    ];

    const result = await runHealthChecks(checks);
    expect(result.status).toBe("down");
  });

  it("should return 503 status code when down, and 200 when ok/degraded", async () => {
    const app = await createTestApiApp();
    
    // 1. Ok checks -> 200
    const okChecks: HealthCheck[] = [
      { name: "db", check: () => ({ status: "ok" }) }
    ];
    registerHealthRoute(app, okChecks);
    
    let res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    let body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("ok");

    // Re-register health on another app to avoid fastify route collision
    const app2 = await createTestApiApp();
    const downChecks: HealthCheck[] = [
      { name: "db", check: () => ({ status: "down" }) }
    ];
    registerHealthRoute(app2, downChecks);
    
    res = await app2.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(503);
    body = JSON.parse(res.body);
    expect(body.success).toBe(true); // health endpoint itself succeeded, wrapping results
    expect(body.data.status).toBe("down");
  });

  it("should include tenantId in health response meta when x-tenant-id is sent", async () => {
    const app = await createTestApiApp();
    const checks: HealthCheck[] = [
      { name: "db", check: () => ({ status: "ok" }) }
    ];
    registerHealthRoute(app, checks);

    const res = await app.inject({
      method: "GET",
      url: "/health",
      headers: { "x-tenant-id": "tenant-health-001" }
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.meta.tenantId).toBe("tenant-health-001");
  });

  it("should include correlationId in health response meta when x-correlation-id is sent", async () => {
    const app = await createTestApiApp();
    const checks: HealthCheck[] = [
      { name: "db", check: () => ({ status: "ok" }) }
    ];
    registerHealthRoute(app, checks);

    const res = await app.inject({
      method: "GET",
      url: "/health",
      headers: { "x-correlation-id": "health-corr-001" }
    });

    expect(res.headers["x-correlation-id"]).toBe("health-corr-001");
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.meta.correlationId).toBe("health-corr-001");
  });
});
