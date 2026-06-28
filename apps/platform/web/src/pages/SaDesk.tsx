import { AppShell, Card, StatusBadge } from "@codexsun/ui";
import { AuthGate } from "../components/AuthGate";

export function SaDesk() {
  return (
    <AuthGate desk="sa">
      <AppShell
        navItems={[
          { href: "/sa", label: "Overview" },
          { href: "/status", label: "Status" },
          { href: "/admin/login", label: "Staff Login" }
        ]}
        subtitle="Founder and platform control surface."
        title="Super Admin Desk"
      >
        <div className="desk-grid">
          <Card title="Foundation" description="Fresh scaffold status">
            <StatusBadge tone="green">Ready</StatusBadge>
            <p>Master database boot, platform migrations, and initial Super Admin seed are wired.</p>
          </Card>
          <Card title="Tenant Registry" description="First test tenant">
            <strong>test</strong>
            <p>Connected to the seeded tenant database for early local testing.</p>
          </Card>
        </div>
      </AppShell>
    </AuthGate>
  );
}
