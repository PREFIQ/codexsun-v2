import { randomUUID } from "node:crypto";

export type PlatformSessionUserType = "super_admin" | "staff" | "tenant";

export type PlatformSessionRecord = {
  createdAt: string;
  email: string;
  tenantId?: string;
  tenantCode?: string;
  token: string;
  userType: PlatformSessionUserType;
};

export class InMemorySessionStore {
  private readonly sessions = new Map<string, PlatformSessionRecord>();

  create(input: Omit<PlatformSessionRecord, "createdAt" | "token">) {
    const token = randomUUID();
    const session: PlatformSessionRecord = {
      ...input,
      createdAt: new Date().toISOString(),
      token
    };

    this.sessions.set(token, session);
    return session;
  }

  async createAsync(input: Omit<PlatformSessionRecord, "createdAt" | "token">): Promise<PlatformSessionRecord> {
    return this.create(input);
  }

  async getAsync(token?: string): Promise<PlatformSessionRecord | undefined> {
    return this.get(token);
  }

  async destroyAsync(token?: string): Promise<void> {
    this.destroy(token);
  }

  destroy(token?: string) {
    if (token) {
      this.sessions.delete(token);
    }
  }

  get(token?: string) {
    if (!token) {
      return undefined;
    }

    return this.sessions.get(token);
  }
}

export interface SessionStore {
  createAsync(input: Omit<PlatformSessionRecord, "createdAt" | "token">): Promise<PlatformSessionRecord>;
  getAsync(token?: string): Promise<PlatformSessionRecord | undefined>;
  destroyAsync(token?: string): Promise<void>;
}

export class DatabaseSessionStore implements SessionStore {
  constructor(
    private readonly pool: {
      execute<TResult = unknown>(sql: string, values?: unknown[]): Promise<[TResult, unknown]>;
    },
    private readonly maxAgeSeconds: number = 60 * 60 * 24 * 7 // 7 days default
  ) {}

  async createAsync(input: Omit<PlatformSessionRecord, "createdAt" | "token">): Promise<PlatformSessionRecord> {
    const token = randomUUID();
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + this.maxAgeSeconds * 1000);

    await this.pool.execute(
      `INSERT INTO sessions (token, email, user_type, tenant_id, tenant_code, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        token,
        input.email,
        input.userType,
        input.tenantId ?? null,
        input.tenantCode ?? null,
        createdAt,
        expiresAt
      ]
    );

    return {
      ...input,
      createdAt: createdAt.toISOString(),
      token
    };
  }

  async getAsync(token?: string): Promise<PlatformSessionRecord | undefined> {
    if (!token) return undefined;

    const [rows] = await this.pool.execute<Array<{
      createdAt: Date | string;
      email: string;
      tenantId: null | string;
      tenantCode: null | string;
      token: string;
      userType: PlatformSessionUserType;
    }>>(
      `SELECT token, email, user_type as userType, tenant_id as tenantId, tenant_code as tenantCode, created_at as createdAt, expires_at
       FROM sessions WHERE token = ? AND expires_at > ? LIMIT 1`,
      [token, new Date()]
    );

    const row = rows[0];
    if (!row) return undefined;

    return {
      token: row.token,
      email: row.email,
      userType: row.userType as PlatformSessionUserType,
      createdAt: new Date(row.createdAt).toISOString(),
      ...(row.tenantId ? { tenantId: row.tenantId } : {}),
      ...(row.tenantCode ? { tenantCode: row.tenantCode } : {})
    };
  }

  async destroyAsync(token?: string): Promise<void> {
    if (!token) return;
    await this.pool.execute("DELETE FROM sessions WHERE token = ?", [token]);
  }
}
