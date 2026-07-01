import { Button, Card } from "@codexsun/ui"
import { apiGet } from "../../api"
import { useQuery } from "@tanstack/react-query"

type AuditEvent = { id: string; event_name: string; actor_email: string; tenant_id: string; created_at: string }

export function Support({ onBack }: { onBack: () => void }) {
  const { data: events } = useQuery<AuditEvent[]>({
    queryKey: ["admin", "audit", "support"],
    queryFn: () => apiGet<AuditEvent[]>("/admin/audit?limit=50", "sa")
  })

  return (
    <div className="desk-grid" style={{ maxWidth: "92rem", margin: "0 auto" }}>
      <Card title="Support & Helpdesk" description="Tenant support operations, issue tracking, and escalation"
        action={<Button variant="secondary" size="sm" onClick={onBack}>Back</Button>}>
        <p style={{ color: "var(--cx-muted)", margin: "1rem 0" }}>
          The support desk will provide tenant issue management, escalation workflows, and operational alerts. Integration with the activity timeline, notifications, and agent system is planned.
        </p>
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <div style={{ flex: 1, padding: "1rem", border: "1px solid var(--cx-border)", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{events?.length ?? 0}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--cx-muted)" }}>Recent Events</div>
          </div>
          <div style={{ flex: 1, padding: "1rem", border: "1px solid var(--cx-border)", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>0</div>
            <div style={{ fontSize: "0.8rem", color: "var(--cx-muted)" }}>Open Tickets</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
