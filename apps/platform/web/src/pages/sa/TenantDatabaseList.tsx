import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Play, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { Button, Card, StatusBadge } from "@codexsun/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@codexsun/ui/components/dialog";
import { apiDelete, apiGet, apiPost } from "../../api";

type TenantDatabase = {
  database_exists?: boolean;
  database_name: string;
  dbInfo?: string;
  dbStatus: string;
  id: string;
  status: string;
  table_count?: number;
  tenant_code?: string;
  tenant_id: string;
  tenant_name?: string;
};

type DatabaseCommand = "drop" | "migrate" | "migrate:fresh" | "migrate:rollback";

type DatabaseCommandInput = {
  allTenants?: boolean;
  command: DatabaseCommand;
  confirm?: boolean;
  scope: "tenant";
  tenantDatabaseIds?: string[];
  tenantId?: string;
};

type PendingConfirmation = {
  actionLabel: string;
  description: string;
  onConfirm: () => void;
  title: string;
  tone?: "danger" | "normal";
};

export function TenantDatabaseList({ onBack }: { onBack: () => void }) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const [showDropped, setShowDropped] = useState(false);
  const databasesQuery = useQuery<TenantDatabase[]>({
    queryKey: ["admin", "databases"],
    queryFn: () => apiGet<TenantDatabase[]>("/admin/databases", "sa")
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "databases"] });
  const runCommand = useMutation({
    mutationFn: (input: DatabaseCommandInput) => apiPost("/admin/database-operations/commands", input, "sa"),
    onSettled: () => setPendingAction(null),
    onSuccess: invalidate
  });
  const verifyDatabase = useMutation({
    mutationFn: (id: string) => apiPost(`/admin/databases/${id}/verify`, {}, "sa"),
    onSettled: () => setPendingAction(null),
    onSuccess: invalidate
  });
  const verifySelected = useMutation({
    mutationFn: (ids: string[]) => apiPost("/admin/databases/verify", { ids }, "sa"),
    onSettled: () => setPendingAction(null),
    onSuccess: invalidate
  });
  const removeMapping = useMutation({
    mutationFn: async (ids: string[]) => Promise.all(ids.map((id) => apiDelete(`/admin/databases/${id}`, "sa"))),
    onSettled: () => setPendingAction(null),
    onSuccess: () => {
      setSelectedIds([]);
      invalidate();
    }
  });

  const allRows = databasesQuery.data ?? [];
  const rows = showDropped ? allRows : allRows.filter((row) => row.status !== "dropped");
  const selected = new Set(selectedIds);
  const allSelected = rows.length > 0 && rows.every((row) => selected.has(String(row.id)));
  const droppedCount = allRows.filter((row) => row.status === "dropped").length;
  const disabled = runCommand.isPending || verifyDatabase.isPending || verifySelected.isPending || removeMapping.isPending;
  const toggleAll = () => setSelectedIds(allSelected ? [] : rows.map((row) => String(row.id)));
  const toggleOne = (id: string) => setSelectedIds(selected.has(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);

  useEffect(() => {
    const visible = new Set(rows.map((row) => String(row.id)));
    setSelectedIds((ids) => ids.filter((id) => visible.has(id)));
  }, [rows]);

  const runTenantCommand = (command: DatabaseCommand, target: "selected" | "all" | TenantDatabase) => {
    const confirm = command !== "migrate";
    const targetLabel = target === "all" ? "all tenant databases" : target === "selected" ? "selected tenant databases" : target.database_name;
    const base = { command, confirm, scope: "tenant" as const };
    const execute = () => {
      setPendingConfirmation(null);
      if (target === "all") {
      setPendingAction(actionKey(command, "all"));
      runCommand.mutate({ ...base, allTenants: true });
      } else if (target === "selected") {
      setPendingAction(actionKey(command, "selected"));
      runCommand.mutate({ ...base, tenantDatabaseIds: selectedIds });
      } else {
      setPendingAction(actionKey(command, String(target.id)));
      runCommand.mutate({ ...base, tenantDatabaseIds: [String(target.id)], tenantId: target.tenant_id });
      }
    };
    if (confirm) {
      setPendingConfirmation({
        actionLabel: actionLabelForCommand(command),
        description: confirmationDescription(command, targetLabel),
        onConfirm: execute,
        title: `${actionLabelForCommand(command)} ${targetLabel}?`,
        tone: command === "drop" ? "danger" : "normal"
      });
      return;
    }
    execute();
  };

  const verifyOne = (id: string) => {
    setPendingAction(actionKey("verify", id));
    verifyDatabase.mutate(id);
  };

  const verifySelectedRows = () => {
    setPendingAction(actionKey("verify", "selected"));
    verifySelected.mutate(selectedIds);
  };

  const removeSelectedRows = () => {
    setPendingConfirmation({
      actionLabel: "Remove",
      description: "This removes the tenant database mapping row from this list. It does not delete the tenant account.",
      onConfirm: () => {
        setPendingConfirmation(null);
        setPendingAction(actionKey("remove", "selected"));
        removeMapping.mutate(selectedIds);
      },
      title: `Force remove ${selectedIds.length} tenant database mapping(s)?`,
      tone: "danger"
    });
  };

  const removeOne = (row: TenantDatabase) => {
    setPendingConfirmation({
      actionLabel: "Remove",
      description: "This removes only the mapping row from the list. Use this after the physical database has already been dropped.",
      onConfirm: () => {
        setPendingConfirmation(null);
        setPendingAction(actionKey("remove", String(row.id)));
        removeMapping.mutate([String(row.id)]);
      },
      title: `Force remove ${row.database_name}?`,
      tone: "danger"
    });
  };

  return (
    <div className="mx-auto grid w-[calc(100%-2rem)] max-w-[92rem] gap-4 py-4 lg:w-[calc(100%-3rem)] lg:py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-normal">Tenant Databases</h1>
          <p className="text-sm text-muted-foreground">Verify, migrate, rebuild, rollback, or drop installed tenant databases from one place.</p>
        </div>
        <Button variant="outline" size="sm" onClick={onBack}>Back</Button>
      </div>

      <Card
        title="Installed Tenant Database List"
        description={showDropped ? "Showing active and dropped mappings. Force remove dropped rows when they are no longer needed." : "Dropped mappings are hidden by default. Use Show dropped to clean old rows."}
        action={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowDropped((value) => !value)}>
              {showDropped ? "Hide Dropped" : `Show Dropped (${droppedCount})`}
            </Button>
            <Button size="sm" variant="outline" disabled={disabled || selectedIds.length === 0} onClick={verifySelectedRows}>
              <ProgressIcon active={pendingAction === actionKey("verify", "selected")} icon={CheckCircle2} /> Verify Selected ({selectedIds.length})
            </Button>
            <Button size="sm" disabled={disabled} onClick={() => runTenantCommand("migrate", "all")}>
              <ProgressIcon active={pendingAction === actionKey("migrate", "all")} icon={Play} /> Migrate All
            </Button>
            <Button size="sm" variant="outline" disabled={disabled || selectedIds.length === 0} onClick={() => runTenantCommand("migrate", "selected")}>
              <ProgressIcon active={pendingAction === actionKey("migrate", "selected")} icon={Play} /> Migrate Selected
            </Button>
            <Button size="sm" variant="outline" disabled={disabled || selectedIds.length === 0} onClick={() => runTenantCommand("migrate:rollback", "selected")}>
              <ProgressIcon active={pendingAction === actionKey("migrate:rollback", "selected")} icon={RotateCcw} /> Rollback Selected
            </Button>
            <Button size="sm" variant="outline" disabled={disabled || selectedIds.length === 0} onClick={() => runTenantCommand("migrate:fresh", "selected")}>
              <ProgressIcon active={pendingAction === actionKey("migrate:fresh", "selected")} icon={Sparkles} /> Fresh Selected
            </Button>
            <Button className="border-red-200 text-red-600 hover:bg-red-50" size="sm" variant="outline" disabled={disabled || selectedIds.length === 0} onClick={() => runTenantCommand("drop", "selected")}>
              <ProgressIcon active={pendingAction === actionKey("drop", "selected")} icon={Trash2} /> Drop Selected
            </Button>
            <Button className="border-red-200 text-red-700 hover:bg-red-50" size="sm" variant="outline" disabled={disabled || selectedIds.length === 0} onClick={removeSelectedRows}>
              <ProgressIcon active={pendingAction === actionKey("remove", "selected")} icon={Trash2} /> Remove Selected
            </Button>
          </div>
        }
      >
        {!rows.length ? (
          <p className="pt-2 text-sm text-muted-foreground">No tenant databases found.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-md border border-border/70">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-muted/45 text-muted-foreground">
                <tr>
                  <th className="w-10 px-3 py-2">
                    <input aria-label="Select all tenant databases" checked={allSelected} type="checkbox" onChange={toggleAll} />
                  </th>
                  <th className="px-3 py-2 font-medium">Tenant</th>
                  <th className="px-3 py-2 font-medium">Database</th>
                  <th className="px-3 py-2 font-medium">Mapping</th>
                  <th className="px-3 py-2 font-medium">Verified</th>
                  <th className="px-3 py-2 font-medium">Info</th>
                  <th className="px-3 py-2 text-right font-medium">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2">
                      <input aria-label={`Select ${row.database_name}`} checked={selected.has(String(row.id))} type="checkbox" onChange={() => toggleOne(String(row.id))} />
                    </td>
                    <td className="max-w-[220px] px-3 py-2">
                      <p className="truncate font-medium">{row.tenant_name || row.tenant_code || `Tenant ${row.tenant_id}`}</p>
                      <p className="truncate text-muted-foreground">{row.tenant_code || row.tenant_id}</p>
                    </td>
                    <td className="max-w-[260px] truncate px-3 py-2">{row.database_name}</td>
                    <td className="px-3 py-2"><StatusBadge tone={toneForStatus(row.status)}>{row.status || "unknown"}</StatusBadge></td>
                    <td className="px-3 py-2"><StatusBadge tone={toneForStatus(row.dbStatus)}>{row.dbStatus}</StatusBadge></td>
                    <td className="px-3 py-2"><StatusBadge tone={row.database_exists ? "blue" : "amber"}>{row.dbInfo || "not checked"}</StatusBadge></td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" disabled={disabled} onClick={() => verifyOne(String(row.id))}>
                          <ProgressIcon active={pendingAction === actionKey("verify", String(row.id))} icon={CheckCircle2} /> Check
                        </Button>
                        <Button size="sm" disabled={disabled} onClick={() => runTenantCommand("migrate", row)}>
                          <ProgressIcon active={pendingAction === actionKey("migrate", String(row.id))} icon={Play} /> Migrate
                        </Button>
                        <Button size="sm" variant="outline" disabled={disabled} onClick={() => runTenantCommand("migrate:rollback", row)}>
                          <ProgressIcon active={pendingAction === actionKey("migrate:rollback", String(row.id))} icon={RotateCcw} /> Rollback
                        </Button>
                        <Button size="sm" variant="outline" disabled={disabled} onClick={() => runTenantCommand("migrate:fresh", row)}>
                          <ProgressIcon active={pendingAction === actionKey("migrate:fresh", String(row.id))} icon={Sparkles} /> Fresh
                        </Button>
                        <Button className="border-red-200 text-red-600 hover:bg-red-50" size="sm" variant="outline" disabled={disabled} onClick={() => runTenantCommand("drop", row)}>
                          <ProgressIcon active={pendingAction === actionKey("drop", String(row.id))} icon={Trash2} /> Drop
                        </Button>
                        {row.status === "dropped" ? (
                          <Button className="border-red-200 text-red-700 hover:bg-red-50" size="sm" variant="outline" disabled={disabled} onClick={() => removeOne(row)}>
                            <ProgressIcon active={pendingAction === actionKey("remove", String(row.id))} icon={Trash2} /> Remove
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmActionDialog
        pending={pendingConfirmation}
        running={Boolean(pendingAction)}
        onClose={() => setPendingConfirmation(null)}
      />
    </div>
  );
}

function ConfirmActionDialog({
  onClose,
  pending,
  running
}: {
  onClose: () => void;
  pending: PendingConfirmation | null;
  running: boolean;
}) {
  return (
    <Dialog open={Boolean(pending)} onOpenChange={(open) => { if (!open && !running) onClose(); }}>
      <DialogContent className="rounded-md border-border/70 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{pending?.title ?? "Confirm action"}</DialogTitle>
          <DialogDescription>{pending?.description ?? "Confirm this database operation."}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={running} onClick={onClose}>Cancel</Button>
          <Button
            type="button"
            disabled={running}
            className={pending?.tone === "danger" ? "bg-red-600 text-white hover:bg-red-700" : undefined}
            onClick={() => pending?.onConfirm()}
          >
            {running ? <Loader2 className="size-4 animate-spin" /> : null}
            {pending?.actionLabel ?? "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProgressIcon({ active, icon: Icon }: { active: boolean; icon: typeof CheckCircle2 }) {
  return active ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />;
}

function actionKey(command: DatabaseCommand | "remove" | "verify", target: string) {
  return `${command}:${target}`;
}

function actionLabelForCommand(command: DatabaseCommand) {
  if (command === "drop") return "Drop";
  if (command === "migrate:fresh") return "Fresh migrate";
  if (command === "migrate:rollback") return "Rollback";
  return "Migrate";
}

function confirmationDescription(command: DatabaseCommand, targetLabel: string) {
  if (command === "drop") return `This drops the physical database for ${targetLabel}. The mapping can be removed separately after drop.`;
  if (command === "migrate:fresh") return `This drops tenant tables and rebuilds migrations for ${targetLabel}.`;
  if (command === "migrate:rollback") return `This rolls back the latest tenant migration for ${targetLabel}.`;
  return `This runs pending tenant migrations for ${targetLabel}.`;
}

function toneForStatus(status: string): "green" | "blue" | "amber" | "red" | "neutral" {
  if (status === "passed" || status === "ready" || status === "succeeded" || status === "verified" || status === "healthy") return "green";
  if (status === "warning" || status === "pending" || status === "requested" || status === "needs_mapping") return "amber";
  if (status === "dropped" || status === "failed" || status === "error" || status === "missing") return "red";
  if (status === "running") return "blue";
  return "neutral";
}
