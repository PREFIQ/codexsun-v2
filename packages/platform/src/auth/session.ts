import { randomUUID } from "node:crypto";

export type PlatformSessionUserType = "super_admin" | "staff" | "tenant";

export type PlatformSessionRecord = {
  createdAt: string;
  email: string;
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
