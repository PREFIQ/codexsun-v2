import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button, Card, StatusBadge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Input, Label } from "@codexsun/ui"
import { apiGet, apiPost } from "../../api"

type PlatformUser = { id: string; displayName: string; email: string; status: string; userType: string }
type UserType = "super_admin" | "staff"

export function UserList({ onBack }: { onBack: () => void }) {
  const qc = useQueryClient()
  const [userType, setUserType] = useState<UserType>("super_admin")
  const [showCreate, setShowCreate] = useState(false)

  const { data: users } = useQuery<PlatformUser[]>({
    queryKey: ["admin", "users", userType],
    queryFn: () => apiGet<PlatformUser[]>(`/admin/users/${userType}`, "sa")
  })

  const createMut = useMutation({
    mutationFn: (d: { displayName: string; email: string; password: string; userType: string }) => apiPost("/admin/users", d, "sa"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "users", userType] }); setShowCreate(false) }
  })

  const suspendMut = useMutation({
    mutationFn: (id: string) => apiPost(`/admin/users/${userType}/${id}/suspend`, {}, "sa"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "users", userType] }) }
  })

  const activateMut = useMutation({
    mutationFn: (id: string) => apiPost(`/admin/users/${userType}/${id}/activate`, {}, "sa"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "users", userType] }) }
  })

  return (
    <div className="desk-grid" style={{ maxWidth: "92rem", margin: "0 auto" }}>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1rem" }}>
        <Button variant="secondary" onClick={onBack}>Back</Button>
        <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Platform Users</h2>
      </div>
      <Card
        title="User Accounts"
        description="Manage super admin and staff accounts"
        action={
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <select value={userType} onChange={(e) => setUserType(e.target.value as UserType)} style={{ display: "flex", height: "2.25rem", borderRadius: "0.375rem", border: "1px solid var(--cx-border)", background: "transparent", padding: "0 0.75rem" }}>
              <option value="super_admin">Super Admins</option>
              <option value="staff">Staff</option>
            </select>
            <Button onClick={() => setShowCreate(true)}>New User</Button>
          </div>
        }
      >
        {users && users.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
            {users.map((u) => (
              <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--cx-border)", paddingBottom: "0.5rem" }}>
                <div>
                  <strong style={{ display: "block" }}>{u.displayName}</strong>
                  <span style={{ fontSize: "0.8125rem", color: "var(--cx-muted)" }}>{u.email}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <StatusBadge tone={u.status === "active" ? "green" : "amber"}>{u.status}</StatusBadge>
                  {u.status === "active" ? (
                    <Button variant="ghost" size="sm" onClick={() => suspendMut.mutate(u.id)}>Suspend</Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => activateMut.mutate(u.id)}>Activate</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : <p>No users found.</p>}
      </Card>

      <CreateUserDialog open={showCreate} onClose={() => setShowCreate(false)} onSubmit={(d) => createMut.mutate({ ...d, userType })} loading={createMut.isPending} />
    </div>
  )
}

function CreateUserDialog({ open, onClose, onSubmit, loading }: { open: boolean; onClose: () => void; onSubmit: (d: { displayName: string; email: string; password: string }) => void; loading: boolean }) {
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("")
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create User</DialogTitle><DialogDescription>Add a new platform user account.</DialogDescription></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); if (name.trim() && email.trim() && password.trim()) onSubmit({ displayName: name.trim(), email: email.trim(), password }); setName(""); setEmail(""); setPassword("") }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1rem 0" }}>
            <div><Label htmlFor="un">Display Name</Label><Input id="un" value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div><Label htmlFor="ue">Email</Label><Input id="ue" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div><Label htmlFor="up">Password</Label><Input id="up" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          </div>
          <DialogFooter><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
