import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button, Card, Input, Label } from "@codexsun/ui"
import { apiGet } from "../../api"

type AuditRow = { id: number; actor_type: string; actor_email: string | null; correlation_id: string | null; event_name: string; event_payload: string | null; tenant_id: string | null; created_at: string }
type AuditActors = string[]

const SAFE_FIELDS = ["email", "tenantCode", "moduleKey", "changes", "userId", "userType", "revokedToken", "tenantId"]

function isSafePayload(payload: Record<string, unknown>): boolean {
  return Object.keys(payload).every((k) => SAFE_FIELDS.includes(k))
}

function formatDate(d: string) {
  try { return new Date(d).toLocaleString() } catch { return d }
}

export function AuditViewer({ onBack }: { onBack: () => void }) {
  const [actorEmail, setActorEmail] = useState("")
  const [eventName, setEventName] = useState("")
  const [tenantId, setTenantId] = useState("")

  const queryParams = new URLSearchParams()
  if (actorEmail) queryParams.set("actorEmail", actorEmail)
  if (eventName) queryParams.set("eventName", eventName)
  if (tenantId) queryParams.set("tenantId", tenantId)
  queryParams.set("limit", "100")

  const { data: events } = useQuery<AuditRow[]>({
    queryKey: ["admin", "audit", actorEmail, eventName, tenantId],
    queryFn: () => apiGet<AuditRow[]>(`/admin/audit?${queryParams.toString()}`, "sa")
  })

  const { data: actors } = useQuery<AuditActors>({
    queryKey: ["admin", "audit", "actors"],
    queryFn: () => apiGet<AuditActors>("/admin/audit/actors", "sa")
  })

  return (
    <div className="desk-grid" style={{ maxWidth: "92rem", margin: "0 auto" }}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1rem" }}>
        <Button variant="secondary" onClick={onBack}>Back</Button>
        <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Audit Viewer</h2>
      </div>

      <Card title="Filters">
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", padding: "0.5rem 0" }}>
          <div style={{ flex: 1, minWidth: "150px" }}>
            <Label>Actor</Label>
            <select value={actorEmail} onChange={(e) => setActorEmail(e.target.value)} style={{ display: "flex", height: "2.25rem", width: "100%", borderRadius: "0.375rem", border: "1px solid var(--cx-border)", background: "transparent", padding: "0 0.75rem" }}>
              <option value="">All actors</option>
              {actors?.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: "150px" }}>
            <Label>Event Name</Label>
            <Input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="e.g. tenant.created" />
          </div>
          <div style={{ flex: 1, minWidth: "150px" }}>
            <Label>Tenant ID</Label>
            <Input value={tenantId} onChange={(e) => setTenantId(e.target.value)} placeholder="Tenant ID" />
          </div>
        </div>
      </Card>

      <Card title="Events" description="Last 100 matching events">
        {events && events.length > 0 ? (
          <div style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
            {events.map((e) => {
              let payload: Record<string, unknown> | null = null
              try { if (e.event_payload) payload = JSON.parse(e.event_payload) as Record<string, unknown> } catch {}
              const showPayload = payload && isSafePayload(payload)
              return (
                <div key={e.id} style={{ borderBottom: "1px solid var(--cx-border)", padding: "0.5rem 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong>{e.event_name}</strong>
                    <span style={{ color: "var(--cx-muted)", fontSize: "0.75rem" }}>{formatDate(e.created_at)}</span>
                  </div>
                  <div style={{ color: "var(--cx-muted)", fontSize: "0.8rem", marginTop: "0.125rem" }}>
                    {e.actor_email ?? "system"} {e.correlation_id ? ` | ID: ${e.correlation_id}` : ""} {e.tenant_id ? ` | Tenant: ${e.tenant_id}` : ""}
                    {showPayload ? ` | ${JSON.stringify(payload)}` : ""}
                    {payload && !showPayload ? " | payload hidden" : ""}
                  </div>
                </div>
              )
            })}
          </div>
        ) : <p>No audit events found.</p>}
      </Card>
    </div>
  )
}
