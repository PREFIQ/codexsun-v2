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

export function setToken(desk: Desk, token: string): void {
  try {
    localStorage.setItem(TOKEN_KEYS[desk], token);
  } catch {}
}

export function clearToken(desk: Desk): void {
  try {
    localStorage.removeItem(TOKEN_KEYS[desk]);
  } catch {}
}

export function getTenantId(): string | null {
  try {
    return localStorage.getItem(TENANT_ID_KEY);
  } catch {
    return null;
  }
}

export function setTenantId(id: string | undefined): void {
  try {
    if (id) {
      localStorage.setItem(TENANT_ID_KEY, id);
    } else {
      localStorage.removeItem(TENANT_ID_KEY);
    }
  } catch {}
}

function authHeaders(desk?: Desk): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = desk ? getToken(desk) : null;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  // Send x-tenant-id for tenant desk calls
  if (desk === "tenant") {
    const tenantId = getTenantId();
    if (tenantId) {
      headers["x-tenant-id"] = tenantId;
    }
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

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed";
}

export async function login(input: { desk: Desk; email: string; password: string; tenantCode?: string }) {
  try {
    const data = await client.post<{
      accessToken?: string;
      email: string;
      tenantId?: string;
      tenantCode?: string;
      userType: string;
    }>("/auth/login", input);

    if (data.accessToken) {
      setToken(input.desk, data.accessToken);
    }

    // Store tenantId for tenant desk to use in x-tenant-id header
    if (input.desk === "tenant" && data.tenantId) {
      setTenantId(data.tenantId);
    }

    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: { message: errorMessage(error) } };
  }
}

export async function logout(desk: Desk): Promise<void> {
  try {
    const token = getToken(desk);
    if (token) {
      await client.post("/auth/logout", undefined, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
  } catch {}
  clearToken(desk);
  if (desk === "tenant") {
    setTenantId(undefined);
  }
}
