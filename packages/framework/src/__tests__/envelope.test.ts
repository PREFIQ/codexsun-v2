import { describe, it, expect } from "vitest";
import { ok, fail } from "../http/envelope.js";

describe("HTTP Envelope Helpers", () => {
  it("should wrap data in a success envelope with tenantId and correlationId", () => {
    const data = { id: 1, name: "Test" };
    const envelope = ok(data, { requestId: "req-123", correlationId: "corr-abc", tenantId: "tenant-abc" });

    expect(envelope.success).toBe(true);
    expect(envelope.data).toEqual(data);
    expect(envelope.meta.requestId).toBe("req-123");
    expect(envelope.meta.correlationId).toBe("corr-abc");
    expect(envelope.meta.tenantId).toBe("tenant-abc");
    expect(envelope.meta.timestamp).toBeDefined();
  });

  it("should wrap error in a fail envelope with tenantId and correlationId", () => {
    const error = { code: "BAD_REQUEST", message: "Invalid payload" };
    const envelope = fail(error, { requestId: "req-123", correlationId: "corr-abc", tenantId: "tenant-abc" });

    expect(envelope.success).toBe(false);
    expect(envelope.error).toEqual(error);
    expect(envelope.meta.requestId).toBe("req-123");
    expect(envelope.meta.correlationId).toBe("corr-abc");
    expect(envelope.meta.tenantId).toBe("tenant-abc");
    expect(envelope.meta.timestamp).toBeDefined();
  });

  it("should create envelope without optional fields when not provided", () => {
    const data = { id: 1 };
    const envelope = ok(data, { requestId: "req-456" });

    expect(envelope.success).toBe(true);
    expect(envelope.data).toEqual(data);
    expect(envelope.meta.requestId).toBe("req-456");
    expect(envelope.meta.correlationId).toBeUndefined();
    expect(envelope.meta.tenantId).toBeUndefined();
  });

  it("should create fail envelope without optional fields when not provided", () => {
    const error = { code: "NOT_FOUND", message: "Missing" };
    const envelope = fail(error, { requestId: "req-789" });

    expect(envelope.success).toBe(false);
    expect(envelope.error).toEqual(error);
    expect(envelope.meta.requestId).toBe("req-789");
    expect(envelope.meta.correlationId).toBeUndefined();
    expect(envelope.meta.tenantId).toBeUndefined();
  });
});
