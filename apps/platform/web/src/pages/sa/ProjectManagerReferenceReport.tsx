import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { WorkspaceAutocomplete } from "@codexsun/ui/workspace/autocomplete";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceTableEmptyState, WorkspaceTableHeaderCell, WorkspaceTablePanel, WorkspaceTableSkeletonRows } from "@codexsun/ui/workspace/table";
import { cn } from "@codexsun/ui/lib/utils";
import { apiGet } from "../../api";

type ReportRecord = {
  active?: boolean;
  githubPr?: string;
  assignee?: string;
  id: string;
  key?: string;
  moduleGroupKey?: string;
  moduleId?: string;
  moduleKey?: string;
  ownerTeam?: string;
  platformKey?: string;
  referenceId?: string;
  referenceType?: string;
  reviewer?: string;
  status?: string;
  title?: string;
  type?: string;
  version?: string;
};

type MaturityResult = Record<string, unknown>;

type RegistryResult = {
  platforms: Array<{
    active?: boolean;
    description?: string;
    id?: string;
    name: string;
    platform: string;
    groups: Array<{
      active?: boolean;
      description?: string;
      groupKey: string;
      id?: string;
      name: string;
      modules: Array<{
        actions?: RegistryDetailRecord[];
        active?: boolean;
        apis?: RegistryDetailRecord[];
        database?: RegistryDetailRecord[];
        description?: string;
        features?: RegistryDetailRecord[];
        id: string;
        moduleKey: string;
        name: string;
        notes?: RegistryDetailRecord[];
        planning?: RegistryDetailRecord[];
        route?: string;
        routePath?: string;
        screens?: RegistryDetailRecord[];
        status?: string;
      }>;
    }>;
  }>;
  features?: Array<RegistryDetailRecord>;
  actions?: Array<RegistryDetailRecord>;
  apis?: Array<RegistryDetailRecord>;
  screens?: Array<RegistryDetailRecord>;
  databaseObjects?: Array<RegistryDetailRecord>;
  planning?: Array<RegistryDetailRecord>;
  notes?: Array<RegistryDetailRecord>;
};

type RegistryDetailRecord = {
  active?: boolean;
  description?: string;
  id: string;
  key?: string;
  moduleId?: string;
  name?: string;
  permissionKey?: string;
  route?: string;
  routePath?: string;
  status?: string;
  title?: string;
  type?: string;
};

const trackedKinds = [
  "issue",
  "pull_request",
  "action",
  "automation",
  "task",
  "kanban",
  "discussion",
  "review",
  "release",
  "changelog",
  "coverage",
  "github",
  "activity",
  "timeline",
  "todo"
];

