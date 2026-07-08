import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { createApp } from "../app.js";
import { hashPassword } from "@codexsun/platform/auth";

describe("Core Routes (Task 15+)", () => {
  let app: FastifyInstance;
  let saToken: string;
  let tenantId: string;
  const commonDefinitionKey = "address-book";
  const commonRecordCode = `core-test-type-${Date.now()}`;
  const productCode = `CORE-PROD-${Date.now()}`;

  beforeAll(async () => {
    app = await createApp();
    await app.ready();
    const hash = hashPassword("test-core-pass", "codexsun-super-admin");

    await app.masterDbPool.execute(
      `INSERT INTO super_admin_users (display_name, email, password_hash) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      ["Test Core SA", "test-core-sa@codexsun.com", hash]
    );

    const saLogin = await app.inject({
      method: "POST", url: "/auth/login",
      body: { desk: "sa", email: "test-core-sa@codexsun.com", password: "test-core-pass" }
    });
    saToken = JSON.parse(saLogin.body).data.accessToken;

    let tenantRes = await app.inject({
      method: "POST", url: "/tenants",
      headers: { Authorization: `Bearer ${saToken}` },
      body: { tenantCode: "core-test-tenant", tenantName: "Core Test Tenant" }
    });
    if (tenantRes.statusCode === 409) {
      const listRes = await app.inject({
        method: "GET", url: "/tenants",
        headers: { Authorization: `Bearer ${saToken}` }
      });
      const list = JSON.parse(listRes.body).data;
      tenantId = list.find((t: { tenantCode: string }) => t.tenantCode === "core-test-tenant").id;
    } else {
      tenantId = JSON.parse(tenantRes.body).data.id;
    }

    try {
      await app.masterDbPool.execute(
        `INSERT INTO tenant_module_activation (tenant_id, module_key, status) VALUES (?, ?, 'enabled')`,
        [tenantId, "core"]
      );
    } catch {
      await app.masterDbPool.execute(
        `UPDATE tenant_module_activation SET status = 'enabled' WHERE tenant_id = ? AND module_key = ?`,
        [tenantId, "core"]
      );
    }
  });

  afterAll(async () => { await app.close(); });

  describe("GET /core/common/definitions", () => {
    it("returns definition list", async () => {
      const res = await app.inject({
        method: "GET", url: "/core/common/definitions",
        headers: { Authorization: `Bearer ${saToken}` }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(30);
      expect(body.data[0].definitionKey).toBeDefined();
    });

    it("returns 401 without token", async () => {
      const res = await app.inject({ method: "GET", url: "/core/common/definitions" });
      expect(res.statusCode).toBe(401);
    });
  });

  describe("CRUD /core/common/records", () => {
    let recordId: string;

    it("POST creates a record", async () => {
      const res = await app.inject({
        method: "POST", url: "/core/common/records",
        headers: { Authorization: `Bearer ${saToken}`, "x-tenant-id": tenantId },
        body: { definitionKey: commonDefinitionKey, code: commonRecordCode, name: "Core Test Type" }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.code).toBe(commonRecordCode);
      expect(body.data.tenantId).toBe(tenantId);
      expect(body.data.isActive).toBe(true);
      recordId = body.data.id;
    });

    it("POST rejects duplicate code", async () => {
      const res = await app.inject({
        method: "POST", url: "/core/common/records",
        headers: { Authorization: `Bearer ${saToken}`, "x-tenant-id": tenantId },
        body: { definitionKey: commonDefinitionKey, code: commonRecordCode, name: "Duplicate" }
      });
      expect(res.statusCode).toBe(409);
    });

    it("POST rejects missing fields", async () => {
      const res = await app.inject({
        method: "POST", url: "/core/common/records",
        headers: { Authorization: `Bearer ${saToken}`, "x-tenant-id": tenantId },
        body: { definitionKey: commonDefinitionKey }
      });
      expect(res.statusCode).toBe(400);
    });

    it("GET lists records", async () => {
      const res = await app.inject({
        method: "GET", url: `/core/common/records?definitionKey=${commonDefinitionKey}`,
        headers: { Authorization: `Bearer ${saToken}`, "x-tenant-id": tenantId }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("GET by id returns record", async () => {
      const res = await app.inject({
        method: "GET", url: `/core/common/records/${recordId}?definitionKey=${commonDefinitionKey}`,
        headers: { Authorization: `Bearer ${saToken}`, "x-tenant-id": tenantId }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.id).toBe(recordId);
    });

    it("GET by id returns 404 for unknown", async () => {
      const res = await app.inject({
        method: "GET", url: `/core/common/records/nonexistent-id?definitionKey=${commonDefinitionKey}`,
        headers: { Authorization: `Bearer ${saToken}`, "x-tenant-id": tenantId }
      });
      expect(res.statusCode).toBe(404);
    });

    it("PUT updates a record", async () => {
      const res = await app.inject({
        method: "PUT", url: `/core/common/records/${recordId}`,
        headers: { Authorization: `Bearer ${saToken}`, "x-tenant-id": tenantId },
        body: { definitionKey: commonDefinitionKey, name: "Updated Core Type" }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.name).toBe("Updated Core Type");
    });

    it("POST archive archives a record", async () => {
      const res = await app.inject({
        method: "POST", url: `/core/common/records/${recordId}/archive?definitionKey=${commonDefinitionKey}`,
        headers: { Authorization: `Bearer ${saToken}`, "x-tenant-id": tenantId }
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).data.archived).toBe(true);
    });

    it("POST restore restores a record", async () => {
      const res = await app.inject({
        method: "POST", url: `/core/common/records/${recordId}/restore?definitionKey=${commonDefinitionKey}`,
        headers: { Authorization: `Bearer ${saToken}`, "x-tenant-id": tenantId }
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).data.restored).toBe(true);
    });

    it("POST archive is idempotent on already archived", async () => {
      await app.inject({
        method: "POST", url: `/core/common/records/${recordId}/archive?definitionKey=${commonDefinitionKey}`,
        headers: { Authorization: `Bearer ${saToken}`, "x-tenant-id": tenantId }
      });
      const res = await app.inject({
        method: "POST", url: `/core/common/records/${recordId}/archive?definitionKey=${commonDefinitionKey}`,
        headers: { Authorization: `Bearer ${saToken}`, "x-tenant-id": tenantId }
      });
      expect(res.statusCode).toBe(409);
    });

    it("rejects without tenant header", async () => {
      const res = await app.inject({
        method: "GET", url: "/core/common/records",
        headers: { Authorization: `Bearer ${saToken}` }
      });
      expect(res.statusCode).toBe(400);
    });

    it("rejects unauthorized", async () => {
      const res = await app.inject({
        method: "GET", url: "/core/common/records",
        headers: { "x-tenant-id": tenantId }
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe("CRUD /core/contacts", () => {
    let contactId: string;

    it("POST creates a contact", async () => {
      const res = await app.inject({
        method: "POST", url: "/core/contacts",
        headers: { Authorization: `Bearer ${saToken}`, "x-tenant-id": tenantId },
        body: { name: `Core Customer ${Date.now()}`, primaryPhone: "+91-9876543210", primaryEmail: "core@test.in" }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.name).toContain("Core Customer");
      contactId = body.data.contactId;
    });

    it("GET lists contacts", async () => {
      const res = await app.inject({
        method: "GET", url: "/core/contacts",
        headers: { Authorization: `Bearer ${saToken}`, "x-tenant-id": tenantId }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("GET by id returns contact", async () => {
      const res = await app.inject({
        method: "GET", url: `/core/contacts/${contactId}`,
        headers: { Authorization: `Bearer ${saToken}`, "x-tenant-id": tenantId }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.contactId).toBe(contactId);
    });

    it("PUT updates a contact", async () => {
      const res = await app.inject({
        method: "PUT", url: `/core/contacts/${contactId}`,
        headers: { Authorization: `Bearer ${saToken}`, "x-tenant-id": tenantId },
        body: { name: "Updated Core Customer" }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.name).toBe("Updated Core Customer");
    });

    it("POST archive archives a contact", async () => {
      const res = await app.inject({
        method: "POST", url: `/core/contacts/${contactId}/archive`,
        headers: { Authorization: `Bearer ${saToken}`, "x-tenant-id": tenantId }
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).data.archived).toBe(true);
    });

    it("POST restore restores a contact", async () => {
      const res = await app.inject({
        method: "POST", url: `/core/contacts/${contactId}/restore`,
        headers: { Authorization: `Bearer ${saToken}`, "x-tenant-id": tenantId }
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).data.restored).toBe(true);
    });
  });

  describe("CRUD /core/companies", () => {
    let companyId: string;

    it("POST creates a company", async () => {
      const res = await app.inject({
        method: "POST", url: "/core/companies",
        headers: { Authorization: `Bearer ${saToken}`, "x-tenant-id": tenantId },
        body: { legalName: "Core Test Co", phone: ["+91-9999999999"], email: ["co@test.in"] }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.legalName).toBe("Core Test Co");
      companyId = body.data.companyId;
    });

    it("GET lists companies", async () => {
      const res = await app.inject({
        method: "GET", url: "/core/companies",
        headers: { Authorization: `Bearer ${saToken}`, "x-tenant-id": tenantId }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("GET by id returns company", async () => {
      const res = await app.inject({
        method: "GET", url: `/core/companies/${companyId}`,
        headers: { Authorization: `Bearer ${saToken}`, "x-tenant-id": tenantId }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.companyId).toBe(companyId);
    });

    it("PUT updates a company", async () => {
      const res = await app.inject({
        method: "PUT", url: `/core/companies/${companyId}`,
        headers: { Authorization: `Bearer ${saToken}`, "x-tenant-id": tenantId },
        body: { legalName: "Updated Core Co" }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.legalName).toBe("Updated Core Co");
    });
  });

  describe("CRUD /core/products", () => {
    let productId: string;

    it("POST creates a product", async () => {
      const res = await app.inject({
        method: "POST", url: "/core/products",
        headers: { Authorization: `Bearer ${saToken}`, "x-tenant-id": tenantId },
        body: { code: productCode, name: "Core Product", unitId: "pcs" }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.code).toBe(productCode);
      productId = body.data.itemId;
    });

    it("GET lists products", async () => {
      const res = await app.inject({
        method: "GET", url: "/core/products",
        headers: { Authorization: `Bearer ${saToken}`, "x-tenant-id": tenantId }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("GET by code returns product", async () => {
      const res = await app.inject({
        method: "GET", url: `/core/products/by-code/${productCode}`,
        headers: { Authorization: `Bearer ${saToken}`, "x-tenant-id": tenantId }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.code).toBe(productCode);
    });

    it("PUT updates a product", async () => {
      const res = await app.inject({
        method: "PUT", url: `/core/products/${productId}`,
        headers: { Authorization: `Bearer ${saToken}`, "x-tenant-id": tenantId },
        body: { name: "Updated Core Product" }
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.data.name).toBe("Updated Core Product");
    });
  });
});
