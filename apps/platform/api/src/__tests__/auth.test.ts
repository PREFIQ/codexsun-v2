import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { createApp } from "../app.js";
import { hashPassword } from "@codexsun/platform/auth";

const TEST_TENANT_CODE = "test-" + Date.now();

describe("Auth Endpoints", () => {
  let app: FastifyInstance;
  let saToken: string;

  beforeAll(async () => {
    app = await createApp();
    await app.ready();

    // Seed a known super admin user directly into the database for testing
    const hash = hashPassword("test-sa-pass", "codexsun-super-admin");
    await app.masterDbPool.execute(
      `INSERT INTO super_admin_users (display_name, email, password_hash)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      ["Test SA", "test-sa@codexsun.com", hash]
    );

    // Login as SA to get a token for tenant management tests
    const loginRes = await app.inject({
      method: "POST",
      url: "/auth/login",
      body: {
        desk: "sa",
        email: "test-sa@codexsun.com",
        password: "test-sa-pass"
      }
    });
    const loginBody = JSON.parse(loginRes.body);
    saToken = loginBody.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it("should fail login with incorrect credentials", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      body: {
        desk: "sa",
        email: "test-sa@codexsun.com",
        password: "wrongpassword"
      }
    });

    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
  });

  it("should login successfully with correct credentials and set session cookie", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      body: {
        desk: "sa",
        email: "test-sa@codexsun.com",
        password: "test-sa-pass"
      }
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.email).toBe("test-sa@codexsun.com");
    expect(body.data.accessToken).toBeDefined();
  });

  describe("Tenant Management", () => {
    it("should reject unauthenticated request to list tenants", async () => {
      const res = await app.inject({ method: "GET", url: "/tenants" });
      expect(res.statusCode).toBe(401);
    });

    it("should list tenants for super admin", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/tenants",
        headers: { Authorization: `Bearer ${saToken}` }
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it("should create a new tenant", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/tenants",
        headers: { Authorization: `Bearer ${saToken}` },
        body: {
          tenantCode: TEST_TENANT_CODE,
          tenantName: "Test Tenant"
        }
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data.tenantCode).toBe(TEST_TENANT_CODE.toLowerCase());
      expect(body.data.id).toBeDefined();
    });

    it("should reject duplicate tenant code", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/tenants",
        headers: { Authorization: `Bearer ${saToken}` },
        body: {
          tenantCode: TEST_TENANT_CODE,
          tenantName: "Duplicate"
        }
      });

      expect(res.statusCode).toBe(409);
    });

    it("should reject create with missing tenantCode", async () => {
      const res = await app.inject({
        method: "POST",
        url: "/tenants",
        headers: { Authorization: `Bearer ${saToken}` },
        body: { tenantName: "NoCode" }
      });

      expect(res.statusCode).toBe(400);
    });

    it("should read a tenant by id", async () => {
      const listRes = await app.inject({
        method: "GET",
        url: "/tenants",
        headers: { Authorization: `Bearer ${saToken}` }
      });
      const listBody = JSON.parse(listRes.body);
      const created = listBody.data.find((t: { tenantCode: string }) => t.tenantCode === TEST_TENANT_CODE);
      expect(created).toBeDefined();

      const res = await app.inject({
        method: "GET",
        url: `/tenants/${created.id}`,
        headers: { Authorization: `Bearer ${saToken}` }
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.tenantCode).toBe(TEST_TENANT_CODE);
    });

    it("should update a tenant name", async () => {
      const listRes = await app.inject({
        method: "GET",
        url: "/tenants",
        headers: { Authorization: `Bearer ${saToken}` }
      });
      const listBody = JSON.parse(listRes.body);
      const created = listBody.data.find((t: { tenantCode: string }) => t.tenantCode === TEST_TENANT_CODE);

      const res = await app.inject({
        method: "PUT",
        url: `/tenants/${created.id}`,
        headers: { Authorization: `Bearer ${saToken}` },
        body: { tenantName: "Updated Name" }
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.tenantName).toBe("Updated Name");
    });

    it("should reject non-super-admin from listing tenants", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/tenants",
        headers: { Authorization: "Bearer invalid-token" }
      });

      expect(res.statusCode).toBe(401);
    });

    it("should delete a tenant", async () => {
      const listRes = await app.inject({
        method: "GET",
        url: "/tenants",
        headers: { Authorization: `Bearer ${saToken}` }
      });
      const listBody = JSON.parse(listRes.body);
      const created = listBody.data.find((t: { tenantCode: string }) => t.tenantCode === TEST_TENANT_CODE);

      const res = await app.inject({
        method: "DELETE",
        url: `/tenants/${created.id}`,
        headers: { Authorization: `Bearer ${saToken}` }
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.deleted).toBe(true);
    });
  });
});
