import type { FastifyInstance, LightMyRequestResponse } from "fastify";
import { createApiApp } from "../api/create-api-app.js";

export async function createTestApiApp(options?: {
  appName?: string;
  cookieSecret?: string;
  corsOrigins?: string[];
  environment?: string;
}): Promise<FastifyInstance> {
  return createApiApp({
    appName: options?.appName ?? "Test API App",
    cookieSecret: options?.cookieSecret ?? "test-cookie-secret-min-length-16-chars",
    corsOrigins: options?.corsOrigins ?? ["http://localhost:5520"],
    environment: options?.environment ?? "test"
  });
}

export function expectOk<TData = unknown>(res: LightMyRequestResponse): TData {
  const body = JSON.parse(res.body);
  if (!body.success) {
    throw new Error(`Expected success envelope, got error: ${body.error?.message}`);
  }
  return body.data as TData;
}

export function expectFail<TError = unknown>(res: LightMyRequestResponse, statusCode?: number): TError {
  if (statusCode !== undefined && res.statusCode !== statusCode) {
    throw new Error(`Expected status code ${statusCode}, got ${res.statusCode}`);
  }
  const body = JSON.parse(res.body);
  if (body.success) {
    throw new Error(`Expected error envelope, got success: ${JSON.stringify(body.data)}`);
  }
  return body.error as TError;
}
