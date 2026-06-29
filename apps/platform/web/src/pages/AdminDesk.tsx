import { AdminLayout, Card, StatusBadge, Button } from "@codexsun/ui";
import { AuthGate } from "../components/AuthGate";
import { useNavigate } from "@tanstack/react-router";
import { logout } from "../api";

export function AdminDesk() {
  const navigate = useNavigate();

  async function handleLogout() {
    await logout("admin");
    await navigate({ to: "/admin/login" });
  }

  return (
    <AuthGate desk="admin">
      <AdminLayout
        actions={
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={handleLogout} variant="secondary">Log out</Button>
          </div>
        }
      >
        <div className="desk-grid">
          <Card title="Support Queue" description="Prepared for tenant operations">
            <StatusBadge tone="amber">Scaffold</StatusBadge>
            <p>Support tickets, failed jobs, and tenant health views will build from this desk.</p>
          </Card>
          <Card title="Activation Review" description="Future subscription and feature control">
            <p>High-risk activation changes belong here with approval and audit history.</p>
          </Card>
        </div>
      </AdminLayout>
    </AuthGate>
  );
}
