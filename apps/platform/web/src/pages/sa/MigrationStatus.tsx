import { useQuery } from "@tanstack/react-query";
import { Button, Card, StatusBadge } from "@codexsun/ui";
import { apiGet } from "../../api";

type MigrationRow = {
  applied_at?: string | null;
  backupRunId?: number | string | null;
  checksum?: string;
  description?: string;
  errorMessage?: string | null;
  finishedAt?: string | null;
  id: string;
  startedAt?: string | null;
  status?: string;
};

export function MigrationStatus({ onBack }: { onBack: () => void }) {
  const { data: migrations, isLoading, refetch } = useQuery<MigrationRow[]>({
    queryKey: ["admin", "migrations"],
    queryFn: () => apiGet<MigrationRow[]>("/admin/migrations", "sa")
  });

  const pending = migrations?.filter((migration) => migration.status === "pending").length ?? 0;
  const failed = migrations?.filter((migration) => migration.status === "failed" || migration.status === "error").length ?? 0;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-normal">Migration Status</h1>
          <p className="text-sm text-muted-foreground">Platform migration version, checksum, backup link, and run status.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>Refresh</Button>
          <Button variant="outline" size="sm" onClick={onBack}>Back</Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Total" value={String(migrations?.length ?? 0)} tone="blue" />
        <Metric label="Pending" value={String(pending)} tone={pending ? "amber" : "green"} />
        <Metric label="Failed" value={String(failed)} tone={failed ? "red" : "green"} />
      </div>

      <Card title="Platform Migrations" description="Applied migrations must never be edited; add a corrective migration instead.">
        {isLoading ? <p className="text-sm text-muted-foreground">Loading migrations...</p> : null}
        {!isLoading && (!migrations || migrations.length === 0) ? <p className="text-sm text-muted-foreground">No migrations found.</p> : null}
        {migrations && migrations.length > 0 ? (
          <div className="overflow-x-auto rounded-md border border-border/70">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/45 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Migration</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Applied</th>
                  <th className="px-3 py-2 font-medium">Backup</th>
                  <th className="px-3 py-2 font-medium">Checksum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {migrations.map((migration) => (
                  <tr key={migration.id}>
                    <td className="px-3 py-2">
                      <p className="font-medium">{migration.id}</p>
                      <p className="text-xs text-muted-foreground">{migration.description ?? "No description"}</p>
                      {migration.errorMessage ? <p className="mt-1 text-xs text-red-700">{migration.errorMessage}</p> : null}
                    </td>
                    <td className="px-3 py-2"><StatusBadge tone={toneForStatus(migration.status ?? "pending")}>{migration.status ?? "pending"}</StatusBadge></td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{formatDate(migration.applied_at ?? migration.finishedAt)}</td>
                    <td className="px-3 py-2 text-xs">{migration.backupRunId ? `#${migration.backupRunId}` : "Not linked"}</td>
                    <td className="max-w-[180px] truncate px-3 py-2 font-mono text-xs text-muted-foreground">{migration.checksum || "Not recorded"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function Metric({ label, tone, value }: { label: string; tone: "green" | "blue" | "amber" | "red" | "neutral"; value: string }) {
  return (
    <div className="rounded-md border border-border/70 bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
        <StatusBadge tone={tone}>{value}</StatusBadge>
      </div>
    </div>
  );
}

function toneForStatus(status: string): "green" | "blue" | "amber" | "red" | "neutral" {
  if (status === "applied" || status === "succeeded") return "green";
  if (status === "pending" || status === "skipped") return "amber";
  if (status === "failed" || status === "error") return "red";
  if (status === "running") return "blue";
  return "neutral";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not applied";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
