import { ApiClient } from "@codexsun/platform/api-client";

const apiBaseUrl = import.meta.env.VITE_PLATFORM_API_URL;

export const client = new ApiClient(apiBaseUrl);

export type Desk = "sa" | "admin" | "tenant";

const TOKEN_KEYS: Record<Desk, string> = {
  sa: "codexsun_session_sa",
  admin: "codexsun_session_admin",
  tenant: "codexsun_session_tenant",
};

const TENANT_ID_KEY = "codexsun_tenant_id";

export function getToken(desk: Desk): string | null {
  try {
    return localStorage.getItem(TOKEN_KEYS[desk]);
  } catch {
    return null;
  }
}

export function getTenantId(): string | null {
  try {
    return localStorage.getItem(TENANT_ID_KEY);
  } catch {
    return null;
  }
}

function authHeaders(desk?: Desk): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = desk ? getToken(desk) : null;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (desk === "tenant") {
    const tenantId = getTenantId();
    if (tenantId) headers["x-tenant-id"] = tenantId;
  }
  return headers;
}

export async function apiGet<T>(path: string, desk?: Desk): Promise<T> {
  return client.get<T>(path, { headers: authHeaders(desk) });
}

export async function apiPost<T>(path: string, data?: unknown, desk?: Desk): Promise<T> {
  return client.post<T>(path, data, { headers: authHeaders(desk) });
}

export async function apiPut<T>(path: string, data?: unknown, desk?: Desk): Promise<T> {
  return client.put<T>(path, data, { headers: authHeaders(desk) });
}

export async function apiDelete<T>(path: string, desk?: Desk): Promise<T> {
  return client.delete<T>(path, { headers: authHeaders(desk) });
}
