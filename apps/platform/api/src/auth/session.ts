import { randomUUID } from "node:crypto";

export type SessionUserType = "super_admin" | "staff" | "tenant";

export type SessionRecord = {
  createdAt: string;
  email: string;
  tenantCode?: string;
  token: string;
  userType: SessionUserType;
};

const sessions = new Map<string, SessionRecord>();

export function createSession(input: Omit<SessionRecord, "createdAt" | "token">) {
  const token = randomUUID();
  const session = {
    ...input,
    createdAt: new Date().toISOString(),
    token
  };

  sessions.set(token, session);
  return session;
}

export function getSession(token?: string) {
  if (!token) {
    return undefined;
  }

  return sessions.get(token);
}

export function destroySession(token?: string) {
  if (token) {
    sessions.delete(token);
  }
}
