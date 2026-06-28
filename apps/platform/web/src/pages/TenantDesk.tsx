import { AppShell, Card, StatusBadge } from "@codexsun/ui";
import { AuthGate } from "../components/AuthGate";

export function TenantDesk() {
  return (
    <AuthGate desk="tenant">
      <AppShell
        navItems={[
          { href: "/tenant", label: "Dashboard" },
          { href: "/status", label: "Status" },
          { href: "/", label: "Public" }
        ]}
        subtitle="Customer-facing workspace for the test tenant."
        title="Tenant Desk"
      >
        <div className="desk-grid">
          <Card title="Tenant" description="Seeded local tenant">
            <StatusBadge tone="green">test</StatusBadge>
            <p>The first tenant user is seeded inside the tenant test database.</p>
          </Card>
          <Card title="Next Modules" description="Core app shell before business modules">
            <p>Customers, items, billing, accounting, and sync will attach here after foundation checks pass.</p>
          </Card>
        </div>
      </AppShell>
    </AuthGate>
  );
}
