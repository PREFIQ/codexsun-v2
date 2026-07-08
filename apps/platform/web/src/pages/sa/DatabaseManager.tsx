import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DatabaseBackup, Download, Gauge, GitCompareArrows, Loader2, Play, RefreshCw, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { Button, Card, Input, StatusBadge } from "@codexsun/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@codexsun/ui/components/dialog";
import { apiGet, apiPost } from "../../api";

type OperationRow = Record<string, unknown>;

type PendingMigration = {
  checksum: string;
  description: string;
  id: string;
};

type DatabaseOverview = {
  appVersion: string;
  backups: OperationRow[];
  environment: string;
  legacyBatches: OperationRow[];
  mirrors: OperationRow[];
  pendingMigrations: PendingMigration[];
  platformDatabase: string;
  restoreTests: OperationRow[];
  tenantTestDatabase: string;
  versions: OperationRow[];
};

type PreflightResult = {
  allowed: boolean;
  checks: Array<{ detail: string; key: string; label: string; status: string }>;
  pending: PendingMigration[];
};

type DatabaseCommand = "migrate" | "migrate:fresh" | "migrate:rollback";
type CommandScope = "master" | "tenant";
type DatabaseCommandInput = {
  allTenants?: boolean;
  command: DatabaseCommand;
  confirm?: boolean;
  databaseName?: string;
  scope: CommandScope;
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

export function DatabaseManager({ onBack, onTenantDatabases }: { onBack: () => void; onTenantDatabases: () => void }) {
  const queryClient = useQueryClient();
  const [clientKey, setClientKey] = useState("legacy-client");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const overviewQuery = useQuery<DatabaseOverview>({
    queryKey: ["admin", "database-operations", "overview"],
    queryFn: () => apiGet<DatabaseOverview>("/admin/database-operations/overview", "sa")
  });
  const preflightQuery = useQuery<PreflightResult>({
    queryKey: ["admin", "database-operations", "preflight"],
    queryFn: () => apiGet<PreflightResult>("/admin/database-operations/preflight", "sa")
  });
  const databasesQuery = useQuery<Array<{ id: string }>>({
    queryKey: ["admin", "databases"],
    queryFn: () => apiGet<Array<{ id: string }>>("/admin/databases", "sa")
  });

  const overview = overviewQuery.data;
  const preflight = preflightQuery.data;
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "database-operations"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "migrations"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "databases"] });
  };

  const createBackup = useMutation({
    mutationFn: () => apiPost("/admin/database-operations/backups", { databaseName: overview?.platformDatabase, scope: "platform" }, "sa"),
    onSettled: () => setPendingAction(null),
    onSuccess: invalidate
  });
  const createDump = useMutation({
    mutationFn: () => apiPost("/admin/database-operations/dumps", { databaseName: overview?.platformDatabase, dumpMode: "full", scope: "platform" }, "sa"),
    onSettled: () => setPendingAction(null),
    onSuccess: invalidate
  });
  const restoreTest = useMutation({
    mutationFn: () => apiPost("/admin/database-operations/restore-tests", { sourceDatabase: overview?.platformDatabase }, "sa"),
    onSettled: () => setPendingAction(null),
    onSuccess: invalidate
  });
  const mirrorCheck = useMutation({
    mutationFn: () => apiPost("/admin/database-operations/mirror-health", { sourceDatabase: overview?.platformDatabase }, "sa"),
    onSettled: () => setPendingAction(null),
    onSuccess: invalidate
  });
  const runDatabaseCommand = useMutation({
    mutationFn: (input: DatabaseCommandInput) => apiPost("/admin/database-operations/commands", input, "sa"),
    onSettled: () => setPendingAction(null),
    onSuccess: invalidate
  });
  const legacyDryRun = useMutation({
    mutationFn: () => apiPost("/admin/legacy-import/dry-run", { clientKey }, "sa"),
    onSettled: () => setPendingAction(null),
    onSuccess: invalidate
  });

  const latestBackup = overview?.backups[0];
  const backupFreshness = latestBackup ? formatDate(latestBackup.created_at) : "No backup recorded";
  const tenantDatabaseCount = databasesQuery.data?.length ?? 0;
  const production = overview?.environment === "production";
  const migrationBlocked = production && !preflight?.allowed;

  return (
    <div className="mx-auto grid w-[calc(100%-2rem)] max-w-[92rem] gap-4 py-4 lg:w-[calc(100%-3rem)] lg:py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-normal">Database Manager</h1>
          <p className="text-sm text-muted-foreground">Safe migrations, backups, dumps, mirror health, and legacy import readiness.</p>
        </div>
        <Button variant="outline" size="sm" onClick={onBack}>Back</Button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric title="Environment" value={overview?.environment ?? "loading"} tone={production ? "red" : "green"} />
        <Metric title="App Version" value={overview?.appVersion ?? "unknown"} tone="blue" />
        <Metric title="Pending Migrations" value={String(overview?.pendingMigrations.length ?? 0)} tone={(overview?.pendingMigrations.length ?? 0) ? "amber" : "green"} />
        <Metric title="Tenant Databases" value={String(tenantDatabaseCount)} tone="neutral" />
      </div>

      <Card
        title="Tenant Database Operations"
        description="Tenant verification, per-row migration, rollback, fresh rebuild, and physical database drop live in a dedicated tenant database page."
        action={<Button size="sm" variant="outline" onClick={onTenantDatabases}>Open Tenant Databases</Button>}
      />

      <Card title="Migration Safety" description={`Platform database: ${overview?.platformDatabase ?? "loading"}`}>
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-2">
            {preflight?.checks.map((check) => (
              <div key={check.key} className="flex items-center justify-between gap-3 rounded-md border border-border/70 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{check.label}</p>
                  <p className="text-xs text-muted-foreground">{check.detail}</p>
                </div>
                <StatusBadge tone={toneForStatus(check.status)}>{check.status}</StatusBadge>
              </div>
            ))}
          </div>
          <div className="space-y-3 rounded-md border border-border/70 p-3">
            <p className="text-sm font-medium">Last backup: {backupFreshness}</p>
            <p className="text-xs text-muted-foreground">Production migration runs are blocked unless a verified platform backup exists.</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => preflightQuery.refetch()}>
                <RefreshCw className={`size-4 ${preflightQuery.isFetching ? "animate-spin" : ""}`} /> Preflight
              </Button>
              <Button size="sm" variant="outline" disabled={createBackup.isPending} onClick={() => { setPendingAction("backup"); createBackup.mutate(); }}>
                <ProgressIcon active={pendingAction === "backup"} icon={DatabaseBackup} /> Backup
              </Button>
              <Button size="sm" disabled={migrationBlocked || runDatabaseCommand.isPending} onClick={() => { setPendingAction("master:migrate"); runDatabaseCommand.mutate({ command: "migrate", scope: "master" }); }}>
                <ProgressIcon active={pendingAction === "master:migrate"} icon={Play} /> db:migrate
              </Button>
              <Button size="sm" variant="outline" disabled={migrationBlocked || runDatabaseCommand.isPending} onClick={() => setPendingConfirmation({
                actionLabel: "Rollback",
                description: "This rolls back the latest master database migration.",
                onConfirm: () => {
                  setPendingConfirmation(null);
                  setPendingAction("master:rollback");
                  runDatabaseCommand.mutate({ command: "migrate:rollback", confirm: true, scope: "master" });
                },
                title: "Run db:migrate-rollback?"
              })}>
                <ProgressIcon active={pendingAction === "master:rollback"} icon={RotateCcw} /> db:migrate-rollback
              </Button>
              <Button size="sm" variant="outline" disabled={migrationBlocked || runDatabaseCommand.isPending} onClick={() => setPendingConfirmation({
                actionLabel: "Fresh migrate",
                description: "This drops and rebuilds master database tables only.",
                onConfirm: () => {
                  setPendingConfirmation(null);
                  setPendingAction("master:fresh");
                  runDatabaseCommand.mutate({ command: "migrate:fresh", confirm: true, scope: "master" });
                },
                title: "Run db:migrate-fresh?",
                tone: "danger"
              })}>
                <ProgressIcon active={pendingAction === "master:fresh"} icon={Sparkles} /> db:migrate-fresh
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Fresh and rollback commands require confirmation and are audited as Super Admin database commands.</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <OperationPanel
          action={
            <Button size="sm" variant="outline" disabled={createDump.isPending} onClick={() => { setPendingAction("dump"); createDump.mutate(); }}>
              <ProgressIcon active={pendingAction === "dump"} icon={Download} /> Dump
            </Button>
          }
          rows={overview?.backups ?? []}
          title="Backups And Dumps"
          empty="No backup or dump records yet."
          columns={["database_name", "backup_type", "status", "verified", "created_at"]}
        />
        <OperationPanel
          action={
            <Button size="sm" variant="outline" disabled={restoreTest.isPending} onClick={() => { setPendingAction("restore-test"); restoreTest.mutate(); }}>
              <ProgressIcon active={pendingAction === "restore-test"} icon={ShieldCheck} /> Restore Test
            </Button>
          }
          rows={overview?.restoreTests ?? []}
          title="Restore Tests"
          empty="No restore tests recorded yet."
          columns={["source_database", "target_database", "status", "started_at"]}
        />
        <OperationPanel
          action={
            <Button size="sm" variant="outline" disabled={mirrorCheck.isPending} onClick={() => { setPendingAction("mirror-check"); mirrorCheck.mutate(); }}>
              <ProgressIcon active={pendingAction === "mirror-check"} icon={Gauge} /> Check
            </Button>
          }
          rows={overview?.mirrors ?? []}
          title="Mirror Health"
          empty="No mirror health records yet."
          columns={["server_name", "source_database", "target_database", "lag_seconds", "status"]}
        />
        <Card title="Legacy Client Migration" description="Map old app tables, then run dry-run imports before cutover.">
          <div className="flex flex-wrap gap-2">
            <Input className="h-9 max-w-xs rounded-md" value={clientKey} onChange={(event) => setClientKey(event.target.value)} />
            <Button size="sm" variant="outline" disabled={legacyDryRun.isPending} onClick={() => { setPendingAction("legacy-dry-run"); legacyDryRun.mutate(); }}>
              <ProgressIcon active={pendingAction === "legacy-dry-run"} icon={GitCompareArrows} /> Dry Run
            </Button>
          </div>
          <MiniRows rows={overview?.legacyBatches ?? []} columns={["client_key", "mode", "status", "failed_count", "started_at"]} empty="No legacy dry-runs yet." />
        </Card>
      </div>

      <ConfirmActionDialog pending={pendingConfirmation} running={Boolean(pendingAction)} onClose={() => setPendingConfirmation(null)} />
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

