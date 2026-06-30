import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import { StatusBadge } from "@codexsun/ui/components/StatusBadge";
import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getToken, apiGet, setTenantId, type Desk } from "../api";

type JWTPayload = {
  email: string;
  exp: number;
  iat: number;
  tenantId?: string;
  tenantCode?: string;
  userType: string;
};

const expectedUserType: Record<Desk, string> = {
  admin: "staff",
  sa: "super_admin",
  tenant: "tenant"
};

const loginPaths: Record<Desk, string> = {
  admin: "/admin/login",
  sa: "/sa/login",
  tenant: "/login"
};

function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const encoded = parts[1];
    if (!encoded) return null;
    const payload = JSON.parse(atob(encoded.replace(/-/g, "+").replace(/_/g, "/")));
    return payload;
  } catch {
    return null;
  }
}

function isLocalTokenValid(token: string | null, desk: Desk): boolean {
  if (!token) return false;
  const payload = decodeJWT(token);
  if (!payload) return false;
  if (payload.exp * 1000 < Date.now()) return false;
  return payload.userType === expectedUserType[desk];
}

export function AuthGate({ children, desk }: { children: ReactElement; desk: Desk }) {
  const navigate = useNavigate();
  const [serverValid, setServerValid] = useState<boolean | null>(null);

  const localValid = useMemo(() => isLocalTokenValid(getToken(desk), desk), [desk]);

  useEffect(() => {
    let cancelled = false;
    async function checkSession() {
      try {
        const data = await apiGet<{
          authenticated: boolean;
          tenantId?: string;
        }>("/auth/session", desk);
        if (!cancelled) {
          setServerValid(data.authenticated);
          if (data.authenticated && data.tenantId) {
            setTenantId(data.tenantId);
          }
        }
      } catch {
        if (!cancelled) setServerValid(false);
      }
    }
    if (localValid) {
      checkSession();
    } else {
      setServerValid(false);
    }
    return () => { cancelled = true; };
  }, [desk, localValid]);

  const valid = serverValid === null ? localValid : serverValid;

  if (valid) {
    return children;
  }

  return (
    <main className="simple-page">
      <Card title="Login required">
        <StatusBadge tone="red">Blocked</StatusBadge>
        <p style={{ marginTop: "1rem", marginBottom: "1.5rem" }}>
          {serverValid === null
            ? "Checking session..."
            : `You need an active ${desk} session to view this page.`}
        </p>
        {serverValid === false ? (
          <Button
            style={{ width: "100%" }}
            onClick={() => navigate({ to: loginPaths[desk] })}
          >
            Go to Login
          </Button>
        ) : null}
      </Card>
    </main>
  );
}
