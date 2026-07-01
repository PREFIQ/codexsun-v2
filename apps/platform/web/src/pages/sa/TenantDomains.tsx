import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button, Card, StatusBadge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Label } from "@codexsun/ui"
import { apiGet, apiPost, apiDelete } from "../../api"

type DomainMapping = { id: string; tenant_id: string; domain_name: string; status: string; created_at: string }
type Tenant = { id: string; tenantCode: string; tenantName: string }

export function TenantDomains({ onBack }: { onBack: () => void }) {
  const qc = useQueryClient()
  const [selectedTenantId, setSelectedTenantId] = useState("")
  const [newDomain, setNewDomain] = useState("")
  const [showAdd, setShowAdd] = useState(false)

  const { data: tenants } = useQuery<Tenant[]>({
    queryKey: ["admin", "tenants"],
    queryFn: () => apiGet<Tenant[]>("/admin/tenants", "sa")
  })

  const { data: domains } = useQuery<DomainMapping[]>({
    queryKey: ["admin", "tenants", selectedTenantId, "domains"],
    queryFn: () => apiGet<DomainMapping[]>(`/admin/tenants/${selectedTenantId}/domains`, "sa"),
    enabled: !!selectedTenantId
  })

  const addMut = useMutation({
    mutationFn: () => apiPost(`/admin/tenants/${selectedTenantId}/domains`, { domainName: newDomain }, "sa"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "tenants", selectedTenantId, "domains"] }); setShowAdd(false); setNewDomain("") }
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/tenants/${selectedTenantId}/domains/${id}`, "sa"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "tenants", selectedTenantId, "domains"] })
  })

  return (
    <div className="desk-grid" style={{ maxWidth: "92rem", margin: "0 auto" }}>
      <Card title="Tenant Domain Mappings" description="Manage custom domains per tenant"
        action={<Button variant="secondary" size="sm" onClick={onBack}>Back</Button>}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", margin: "1rem 0" }}>
          <Label htmlFor="tenant-select">Tenant</Label>
          <select id="tenant-select" value={selectedTenantId} onChange={(e) => setSelectedTenantId(e.target.value)}
            style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--cx-border)" }}>
            <option value="">-- Select --</option>
            {tenants?.map((t) => <option key={t.id} value={t.id}>{t.tenantCode} - {t.tenantName}</option>)}
          </select>
        </div>
        {selectedTenantId && (
          <>
            <Button size="sm" onClick={() => setShowAdd(true)}>Add Domain</Button>
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {domains?.length === 0 && <p style={{ color: "var(--cx-muted)" }}>No domains mapped for this tenant.</p>}
              {domains?.map((d) => (
                <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem", border: "1px solid var(--cx-border)", borderRadius: "6px" }}>
                  <div>
                    <span style={{ fontFamily: "monospace", fontSize: "0.9rem" }}>{d.domain_name}</span>
                    <span style={{ marginLeft: "0.5rem" }}><StatusBadge tone={d.status === "active" ? "green" : "red"}>{d.status}</StatusBadge></span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteMut.mutate(d.id)}>Remove</Button>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Domain</DialogTitle></DialogHeader>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            <Label htmlFor="domain-name">Domain Name</Label>
            <input id="domain-name" value={newDomain} onChange={(e) => setNewDomain(e.target.value)}
              placeholder="example.com" style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--cx-border)" }} />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => addMut.mutate()}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