function ProgressIcon({ active, icon: Icon }: { active: boolean; icon: typeof DatabaseBackup }) {
  return active ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />;
}

function Metric({ title, value, tone }: { title: string; value: string; tone: "green" | "blue" | "amber" | "red" | "neutral" }) {
  return (
    <div className="rounded-md border border-border/70 bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase text-muted-foreground">{title}</p>
        <StatusBadge tone={tone}>{value}</StatusBadge>
      </div>
    </div>
  );
}

function OperationPanel({
  action,
  columns,
  empty,
  rows,
  title
}: {
  action?: ReactNode;
  columns: string[];
  empty: string;
  rows: OperationRow[];
  title: string;
}) {
  return (
    <Card title={title} action={action}>
      <MiniRows columns={columns} empty={empty} rows={rows} />
    </Card>
  );
}

function MiniRows({ columns, empty, rows }: { columns: string[]; empty: string; rows: OperationRow[] }) {
  const visibleRows = useMemo(() => rows.slice(0, 6), [rows]);
  if (!visibleRows.length) {
    return <p className="pt-2 text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <div className="mt-3 overflow-x-auto rounded-md border border-border/70">
      <table className="min-w-full text-left text-xs">
        <thead className="bg-muted/45 text-muted-foreground">
          <tr>
            {columns.map((column) => <th key={column} className="px-3 py-2 font-medium">{label(column)}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {visibleRows.map((row, index) => (
            <tr key={String(row.id ?? index)}>
              {columns.map((column) => (
                <td key={column} className="max-w-[220px] truncate px-3 py-2">{formatCell(row[column])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function toneForStatus(status: string): "green" | "blue" | "amber" | "red" | "neutral" {
  if (status === "passed" || status === "succeeded" || status === "verified" || status === "healthy") return "green";
  if (status === "warning" || status === "pending" || status === "requested" || status === "needs_mapping") return "amber";
  if (status === "failed" || status === "error") return "red";
  if (status === "running") return "blue";
  return "neutral";
}

function formatDate(value: unknown) {
  if (!value) return "Not recorded";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function formatCell(value: unknown) {
  if (value === null || value === undefined || value === "") return "Not set";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}T|\d{4}-\d{2}-\d{2}/.test(text)) return formatDate(text);
  return text;
}

function label(value: string) {
  return value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
