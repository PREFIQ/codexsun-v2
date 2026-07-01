import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Bot, CheckCircle2, GitPullRequest, ListChecks, MessageSquare, RefreshCw, Rocket, ShieldCheck } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceTableEmptyState, WorkspaceTablePanel, WorkspaceTableSkeletonRows } from "@codexsun/ui/workspace/table";
import { cn } from "@codexsun/ui/lib/utils";
import { apiGet } from "../../api";

type DashboardRecord = {
  active?: boolean;
  assignee?: string;
  createdAt?: string;
  githubBranch?: string;
  githubCommit?: string;
  githubPr?: string;
  id: string;
  key?: string;
  moduleKey?: string;
  ownerTeam?: string;
  priority?: string;
  referenceId?: string;
  referenceType?: string;
  reviewer?: string;
  severity?: string;
  status?: string;
  title?: string;
  type?: string;
  updatedAt?: string;
  version?: string;
};

type MaturityResult = Record<string, unknown>;

type RegistryResult = {
  platforms: Array<{
    groups: Array<{
      modules: Array<{
        actions?: unknown[];
        apis?: unknown[];
        database?: unknown[];
        features?: unknown[];
        screens?: unknown[];
      }>;
    }>;
  }>;
};

export function ProjectManagerDashboard() {
  const maturityQuery = useQuery<MaturityResult>({
    queryKey: ["admin", "project-manager", "maturity", "result"],
    queryFn: () => apiGet<MaturityResult>("/admin/project-manager/maturity/result", "sa")
  });

  const registryQuery = useQuery<RegistryResult>({
    queryKey: ["admin", "project-manager", "result"],
    queryFn: () => apiGet<RegistryResult>("/admin/project-manager/result", "sa")
  });

  const dashboard = useMemo(() => buildDashboard(maturityQuery.data, registryQuery.data), [maturityQuery.data, registryQuery.data]);
  const loading = maturityQuery.isFetching || registryQuery.isFetching;

  return (
    <WorkspacePage
      title="Project Manager"
      description="Live project control center for registry coverage, open work, reviews, release state, GitHub activity, security, and automation."
      technicalName="page.project-manager.dashboard"
      actions={
        <Button type="button" variant="outline" className="h-9 rounded-md" onClick={() => { void maturityQuery.refetch(); void registryQuery.refetch(); }}>
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          Refresh
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Metric icon={ListChecks} label="Open work" value={dashboard.openWork.length} />
          <Metric icon={AlertTriangle} label="Blocked / risk" value={dashboard.risks.length} tone="danger" />
          <Metric icon={MessageSquare} label="Pending reviews" value={dashboard.pendingReviews.length} />
          <Metric icon={Rocket} label="Working release" value={dashboard.workingRelease.length} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <WorkspaceTablePanel>
            <SectionHeader icon={ListChecks} title="Needs attention" description="Open, blocked, review, and security records that should be acted on first." />
            <RecordList loading={loading} records={[...dashboard.risks, ...dashboard.pendingReviews, ...dashboard.openWork].slice(0, 10)} />
          </WorkspaceTablePanel>

          <div className="space-y-4">
            <WorkspaceTablePanel>
              <SectionHeader icon={Rocket} title="Release state" description="Latest deployed release and active working release changes." />
              <div className="space-y-3 p-4">
                <CompactRecord label="Latest deployed" record={dashboard.latestRelease} />
                <CompactRecord label="Working changes" record={dashboard.workingRelease[0]} />
              </div>
            </WorkspaceTablePanel>

            <WorkspaceTablePanel>
              <SectionHeader icon={GitPullRequest} title="GitHub" description="Latest PR or git snapshot from Project Manager." />
              <div className="space-y-3 p-4">
                <CompactRecord label="Latest PR" record={dashboard.latestPullRequest} />
                <CompactRecord label="Git ref" record={dashboard.latestGithub} />
              </div>
            </WorkspaceTablePanel>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <WorkspaceTablePanel>
            <SectionHeader icon={ShieldCheck} title="Security & quality" description="Risk, audit, permission, test, and quality work." />
            <RecordList compact loading={loading} records={dashboard.security.slice(0, 5)} />
          </WorkspaceTablePanel>
          <WorkspaceTablePanel>
            <SectionHeader icon={Bot} title="Automation activity" description="Recent commands, actions, and timeline events." />
            <RecordList compact loading={loading} records={dashboard.automation.slice(0, 5)} />
          </WorkspaceTablePanel>
          <WorkspaceTablePanel>
            <SectionHeader icon={CheckCircle2} title="Registry coverage" description="Registry shape currently available to Project Manager." />
            <div className="grid grid-cols-2 gap-3 p-4 text-sm">
              <Coverage label="Modules" value={dashboard.coverage.modules} />
              <Coverage label="Features" value={dashboard.coverage.features} />
              <Coverage label="APIs" value={dashboard.coverage.apis} />
              <Coverage label="Screens" value={dashboard.coverage.screens} />
              <Coverage label="Actions" value={dashboard.coverage.actions} />
              <Coverage label="Database" value={dashboard.coverage.database} />
            </div>
          </WorkspaceTablePanel>
        </div>
      </div>
    </WorkspacePage>
  );
}

function buildDashboard(maturity?: MaturityResult, registry?: RegistryResult) {
  const issues = list(maturity, "issue");
  const tasks = list(maturity, "task");
  const kanban = list(maturity, "kanban");
  const reviews = list(maturity, "review");
  const security = list(maturity, "security_quality");
  const releases = list(maturity, "release");
  const changelog = list(maturity, "changelog");
  const pullRequests = list(maturity, "pull_request");
  const github = list(maturity, "github");
  const automation = [...list(maturity, "action"), ...list(maturity, "automation"), ...list(maturity, "activity"), ...list(maturity, "timeline")].sort(byUpdated);

  const openWork = [...issues, ...tasks, ...kanban].filter((record) => isOpen(record.status));
  const risks = [...issues, ...tasks, ...kanban, ...security].filter((record) => isRisk(record));
  const pendingReviews = reviews.filter((record) => isOpen(record.status));

  return {
    automation,
    coverage: registryCoverage(registry),
    latestGithub: github.sort(byUpdated)[0],
    latestPullRequest: pullRequests.sort(byUpdated)[0],
    latestRelease: releases.filter((record) => ["released", "active"].includes(String(record.status ?? ""))).sort(byUpdated)[0] ?? releases.sort(byUpdated)[0],
    openWork,
    pendingReviews,
    risks,
    security: security.sort(byUpdated),
    workingRelease: changelog.filter((record) => !["released", "done"].includes(String(record.status ?? ""))).sort(byUpdated)
  };
}

function list(result: MaturityResult | undefined, kind: string): DashboardRecord[] {
  const value = result?.[kind];
  return Array.isArray(value) ? value as DashboardRecord[] : [];
}

function registryCoverage(registry?: RegistryResult) {
  const modules = registry?.platforms?.flatMap((platform) => platform.groups.flatMap((group) => group.modules)) ?? [];
  return {
    actions: modules.reduce((count, module) => count + (module.actions?.length ?? 0), 0),
    apis: modules.reduce((count, module) => count + (module.apis?.length ?? 0), 0),
    database: modules.reduce((count, module) => count + (module.database?.length ?? 0), 0),
    features: modules.reduce((count, module) => count + (module.features?.length ?? 0), 0),
    modules: modules.length,
    screens: modules.reduce((count, module) => count + (module.screens?.length ?? 0), 0)
  };
}

function isOpen(status = "") {
  return ["open", "planned", "draft", "ready", "assigned", "in-progress", "in-review", "needs-review", "requested"].includes(status);
}

function isRisk(record: DashboardRecord) {
  return ["blocked", "changes-requested", "critical", "needs-review"].includes(String(record.status ?? "")) || ["critical", "high"].includes(String(record.severity ?? "")) || record.type === "security";
}

function byUpdated(a: DashboardRecord, b: DashboardRecord) {
  return String(b.updatedAt ?? b.createdAt ?? "").localeCompare(String(a.updatedAt ?? a.createdAt ?? ""));
}

function Metric({ icon: Icon, label, tone, value }: { icon: typeof ListChecks; label: string; tone?: "danger"; value: number }) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <Icon className={cn("size-4 text-muted-foreground", tone === "danger" && "text-destructive")} />
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function SectionHeader({ description, icon: Icon, title }: { description: string; icon: typeof ListChecks; title: string }) {
  return (
    <div className="border-b border-border/70 px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-semibold"><Icon className="size-4" />{title}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </div>
  );
}

function RecordList({ compact, loading, records }: { compact?: boolean; loading: boolean; records: DashboardRecord[] }) {
  if (!records.length && loading) return <WorkspaceTableSkeletonRows columns={3} />;
  if (!records.length) return <WorkspaceTableEmptyState>No records need attention.</WorkspaceTableEmptyState>;
  return (
    <div className="divide-y divide-border/70">
      {records.map((record) => (
        <div key={record.id} className={cn("grid gap-2 px-4 py-3", compact ? "" : "md:grid-cols-[minmax(0,1fr)_160px_120px]")}>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{record.title || record.key}</div>
            <div className="mt-1 truncate font-mono text-xs text-muted-foreground">{record.referenceId || record.key || record.moduleKey || "-"}</div>
          </div>
          {!compact ? <div className="text-sm text-muted-foreground">{record.assignee || record.reviewer || record.ownerTeam || record.moduleKey || "-"}</div> : null}
          <WorkspaceStatusBadge label={record.status || (record.active ? "active" : "inactive")} tone={record.active === false ? "danger" : "success"} />
        </div>
      ))}
    </div>
  );
}

function CompactRecord({ label, record }: { label: string; record: DashboardRecord | undefined }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      {record ? (
        <>
          <div className="mt-1 truncate text-sm font-semibold">{record.version || record.githubPr || record.title || record.key}</div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="truncate text-xs text-muted-foreground">{record.moduleKey || record.referenceId || record.githubBranch || "-"}</span>
            <WorkspaceStatusBadge label={record.status || "active"} tone={record.active === false ? "danger" : "success"} />
          </div>
        </>
      ) : <div className="mt-1 text-sm text-muted-foreground">No record yet</div>}
    </div>
  );
}

function Coverage({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-muted/20 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}
