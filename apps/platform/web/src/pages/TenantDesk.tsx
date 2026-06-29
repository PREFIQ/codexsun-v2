import { Card, StatusBadge, Button, TenantLayout } from "@codexsun/ui";
import { AuthGate } from "../components/AuthGate";
import { useNavigate } from "@tanstack/react-router";
import { logout } from "../api";

export function TenantDesk() {
  const navigate = useNavigate();

  async function handleLogout() {
    await logout("tenant");
    await navigate({ to: "/login" });
  }

  return (
    <AuthGate desk="tenant">
      <TenantLayout
        actions={
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={handleLogout} variant="secondary">Log out</Button>
          </div>
        }
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
      </TenantLayout>
    </AuthGate>
  );
}
