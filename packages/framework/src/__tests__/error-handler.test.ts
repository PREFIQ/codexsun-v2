import { describe, it, expect } from "vitest";
import { AppError } from "../errors/app-error.js";
import { createTestApiApp } from "../testing/index.js";

describe("Error Handler", () => {
  it("should map AppError correctly to fail envelope and status code", async () => {
    const app = await createTestApiApp();
    
    app.get("/error-test", async () => {
      throw new AppError({
        code: "CUSTOM_FAIL",
        message: "Test failure",
        statusCode: 422,
        details: { field: "email" }
      });
    });

    const res = await app.inject({ method: "GET", url: "/error-test" });
    expect(res.statusCode).toBe(422);
    
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("CUSTOM_FAIL");
    expect(body.error.message).toBe("Test failure");
    expect(body.error.details).toEqual({ field: "email" });
    expect(body.meta.requestId).toBeDefined();
  });

  it("should map static factory methods of AppError correctly", async () => {
    const app = await createTestApiApp();

    app.get("/validation-error", async () => {
      throw AppError.validation("Invalid age field", { field: "age", expected: "number" });
    });

    const res = await app.inject({ method: "GET", url: "/validation-error" });
    expect(res.statusCode).toBe(400);

    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toBe("Invalid age field");
    expect(body.error.details).toEqual({ field: "age", expected: "number" });
  });

  it("should catch unknown errors and map to generic INTERNAL_ERROR 500", async () => {
    const app = await createTestApiApp();

    app.get("/unknown-error", async () => {
      throw new Error("Something database crashed");
    });

    const res = await app.inject({ method: "GET", url: "/unknown-error" });
    expect(res.statusCode).toBe(500);

    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INTERNAL_ERROR");
    expect(body.error.message).toBe("Something went wrong");
  });

  it("should include tenantId in error envelope when x-tenant-id header is sent", async () => {
    const app = await createTestApiApp();

    app.get("/tenant-error-test", async () => {
      throw AppError.validation("Test tenant error");
    });

    const res = await app.inject({
      method: "GET",
      url: "/tenant-error-test",
      headers: { "x-tenant-id": "tenant-xyz" }
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.meta.tenantId).toBe("tenant-xyz");
    expect(body.meta.requestId).toBeDefined();
  });

  it("should echo x-correlation-id header in response and envelope meta", async () => {
    const app = await createTestApiApp();

    const res = await app.inject({
      method: "GET",
      url: "/",
      headers: { "x-correlation-id": "my-trace-id" }
    });

    expect(res.headers["x-correlation-id"]).toBe("my-trace-id");
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.meta.requestId).toBeDefined();
    expect(body.meta.correlationId).toBe("my-trace-id");
  });

  it("should generate correlationId from request.id when no header is sent", async () => {
    const app = await createTestApiApp();

    const res = await app.inject({ method: "GET", url: "/" });

    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.meta.correlationId).toBeDefined();
    expect(body.meta.correlationId).not.toBe("");
  });
});
