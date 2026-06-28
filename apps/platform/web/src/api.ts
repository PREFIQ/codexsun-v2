const apiBaseUrl = import.meta.env.VITE_PLATFORM_API_URL ?? "http://127.0.0.1:4100";

export type Desk = "sa" | "admin" | "tenant";

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: "include"
  });

  return response.json() as Promise<T>;
}

export async function login(input: { desk: Desk; email: string; password: string; tenantCode?: string }) {
  const response = await fetch(`${apiBaseUrl}/auth/login`, {
    body: JSON.stringify(input),
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  return response.json() as Promise<{
    success: boolean;
    data?: {
      email: string;
      tenantCode?: string;
      userType: string;
    };
    error?: {
      message: string;
    };
  }>;
}
