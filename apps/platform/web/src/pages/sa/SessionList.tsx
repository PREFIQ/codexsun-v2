import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button, Card, StatusBadge } from "@codexsun/ui"
import { apiGet, apiDelete } from "../../api"

type SessionRecord = { token: string; email: string; userType: string; tenantId?: string; tenantCode?: string; createdAt: string }

export function SessionList({ onBack }: { onBack: () => void }) {
  const qc = useQueryClient()

  const { data: sessions } = useQuery<SessionRecord[]>({
    queryKey: ["admin", "sessions"],
    queryFn: () => apiGet<SessionRecord[]>("/admin/sessions", "sa")
  })

  const revokeMut = useMutation({
    mutationFn: (token: string) => apiDelete(`/admin/sessions/${token}`, "sa"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "sessions"] }) }
  })

  return (
    <div className="desk-grid" style={{ maxWidth: "92rem", margin: "0 auto" }}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1rem" }}>
        <Button variant="secondary" onClick={onBack}>Back</Button>
        <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Active Sessions</h2>
      </div>
      <Card title="Sessions" description="Currently active server-side sessions (cookie/hybrid mode)">
        {sessions && sessions.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
            {sessions.map((s) => (
              <div key={s.token} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--cx-border)", paddingBottom: "0.5rem" }}>
                <div>
                  <strong style={{ display: "block", fontSize: "0.9rem" }}>{s.email}</strong>
                  <span style={{ fontSize: "0.75rem", color: "var(--cx-muted)" }}>
                    {s.userType}{s.tenantCode ? ` | ${s.tenantCode}` : ""} | {new Date(s.createdAt).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <StatusBadge tone="green">Active</StatusBadge>
                  <Button variant="ghost" size="sm" onClick={() => revokeMut.mutate(s.token)}>Revoke</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "1rem 0" }}>
            <p>No active server-side sessions found.</p>
            <p style={{ fontSize: "0.8rem", color: "var(--cx-muted)" }}>Note: JWT sessions are stateless and not stored server-side.</p>
          </div>
        )}
      </Card>
    </div>
  )
}