export function ProjectManagerInsights() {
  const [moduleId, setModuleId] = useState("");
  const [referenceNo, setReferenceNo] = useState("");

  const maturityQuery = useQuery<MaturityResult>({
    queryKey: ["admin", "project-manager", "maturity", "result"],
    queryFn: () => apiGet<MaturityResult>("/admin/project-manager/maturity/result", "sa")
  });

  const registryQuery = useQuery<RegistryResult>({
    queryKey: ["admin", "project-manager", "result"],
    queryFn: () => apiGet<RegistryResult>("/admin/project-manager/result", "sa")
  });

  const moduleOptions = useMemo(() => {
    const options: Array<{ groupKey: string; label: string; moduleKey: string; platformKey: string; value: string }> = [];
    for (const platform of registryQuery.data?.platforms ?? []) {
      for (const group of platform.groups ?? []) {
        for (const module of group.modules ?? []) {
          options.push({ groupKey: group.groupKey, label: `${platform.name} / ${group.name} / ${module.name}`, moduleKey: module.moduleKey, platformKey: platform.platform, value: module.id });
        }
      }
    }
    return options;
  }, [registryQuery.data]);

  const rows = useMemo(() => [...flattenRegistry(registryQuery.data), ...flattenResult(maturityQuery.data)], [maturityQuery.data, registryQuery.data]);
  const selectedModule = moduleOptions.find((option) => option.value === moduleId);
  const reportRows = rows.filter((row) => {
    const matchesModule = !moduleId || row.moduleId === moduleId || row.moduleKey === selectedModule?.moduleKey;
    const ref = referenceNo.trim().toLowerCase();
    const matchesReference = !ref || [row.referenceId, row.key, row.version, row.githubPr].some((value) => String(value ?? "").toLowerCase().includes(ref));
    return matchesModule && matchesReference;
  });
  const stats = summaryForRows(reportRows);

  return (
    <WorkspacePage
      title="Insights"
      description="Understand a platform/module/reference by seeing its registry definition and every work item, discussion, review, release note, action, and automation reaction connected to it."
      technicalName="page.project-manager.insights"
      actions={
        <Button type="button" variant="outline" className="h-9 rounded-md" onClick={() => { void maturityQuery.refetch(); void registryQuery.refetch(); }}>
          <RefreshCw className={cn("size-4", (maturityQuery.isFetching || registryQuery.isFetching) && "animate-spin")} />
          Refresh
        </Button>
      }
    >
      <div className="space-y-4">
        <WorkspaceTablePanel>
          <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <div className="mb-2 text-sm font-semibold">Module / model</div>
              <WorkspaceAutocomplete
                createLabel="Use module"
                options={moduleOptions}
                placeholder="Select platform module"
                value={moduleId}
                onChange={(value) => setModuleId(value ?? "")}
                onCreate={(query) => setModuleId(query)}
              />
            </div>
            <div>
              <div className="mb-2 text-sm font-semibold">Reference no</div>
              <Input className="h-10 rounded-md font-mono" placeholder="PM-REF-001, key, version, PR" value={referenceNo} onChange={(event) => setReferenceNo(event.target.value)} />
            </div>
          </div>
        </WorkspaceTablePanel>

        <div className="grid gap-3 md:grid-cols-4">
          <Metric label="Total reactions" value={stats.total} />
          <Metric label="Open" value={stats.open} />
          <Metric label="Done / released" value={stats.done} />
          <Metric label="Risk / blocked" value={stats.risk} />
        </div>

        <WorkspaceTablePanel>
          <div className="border-b border-border/70 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold"><BarChart3 className="size-4" /> Connected records</div>
            <div className="text-xs text-muted-foreground">Shows what happened around the selected module/reference across Project Manager.</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <Header>Area</Header>
                  <Header>Title</Header>
                  <Header>Reference no</Header>
                  <Header>Ref type</Header>
                  <Header>Module</Header>
                  <Header>Owner</Header>
                  <Header>Status</Header>
                  <Header>Version</Header>
                </tr>
              </thead>
              <tbody>
                {reportRows.map((row) => (
                  <tr key={`${row.kind}-${row.id}`} className="border-b border-border/70 last:border-b-0">
                    <td className="px-4 py-2.5 font-medium">{labelForKind(row.kind)}</td>
                    <td className="px-4 py-2.5">{row.title || row.key}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{row.referenceId || row.key || "-"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{row.referenceType || "-"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{row.moduleKey || row.moduleId || "-"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{row.assignee || row.reviewer || row.ownerTeam || "-"}</td>
                    <td className="px-4 py-2.5"><WorkspaceStatusBadge label={row.status || (row.active ? "active" : "inactive")} tone={row.active === false ? "danger" : "success"} /></td>
                    <td className="px-4 py-2.5 text-muted-foreground">{row.version || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {reportRows.length === 0 && maturityQuery.isFetching ? <WorkspaceTableSkeletonRows columns={7} /> : null}
          {reportRows.length === 0 && !maturityQuery.isFetching ? <WorkspaceTableEmptyState>No connected records found for this module/reference.</WorkspaceTableEmptyState> : null}
        </WorkspaceTablePanel>
      </div>
    </WorkspacePage>
  );
}

function flattenResult(result?: MaturityResult) {
  const rows: Array<ReportRecord & { kind: string }> = [];
  for (const kind of trackedKinds) {
    const value = result?.[kind];
    if (!Array.isArray(value)) continue;
    rows.push(...value.map((record) => ({ ...(record as ReportRecord), kind })));
  }
  return rows;
}

function flattenRegistry(result?: RegistryResult) {
  const rows: Array<ReportRecord & { kind: string }> = [];
  for (const platform of result?.platforms ?? []) {
    rows.push({
      active: platform.active ?? true,
      id: platform.id ?? platform.platform,
      key: platform.platform,
      kind: "registry_platform",
      platformKey: platform.platform,
      referenceId: platform.platform,
      referenceType: "platform",
      status: platform.active === false ? "inactive" : "active",
      title: platform.name,
      type: "platform"
    });
    for (const group of platform.groups ?? []) {
      rows.push({
        active: group.active ?? true,
        id: group.id ?? group.groupKey,
        key: group.groupKey,
        kind: "registry_group",
        moduleGroupKey: group.groupKey,
        platformKey: platform.platform,
        referenceId: group.groupKey,
        referenceType: "module-group",
        status: group.active === false ? "inactive" : "active",
        title: group.name,
        type: "module-group"
      });
      for (const module of group.modules ?? []) {
        rows.push({
          active: module.active ?? true,
          id: module.id,
          key: module.moduleKey,
          kind: "registry_module",
          moduleGroupKey: group.groupKey,
          moduleId: module.id,
          moduleKey: module.moduleKey,
          platformKey: platform.platform,
          referenceId: module.id,
          referenceType: "module",
          status: module.status || (module.active === false ? "inactive" : "active"),
          title: module.name,
          type: "module"
        });
        const nestedBuckets: Array<[string, RegistryDetailRecord[] | undefined]> = [
          ["registry_feature", module.features],
          ["registry_action", module.actions],
          ["registry_api", module.apis],
          ["registry_screen", module.screens],
          ["registry_database", module.database],
          ["registry_planning", module.planning],
          ["registry_note", module.notes]
        ];
        for (const [kind, records] of nestedBuckets) {
          for (const record of records ?? []) {
            rows.push(registryDetailRow(kind, record, module.id, module.moduleKey));
          }
        }
      }
    }
  }
  const detailBuckets: Array<[string, RegistryDetailRecord[] | undefined]> = [
    ["registry_feature", result?.features],
    ["registry_action", result?.actions],
    ["registry_api", result?.apis],
    ["registry_screen", result?.screens],
    ["registry_database", result?.databaseObjects],
    ["registry_planning", result?.planning],
    ["registry_note", result?.notes]
  ];
  for (const [kind, records] of detailBuckets) {
    for (const record of records ?? []) {
      rows.push(registryDetailRow(kind, record));
    }
  }
  return rows;
}

function registryDetailRow(kind: string, record: RegistryDetailRecord, moduleId = record.moduleId, moduleKey = ""): ReportRecord & { kind: string } {
  const row: ReportRecord & { kind: string } = {
    active: record.active ?? true,
    id: record.id,
    kind,
    moduleKey,
    ownerTeam: "Registry",
    referenceId: record.id,
    referenceType: kind.replace("registry_", ""),
    status: record.status || (record.active === false ? "inactive" : "active"),
    title: record.name || record.title || record.key || record.routePath || record.id
  };
  const key = record.key || record.permissionKey || record.routePath;
  if (key) row.key = key;
  if (moduleId) row.moduleId = moduleId;
  if (record.type) row.type = record.type;
  return row;
}

function summaryForRows(rows: Array<ReportRecord & { kind: string }>) {
  const openStatuses = new Set(["open", "planned", "draft", "ready", "assigned", "in-progress", "in-review", "needs-review"]);
  const doneStatuses = new Set(["done", "released", "completed", "resolved", "approved", "merged"]);
  const riskStatuses = new Set(["blocked", "changes-requested", "critical"]);
  return {
    done: rows.filter((row) => doneStatuses.has(String(row.status ?? ""))).length,
    open: rows.filter((row) => openStatuses.has(String(row.status ?? ""))).length,
    risk: rows.filter((row) => riskStatuses.has(String(row.status ?? "")) || row.type === "security").length,
    total: rows.length
  };
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-background px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function labelForKind(kind: string) {
  const labels: Record<string, string> = {
    action: "Action",
    activity: "Activity",
    agent_note: "Agent note",
    automation: "Automation",
    changelog: "Changelog",
    coverage: "Coverage",
    discussion: "Discussion",
    github: "Git ref",
    issue: "Issue",
    kanban: "Kanban",
    pull_request: "Pull request",
    release: "Release",
    review: "Review",
    security_quality: "Security and quality",
    task: "Task",
    timeline: "Timeline",
    todo: "Todo"
  };
  if (kind === "registry_platform") return "Registry platform";
  if (kind === "registry_group") return "Registry group";
  if (kind === "registry_module") return "Registry module";
  if (kind.startsWith("registry_")) return `Registry ${kind.replace("registry_", "")}`;
  return labels[kind] ?? kind;
}

function Header({ children }: { children: string }) {
  return <WorkspaceTableHeaderCell>{children}</WorkspaceTableHeaderCell>;
}
