import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button, Card, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Input, Label, StatusBadge } from "@codexsun/ui"
import { apiGet, apiPost } from "../../api"

type RoleRecord = { id: string; key: string; label: string; description: string; userType: string; isSystem: boolean; permissions: string[] }
type SystemRoleDef = { key: string; label: string; system: boolean; userType: string }

const USER_TYPES = ["super_admin", "staff", "tenant"]

export function RoleList({ onBack }: { onBack: () => void }) {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)

  const { data: roles } = useQuery<RoleRecord[]>({
    queryKey: ["admin", "roles"],
    queryFn: () => apiGet<RoleRecord[]>("/admin/roles", "sa")
  })

  const { data: systemRoles } = useQuery<SystemRoleDef[]>({
    queryKey: ["admin", "roles", "system"],
    queryFn: () => apiGet<SystemRoleDef[]>("/admin/roles/system", "sa")
  })

  const createMut = useMutation({
    mutationFn: (d: { key: string; label: string; description: string; userType: string; permissions: string[] }) => apiPost("/admin/roles", d, "sa"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "roles"] }); setShowCreate(false) }
  })

  const allSystem = systemRoles ?? []
  const customRoles = roles?.filter((r) => !r.isSystem) ?? []
  const allRoles = [...allSystem.map((sr) => ({ id: sr.key, key: sr.key, label: sr.label, userType: sr.userType, isSystem: true, description: "", permissions: [] as string[] })), ...customRoles]

  return (
    <div className="desk-grid" style={{ maxWidth: "92rem", margin: "0 auto" }}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1rem" }}>
        <Button variant="secondary" onClick={onBack}>Back</Button>
        <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Role Management</h2>
      </div>
      <Card
        title="Roles"
        description="Platform and system role definitions"
        action={<Button onClick={() => setShowCreate(true)}>New Role</Button>}
      >
        {allRoles.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
            {allRoles.map((r) => (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--cx-border)", paddingBottom: "0.5rem" }}>
                <div>
                  <strong style={{ display: "block", fontSize: "0.9rem" }}>{r.label}</strong>
                  <span style={{ fontSize: "0.75rem", color: "var(--cx-muted)" }}>{r.key} &middot; {r.userType}{r.isSystem ? " (system)" : ""}</span>
                </div>
                <StatusBadge tone={r.isSystem ? "blue" : "green"}>{r.isSystem ? "System" : "Custom"}</StatusBadge>
              </div>
            ))}
          </div>
        ) : <p>No roles defined.</p>}
      </Card>

      <CreateRoleDialog open={showCreate} onClose={() => setShowCreate(false)} onSubmit={(d) => createMut.mutate({ ...d, permissions: [] })} loading={createMut.isPending} />
    </div>
  )
}

function CreateRoleDialog({ open, onClose, onSubmit, loading }: { open: boolean; onClose: () => void; onSubmit: (d: { key: string; label: string; description: string; userType: string }) => void; loading: boolean }) {
  const [key, setKey] = useState(""); const [label, setLabel] = useState(""); const [desc, setDesc] = useState(""); const [userType, setUserType] = useState("staff")
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Role</DialogTitle><DialogDescription>Define a new platform role.</DialogDescription></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (key.trim() && label.trim()) onSubmit({ key: key.trim(), label: label.trim(), description: desc.trim(), userType }); setKey(""); setLabel(""); setDesc("") }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1rem 0" }}>
            <div><Label htmlFor="rk">Role Key</Label><Input id="rk" value={key} onChange={(e) => setKey(e.target.value)} placeholder="e.g. support_manager" required /></div>
            <div><Label htmlFor="rl">Label</Label><Input id="rl" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Support Manager" required /></div>
            <div><Label htmlFor="rd">Description</Label><Input id="rd" value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
            <div><Label htmlFor="ru">User Type</Label>
              <select id="ru" value={userType} onChange={(e) => setUserType(e.target.value)} style={{ display: "flex", height: "2.25rem", width: "100%", borderRadius: "0.375rem", border: "1px solid var(--cx-border)", background: "transparent", padding: "0 0.75rem" }}>
                {USER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
