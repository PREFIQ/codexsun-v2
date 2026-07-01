import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button, Card, StatusBadge, Label } from "@codexsun/ui"
import { apiGet, apiPost } from "../../api"

type CatalogModule = { moduleKey: string; displayName: string; scope: string; version: string }
type Tenant = { id: string; tenantCode: string; tenantName: string; status: string }

export function ModuleActivation({ onBack }: { onBack: () => void }) {
  const qc = useQueryClient()
  const [tenantId, setTenantId] = useState("")
  const [moduleKey, setModuleKey] = useState("")

  const { data: catalog } = useQuery<CatalogModule[]>({
    queryKey: ["admin", "modules", "catalog"],
    queryFn: () => apiGet<CatalogModule[]>("/admin/modules/catalog", "sa")
  })

  const { data: tenants } = useQuery<Tenant[]>({
    queryKey: ["admin", "tenants"],
    queryFn: () => apiGet<Tenant[]>("/admin/tenants", "sa")
  })

  const { data: enabledModules } = useQuery<CatalogModule[]>({
    queryKey: ["admin", "modules", "tenant", tenantId],
    queryFn: () => apiGet<CatalogModule[]>(`/admin/modules/tenant/${tenantId}`, "sa"),
    enabled: !!tenantId
  })

  const enableMut = useMutation({
    mutationFn: () => apiPost(`/admin/modules/tenant/${tenantId}/enable`, { moduleKey }, "sa"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "modules", "tenant", tenantId] }) }
  })

  const disableMut = useMutation({
    mutationFn: () => apiPost(`/admin/modules/tenant/${tenantId}/disable`, { moduleKey }, "sa"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "modules", "tenant", tenantId] }) }
  })

  const enabledKeys = new Set(enabledModules?.map((m) => m.moduleKey) ?? [])

  return (
    <div className="desk-grid" style={{ maxWidth: "92rem", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <Button variant="secondary" onClick={onBack}>Back</Button>
        <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Module Activation</h2>
      </div>

      <Card title="Select Tenant">
        <div style={{ display: "flex", gap: "1rem", alignItems: "end", padding: "0.5rem 0" }}>
          <div style={{ flex: 1 }}>
            <Label>Tenant</Label>
            <select value={tenantId} onChange={(e) => { setTenantId(e.target.value); setModuleKey("") }} style={{ display: "flex", height: "2.25rem", width: "100%", borderRadius: "0.375rem", border: "1px solid var(--cx-border)", background: "transparent", padding: "0 0.75rem" }}>
              <option value="">Select tenant...</option>
              {tenants?.map((t) => <option key={t.id} value={t.id}>{t.tenantCode} - {t.tenantName}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {tenantId && (
        <>
          <Card title="Module Catalog" description="Platform and tenant modules">
            {catalog ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                {catalog.map((m) => {
                  const isEnabled = enabledKeys.has(m.moduleKey)
                  return (
                    <div key={m.moduleKey} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--cx-border)", paddingBottom: "0.5rem" }}>
                      <div>
                        <strong style={{ display: "block", fontSize: "0.9rem" }}>{m.displayName}</strong>
                        <span style={{ fontSize: "0.75rem", color: "var(--cx-muted)" }}>{m.moduleKey} &middot; {m.scope}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <StatusBadge tone={isEnabled ? "green" : "amber"}>{isEnabled ? "Enabled" : "Disabled"}</StatusBadge>
                        {isEnabled ? (
                          <Button variant="ghost" size="sm" onClick={() => { setModuleKey(m.moduleKey); disableMut.mutate() }}>Disable</Button>
                        ) : (
                          <Button variant="ghost" size="sm" onClick={() => { setModuleKey(m.moduleKey); enableMut.mutate() }}>Enable</Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : <p>Loading catalog...</p>}
          </Card>

          <Card title="Enabled Modules" description="Currently active for this tenant">
            {enabledModules && enabledModules.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
                {enabledModules.map((m) => (
                  <span key={m.moduleKey} style={{ padding: "0.25rem 0.75rem", borderRadius: "999px", border: "1px solid var(--cx-border)", fontSize: "0.8rem" }}>{m.displayName}</span>
                ))}
              </div>
            ) : <p>No modules enabled for this tenant.</p>}
          </Card>
        </>
      )}
    </div>
  )
}
