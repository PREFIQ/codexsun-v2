import { createHmac, timingSafeEqual } from "node:crypto";

export type JWTPayload = {
  email: string;
  exp: number;
  iat: number;
  tenantId?: string;
  tenantCode?: string;
  userType: "super_admin" | "staff" | "tenant";
};

const JWT_ALGORITHM = "HS256";
const JWT_TYP = "JWT";

function base64url(data: Buffer): string {
  return data
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecode(str: string): Buffer {
  const remainder = str.length % 4;
  const padded = remainder ? str + "=".repeat(4 - remainder) : str;
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function encodeSegment(data: Record<string, unknown>): string {
  return base64url(Buffer.from(JSON.stringify(data), "utf-8"));
}

function decodeSegment<T>(str: string): T {
  return JSON.parse(base64urlDecode(str).toString("utf-8")) as T;
}

function sign(content: string, secret: string): string {
  return base64url(createHmac("sha256", secret).update(content, "utf-8").digest());
}

export function createJWT(payload: Omit<JWTPayload, "iat" | "exp">, secret: string, expiresInSeconds = 604800): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };

  const header = encodeSegment({ alg: JWT_ALGORITHM, typ: JWT_TYP });
  const body = encodeSegment(fullPayload as unknown as Record<string, unknown>);
  const content = `${header}.${body}`;
  const signature = sign(content, secret);

  return `${content}.${signature}`;
}

export function verifyJWT(token: string, secret: string): JWTPayload {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }

  const headerB64: string = parts[0]!;
  const payloadB64: string = parts[1]!;
  const signatureB64: string = parts[2]!;

  const content = `${headerB64}.${payloadB64}`;
  const expectedSignature = sign(content, secret);

  const expectedBuf = Buffer.from(expectedSignature, "utf-8");
  const actualBuf = Buffer.from(signatureB64, "utf-8");

  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
    throw new Error("Invalid JWT signature");
  }

  const payload = decodeSegment<JWTPayload>(payloadB64);

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("JWT has expired");
  }

  return payload;
}

export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = decodeSegment<JWTPayload>(parts[1]!);

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
