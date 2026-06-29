import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Button,
  Card,
  StatusBadge,
  SuperLayout,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  Input,
  Label
} from "@codexsun/ui";
import { AuthGate } from "../components/AuthGate";
import { logout, apiGet, apiPost, apiPut, apiDelete } from "../api";

type Tenant = {
  id: string;
  tenantCode: string;
  tenantName: string;
  status: string;
};

const STATUS_OPTIONS = ["active", "inactive", "suspended"];

export function SaDesk() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);

  const { data: tenants, isLoading } = useQuery<Tenant[]>({
    queryKey: ["tenants"],
    queryFn: () => apiGet<Tenant[]>("/tenants", "sa")
  });

  const createMutation = useMutation({
    mutationFn: (data: { tenantCode: string; tenantName: string; status: string }) =>
      apiPost<Tenant>("/tenants", data, "sa"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      setShowCreate(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; tenantName?: string; status?: string }) =>
      apiPut<Tenant>(`/tenants/${data.id}`, data, "sa"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      setEditingTenant(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/tenants/${id}`, "sa"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      setDeletingTenant(null);
    }
  });

  async function handleLogout() {
    await logout("sa");
    await navigate({ to: "/sa/login" });
  }

  return (
    <>
      <AuthGate desk="sa">
        <SuperLayout
          actions={
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={handleLogout} variant="secondary">Log out</Button>
            </div>
          }
        >
          <div className="desk-grid" style={{ maxWidth: "960px", margin: "0 auto" }}>
            <Card
              title="Tenant Registry"
              description="Manage all registered tenants"
              action={
                <Button onClick={() => setShowCreate(true)}>New Tenant</Button>
              }
            >
              {isLoading ? (
                <p>Loading tenants...</p>
              ) : tenants && tenants.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
                  {tenants.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: "1px solid var(--cx-border)",
                        paddingBottom: "0.5rem"
                      }}
                    >
                      <div>
                        <strong style={{ display: "block" }}>{t.tenantCode}</strong>
                        <span style={{ fontSize: "0.8125rem", color: "var(--cx-muted)" }}>
                          {t.tenantName}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <StatusBadge tone={t.status === "active" ? "green" : t.status === "inactive" ? "amber" : "red"}>
                          {t.status}
                        </StatusBadge>
                        <Button variant="ghost" size="sm" onClick={() => setEditingTenant(t)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeletingTenant(t)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No tenants registered.</p>
              )}
            </Card>
          </div>
        </SuperLayout>
      </AuthGate>

      <CreateTenantDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSubmit={(data) => createMutation.mutate(data)}
        loading={createMutation.isPending}
      />

      <EditTenantDialog
        tenant={editingTenant}
        onOpenChange={() => setEditingTenant(null)}
        onSubmit={(data) => updateMutation.mutate(data)}
        loading={updateMutation.isPending}
      />

      <DeleteTenantDialog
        tenant={deletingTenant}
        onOpenChange={() => setDeletingTenant(null)}
        onConfirm={(id) => deleteMutation.mutate(id)}
        loading={deleteMutation.isPending}
      />
    </>
  );
}

function CreateTenantDialog({
  open,
  onOpenChange,
  onSubmit,
  loading
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: { tenantCode: string; tenantName: string; status: string }) => void;
  loading: boolean;
}) {
  const [tenantCode, setTenantCode] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [status, setStatus] = useState("active");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenantCode.trim() || !tenantName.trim()) return;
    onSubmit({ tenantCode: tenantCode.trim(), tenantName: tenantName.trim(), status });
    setTenantCode("");
    setTenantName("");
    setStatus("active");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Tenant</DialogTitle>
          <DialogDescription>Register a new tenant in the platform.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1rem 0" }}>
            <div>
              <Label htmlFor="tc">Tenant Code</Label>
              <Input
                id="tc"
                value={tenantCode}
                onChange={(e) => setTenantCode(e.target.value)}
                placeholder="e.g. acme"
                required
              />
            </div>
            <div>
              <Label htmlFor="tn">Tenant Name</Label>
              <Input
                id="tn"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="e.g. Acme Corp"
                required
              />
            </div>
            <div>
              <Label htmlFor="ts">Status</Label>
              <select
                id="ts"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  display: "flex",
                  height: "2.25rem",
                  width: "100%",
                  borderRadius: "0.375rem",
                  border: "1px solid var(--cx-border)",
                  background: "transparent",
                  padding: "0 0.75rem"
                }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditTenantDialog({
  tenant,
  onOpenChange,
  onSubmit,
  loading
}: {
  tenant: Tenant | null;
  onOpenChange: () => void;
  onSubmit: (data: { id: string; tenantName?: string; status?: string }) => void;
  loading: boolean;
}) {
  const [tenantName, setTenantName] = useState("");
  const [status, setStatus] = useState("active");

  useEffect(() => {
    if (tenant) {
      setTenantName(tenant.tenantName);
      setStatus(tenant.status);
    }
  }, [tenant]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenant || !tenantName.trim()) return;
    onSubmit({ id: tenant.id, tenantName: tenantName.trim(), status });
  }

  if (!tenant) return null;

  return (
    <Dialog open={!!tenant} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Tenant</DialogTitle>
          <DialogDescription>Update {tenant.tenantCode}.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1rem 0" }}>
            <div>
              <Label htmlFor="etc">Tenant Code</Label>
              <Input id="etc" value={tenant.tenantCode} disabled />
            </div>
            <div>
              <Label htmlFor="etn">Tenant Name</Label>
              <Input
                id="etn"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="ets">Status</Label>
              <select
                id="ets"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  display: "flex",
                  height: "2.25rem",
                  width: "100%",
                  borderRadius: "0.375rem",
                  border: "1px solid var(--cx-border)",
                  background: "transparent",
                  padding: "0 0.75rem"
                }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onOpenChange}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteTenantDialog({
  tenant,
  onOpenChange,
  onConfirm,
  loading
}: {
  tenant: Tenant | null;
  onOpenChange: () => void;
  onConfirm: (id: string) => void;
  loading: boolean;
}) {
  if (!tenant) return null;

  return (
    <AlertDialog open={!!tenant} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Tenant</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{tenant.tenantCode}</strong> ({tenant.tenantName})?
            This action cannot be undone and will remove all tenant-related data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="secondary" onClick={onOpenChange}>Cancel</Button>
          <Button variant="danger" onClick={() => onConfirm(tenant.id)} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
