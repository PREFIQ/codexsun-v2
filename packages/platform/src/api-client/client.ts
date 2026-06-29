import type { SuccessEnvelope, ErrorEnvelope } from "@codexsun/framework/http";

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ApiClient {
  private _tenantId: string | undefined;

  constructor(private readonly baseUrl: string) {}

  set tenantId(value: string | undefined) {
    this._tenantId = value;
  }

  get tenantId(): string | undefined {
    return this._tenantId;
  }

  private buildHeaders(options?: RequestInit): Record<string, string> {
    const headers: Record<string, string> = {
      ...(options?.headers as Record<string, string> | undefined)
    };

    // Only add x-tenant-id if not already set in options
    if (this._tenantId && !headers["x-tenant-id"]) {
      headers["x-tenant-id"] = this._tenantId;
    }

    return headers;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      credentials: "include",
      headers: this.buildHeaders(options)
    });

    const body = await res.json().catch(() => ({
      success: false,
      error: { code: "JSON_ERROR", message: "Failed to parse JSON response" }
    }));

    if (body.success) {
      return (body as SuccessEnvelope<T>).data;
    } else {
      const err = (body as ErrorEnvelope).error;
      throw new ApiError(err.code, err.message, err.details);
    }
  }

  async get<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  async post<T>(path: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.#jsonRequest<T>("POST", path, data, options);
  }

  async put<T>(path: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.#jsonRequest<T>("PUT", path, data, options);
  }

  async delete<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }

  async #jsonRequest<T>(method: string, path: string, data?: unknown, options?: RequestInit): Promise<T> {
    const requestOptions: RequestInit = {
      ...options,
      method,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers as Record<string, string> | undefined)
      }
    };

    if (data !== undefined) {
      requestOptions.body = JSON.stringify(data);
    }

    return this.request<T>(path, requestOptions);
  }
}
