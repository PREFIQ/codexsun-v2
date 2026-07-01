import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button, Card, StatusBadge, Input, Label } from "@codexsun/ui"
import { apiGet, apiPut } from "../../api"

type FeatureFlag = {
  featureKey: string
  label: string
  description: string
  enabled: boolean
  tenantId?: string
  reason?: string
  updatedBy: string
  updatedAt: string
}

export function FeatureFlags({ onBack }: { onBack: () => void }) {
  const qc = useQueryClient()
  const [tenantFilter, setTenantFilter] = useState("")

  const { data: flags } = useQuery<FeatureFlag[]>({
    queryKey: ["settings", "feature-flags", tenantFilter],
    queryFn: () => {
      const params = tenantFilter ? `?tenantId=${encodeURIComponent(tenantFilter)}` : ""
      return apiGet<FeatureFlag[]>(`/settings/feature-flags${params}`, "sa")
    }
  })

  const toggleMut = useMutation({
    mutationFn: (d: { featureKey: string; enabled: boolean; reason?: string }) =>
      apiPut(`/settings/feature-flags/${d.featureKey}`, d, "sa"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings", "feature-flags"] })
  })

  return (
    <div className="desk-grid" style={{ maxWidth: "92rem", margin: "0 auto" }}>
      <Card title="Feature Flags" description="Manage platform and tenant feature flags"
        action={<Button variant="secondary" onClick={onBack}>Back</Button>}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", alignItems: "end" }}>
          <div><Label>Tenant ID (optional)</Label><Input value={tenantFilter} onChange={(e) => setTenantFilter(e.target.value)} placeholder="Filter by tenant" /></div>
        </div>
        {flags && flags.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {flags.map((f) => (
              <div key={f.featureKey} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem", border: "1px solid var(--cx-border)", borderRadius: "0.375rem" }}>
                <div>
                  <strong>{f.featureKey}</strong>
                  {f.description && <p style={{ fontSize: "0.8125rem", color: "var(--cx-muted)", margin: 0 }}>{f.description}</p>}
                  {f.tenantId && <p style={{ fontSize: "0.75rem", color: "var(--cx-muted)" }}>Tenant: {f.tenantId}</p>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <StatusBadge tone={f.enabled ? "green" : "neutral"}>{f.enabled ? "Enabled" : "Disabled"}</StatusBadge>
                  <Button size="sm" variant={f.enabled ? "secondary" : "default"}
                    onClick={() => toggleMut.mutate({ featureKey: f.featureKey, enabled: !f.enabled, reason: "manual toggle" })}>
                    {f.enabled ? "Disable" : "Enable"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : <p>No feature flags found.</p>}
      </Card>
    </div>
  )
}
