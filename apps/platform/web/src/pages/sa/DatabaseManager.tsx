import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DatabaseBackup, Download, Gauge, GitCompareArrows, Play, RefreshCw, ShieldCheck } from "lucide-react";
import { Button, Card, Input, StatusBadge } from "@codexsun/ui";
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

type TenantDatabase = {
  database_name: string;
  dbStatus: string;
  id: string;
  status: string;
  tenant_id: string;
};

export function DatabaseManager({ onBack }: { onBack: () => void }) {
  const queryClient = useQueryClient();
  const [clientKey, setClientKey] = useState("legacy-client");
  const overviewQuery = useQuery<DatabaseOverview>({
    queryKey: ["admin", "database-operations", "overview"],
    queryFn: () => apiGet<DatabaseOverview>("/admin/database-operations/overview", "sa")
  });
  const preflightQuery = useQuery<PreflightResult>({
    queryKey: ["admin", "database-operations", "preflight"],
    queryFn: () => apiGet<PreflightResult>("/admin/database-operations/preflight", "sa")
  });
  const databasesQuery = useQuery<TenantDatabase[]>({
    queryKey: ["admin", "databases"],
    queryFn: () => apiGet<TenantDatabase[]>("/admin/databases", "sa")
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
    onSuccess: invalidate
  });
  const createDump = useMutation({
    mutationFn: () => apiPost("/admin/database-operations/dumps", { databaseName: overview?.platformDatabase, dumpMode: "full", scope: "platform" }, "sa"),
    onSuccess: invalidate
  });
  const restoreTest = useMutation({
    mutationFn: () => apiPost("/admin/database-operations/restore-tests", { sourceDatabase: overview?.platformDatabase }, "sa"),
    onSuccess: invalidate
  });
  const mirrorCheck = useMutation({
    mutationFn: () => apiPost("/admin/database-operations/mirror-health", { sourceDatabase: overview?.platformDatabase }, "sa"),
    onSuccess: invalidate
  });
  const runMigrations = useMutation({
    mutationFn: () => apiPost("/admin/migrations/run", {}, "sa"),
    onSuccess: invalidate
  });
  const legacyDryRun = useMutation({
    mutationFn: () => apiPost("/admin/legacy-import/dry-run", { clientKey }, "sa"),
    onSuccess: invalidate
  });

  const latestBackup = overview?.backups[0];
  const backupFreshness = latestBackup ? formatDate(latestBackup.created_at) : "No backup recorded";
  const tenantDatabaseCount = databasesQuery.data?.length ?? 0;
  const production = overview?.environment === "production";
  const migrationBlocked = production && !preflight?.allowed;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4">
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
                <RefreshCw className="size-4" /> Preflight
              </Button>
              <Button size="sm" variant="outline" disabled={createBackup.isPending} onClick={() => createBackup.mutate()}>
                <DatabaseBackup className="size-4" /> Backup
              </Button>
              <Button size="sm" disabled={migrationBlocked || runMigrations.isPending} onClick={() => runMigrations.mutate()}>
                <Play className="size-4" /> Run Pending
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <OperationPanel
          action={
            <Button size="sm" variant="outline" disabled={createDump.isPending} onClick={() => createDump.mutate()}>
              <Download className="size-4" /> Dump
            </Button>
          }
          rows={overview?.backups ?? []}
          title="Backups And Dumps"
          empty="No backup or dump records yet."
          columns={["database_name", "backup_type", "status", "verified", "created_at"]}
        />
        <OperationPanel
          action={
            <Button size="sm" variant="outline" disabled={restoreTest.isPending} onClick={() => restoreTest.mutate()}>
              <ShieldCheck className="size-4" /> Restore Test
            </Button>
          }
          rows={overview?.restoreTests ?? []}
          title="Restore Tests"
          empty="No restore tests recorded yet."
          columns={["source_database", "target_database", "status", "started_at"]}
        />
        <OperationPanel
          action={
            <Button size="sm" variant="outline" disabled={mirrorCheck.isPending} onClick={() => mirrorCheck.mutate()}>
              <Gauge className="size-4" /> Check
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
            <Button size="sm" variant="outline" disabled={legacyDryRun.isPending} onClick={() => legacyDryRun.mutate()}>
              <GitCompareArrows className="size-4" /> Dry Run
            </Button>
          </div>
          <MiniRows rows={overview?.legacyBatches ?? []} columns={["client_key", "mode", "status", "failed_count", "started_at"]} empty="No legacy dry-runs yet." />
        </Card>
      </div>

      <OperationPanel
        rows={databasesQuery.data ?? []}
        title="Tenant Databases"
        empty="No tenant databases found."
        columns={["database_name", "tenant_id", "status", "dbStatus"]}
      />
    </div>
  );
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
