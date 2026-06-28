import { Card, StatusBadge } from "@codexsun/ui";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { apiGet, type Desk } from "../api";

type MeResponse = {
  success: boolean;
  data?: {
    email: string;
    tenantCode?: string;
    userType: string;
  };
};

const expectedUserType = {
  admin: "staff",
  sa: "super_admin",
  tenant: "tenant"
} satisfies Record<Desk, string>;

export function AuthGate({ children, desk }: { children: ReactElement; desk: Desk }) {
  const [state, setState] = useState<"checking" | "allowed" | "blocked">("checking");

  useEffect(() => {
    async function checkSession() {
      try {
        const result = await apiGet<MeResponse>("/auth/me");
        setState(result.data?.userType === expectedUserType[desk] ? "allowed" : "blocked");
      } catch {
        setState("blocked");
      }
    }

    void checkSession();
  }, [desk]);

  if (state === "allowed") {
    return children;
  }

  return (
    <main className="simple-page">
      <Card title={state === "checking" ? "Checking session" : "Login required"}>
        <StatusBadge tone={state === "checking" ? "amber" : "red"}>
          {state === "checking" ? "Checking" : "Blocked"}
        </StatusBadge>
        {state === "blocked" ? <p>This desk needs its own active login session.</p> : null}
      </Card>
    </main>
  );
}
