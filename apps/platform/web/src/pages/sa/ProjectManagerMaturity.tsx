import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowLeft, ArrowUp, Bot, CheckCircle2, CircleDot, GitPullRequest, MessageSquare, Play, PlayCircle, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@codexsun/ui/components/dialog";
import { Input } from "@codexsun/ui/components/input";
import { Switch } from "@codexsun/ui/components/switch";
import { WorkspaceAutocomplete } from "@codexsun/ui/workspace/autocomplete";
import { WorkspaceDatePicker } from "@codexsun/ui/workspace/date-picker";
import { WorkspaceEditor } from "@codexsun/ui/workspace/editor";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { WorkspaceFormBanner, WorkspaceFormField, WorkspaceFormGrid } from "@codexsun/ui/workspace/upsert";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceTableEmptyState, WorkspaceTableHeaderCell, WorkspaceTablePanel, WorkspaceTableSkeletonRows } from "@codexsun/ui/workspace/table";
import { cn } from "@codexsun/ui/lib/utils";
import { apiDelete, apiGet, apiPost, apiPut } from "../../api";

type MaturityKind = "todos" | "tasks" | "reviews" | "issues" | "pull-requests" | "agents" | "discussions" | "actions" | "security-quality" | "kanban" | "timeline" | "changelog" | "github" | "releases" | "automations" | "coverage" | "activities" | "gantt";

type MaturityRecord = {
  active: boolean;
  actor: string;
  assignee: string;
  command: string;
  description: string;
  dueDate: string;
  endDate: string;
  eventName: string;
  githubBranch: string;
  githubCommit: string;
  githubIssue: string;
  githubPr: string;
  githubUrl: string;
  id: string;
  key: string;
  kind: MaturityKind;
  labels: string[];
  lane: string;
  moduleGroupKey: string;
  moduleId: string;
  moduleKey: string;
  ownerTeam: string;
  platformKey: string;
  priority: string;
  referenceId: string;
  referenceType: string;
  reviewer: string;
  richNotes: string;
  severity: string;
  sortOrder: number;
  startDate: string;
  status: string;
  title: string;
  type: string;
  version: string;
};

type MaturityForm = Omit<MaturityRecord, "id" | "labels" | "sortOrder"> & {
  id?: string;
  labels: string;
  sortOrder: string;
};

type RegistryResult = {
  platforms: Array<{
    id: string;
    name: string;
    platform: string;
    groups: Array<{
      groupKey: string;
      id: string;
      name: string;
      modules: Array<{ id: string; moduleKey: string; name: string }>;
    }>;
  }>;
};

type ReferenceLookups = {
  groupOptions: Array<{ label: string; value: string }>;
  issueOptions: Array<{ label: string; value: string }>;
  moduleOptions: Array<{ groupKey: string; label: string; moduleKey: string; platformKey: string; value: string }>;
  platformOptions: Array<{ label: string; value: string }>;
};

type MaturityTab = { icon: LucideIcon; kind: MaturityKind; label: string };

const tabs: MaturityTab[] = [
  { icon: CircleDot, kind: "issues", label: "Issues" },
  { icon: GitPullRequest, kind: "pull-requests", label: "Pull requests" },
  { icon: MessageSquare, kind: "discussions", label: "Discussions" },
  { icon: PlayCircle, kind: "actions", label: "Actions" },
  { icon: CheckCircle2, kind: "tasks", label: "Tasks" },
  { icon: CheckCircle2, kind: "reviews", label: "Reviews" },
  { icon: CheckCircle2, kind: "kanban", label: "Kanban" },
  { icon: CheckCircle2, kind: "automations", label: "Automations" },
  { icon: CheckCircle2, kind: "coverage", label: "Coverage" },
  { icon: CheckCircle2, kind: "activities", label: "Activity" },
  { icon: CheckCircle2, kind: "timeline", label: "Timeline" },
  { icon: CheckCircle2, kind: "todos", label: "Todos" },
  { icon: CheckCircle2, kind: "gantt", label: "Gantt" },
  { icon: GitPullRequest, kind: "github", label: "Git refs" }
];

const workTabs: MaturityTab[] = [
  { icon: CircleDot, kind: "issues", label: "Issues" },
  { icon: CheckCircle2, kind: "tasks", label: "Tasks" },
  { icon: CheckCircle2, kind: "reviews", label: "Reviews" },
  { icon: PlayCircle, kind: "automations", label: "Automation" },
  { icon: CheckCircle2, kind: "activities", label: "Activity" },
  { icon: CheckCircle2, kind: "todos", label: "Todos" },
  { icon: CheckCircle2, kind: "timeline", label: "Timeline" },
  { icon: CheckCircle2, kind: "gantt", label: "Gantt" }
];

const workChildKinds: MaturityKind[] = ["tasks", "reviews", "automations", "activities"];
const workSupportKinds: MaturityKind[] = ["todos", "timeline", "gantt"];

const discussionTabs: MaturityTab[] = [
  { icon: MessageSquare, kind: "discussions", label: "Discussion" }
];

const statusFilters = [
  { id: "all", label: "All records" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" }
];

export function ProjectManagerMaturity({
  availableTabs = workTabs,
  description = "Issue to task, review, automation, activity, timeline, and schedule flow.",
  initialKind = "issues",
  technicalName = "page.project-manager.maturity",
  title = "Work & Automation"
}: {
  availableTabs?: MaturityTab[];
  description?: string;
  initialKind?: MaturityKind;
  technicalName?: string;
  title?: string;
}) {
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<MaturityKind>(initialKind);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogRecord, setDialogRecord] = useState<MaturityRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MaturityRecord | null>(null);
  const [command] = useState("github:now");
  const [drillPath, setDrillPath] = useState<Array<{ kind: MaturityKind; record: MaturityRecord }>>([]);
  const [upsertRecord, setUpsertRecord] = useState<MaturityRecord | null>(null);
  const [upsertDraft, setUpsertDraft] = useState<Partial<MaturityRecord> | null>(null);
  const [upsertMode, setUpsertMode] = useState<"list" | "upsert">("list");
  const workDrillMode = technicalName === "page.project-manager.maturity";

  const recordsQuery = useQuery<MaturityRecord[]>({
    queryKey: ["admin", "project-manager", "maturity", kind],
    queryFn: () => apiGet<MaturityRecord[]>(`/admin/project-manager/maturity/${kind}`, "sa")
  });

  const registryQuery = useQuery<RegistryResult>({
    queryKey: ["admin", "project-manager", "result"],
    queryFn: () => apiGet<RegistryResult>("/admin/project-manager/result", "sa")
  });

  const issuesQuery = useQuery<MaturityRecord[]>({
    queryKey: ["admin", "project-manager", "maturity", "issues", "reference-options"],
    queryFn: () => apiGet<MaturityRecord[]>("/admin/project-manager/maturity/issues", "sa")
  });

  const workContextQueries = useQueries({
    queries: workChildKinds.map((item) => ({
      enabled: workDrillMode,
      queryKey: ["admin", "project-manager", "maturity", item, "work-context"],
      queryFn: () => apiGet<MaturityRecord[]>(`/admin/project-manager/maturity/${item}`, "sa")
    }))
  });

  const lookups = useMemo(() => buildReferenceLookups(registryQuery.data, issuesQuery.data ?? []), [issuesQuery.data, registryQuery.data]);

  const records = recordsQuery.data ?? [];
  const activeParent = drillPath[drillPath.length - 1]?.record ?? null;
  const rootIssue = drillPath[0]?.record ?? null;
  const issueContextReferenceKeys = useMemo(() => {
    if (!rootIssue?.key) return new Set<string>();
    const keys = new Set<string>([rootIssue.key]);
    for (const query of workContextQueries) {
      for (const record of query.data ?? []) {
        if (keys.has(record.referenceId)) keys.add(record.key);
      }
    }
    return keys;
  }, [rootIssue?.key, workContextQueries]);
  const filteredRecords = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    return records.filter((record) => {
      if (workDrillMode && kind !== "issues" && drillPath.length) {
        if (drillPath.length === 1 || workSupportKinds.includes(kind)) {
          if (!issueContextReferenceKeys.has(record.referenceId)) return false;
        } else if (record.referenceId !== activeParent?.key) {
          return false;
        }
      }
      const matchesSearch = !term || [record.title, record.key, record.referenceId, record.moduleKey, record.status, record.type, record.assignee, record.reviewer, record.version, record.command].some((value) => value.toLowerCase().includes(term));
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? record.active : !record.active);
      return matchesSearch && matchesStatus;
    });
  }, [activeParent?.key, drillPath.length, issueContextReferenceKeys, kind, records, searchValue, statusFilter, workDrillMode]);

  const saveMutation = useMutation({
    mutationFn: (form: MaturityForm) => apiPost<MaturityRecord>(`/admin/project-manager/maturity/${kind}`, maturityPayload(form), "sa"),
    onSuccess: async (record) => {
      await invalidateWorkflowKinds(queryClient, kind);
      toast.success(`${labelForKind(kind)} saved`, { description: record.title });
      setDialogOpen(false);
      setDialogRecord(null);
      setUpsertMode("list");
      setUpsertRecord(null);
    },
    onError: (error) => showError("Save failed", error)
  });

  const updateMutation = useMutation({
    mutationFn: (form: MaturityForm & { id: string }) => apiPut<MaturityRecord>(`/admin/project-manager/maturity/${kind}/${form.id}`, maturityPayload(form), "sa"),
    onSuccess: async (record) => {
      await invalidateWorkflowKinds(queryClient, kind);
      toast.success(`${labelForKind(kind)} updated`, { description: record.title });
      setDialogOpen(false);
      setDialogRecord(null);
      setUpsertMode("list");
      setUpsertRecord(null);
    },
    onError: (error) => showError("Update failed", error)
  });

  const lifecycleMutation = useMutation({
    mutationFn: ({ action, record }: { action: "deactivate" | "restore"; record: MaturityRecord }) => apiPost<MaturityRecord>(`/admin/project-manager/maturity/${kind}/${record.id}/${action}`, {}, "sa"),
    onSuccess: async () => {
      await invalidateKind(queryClient, kind);
    },
    onError: (error) => showError("Lifecycle failed", error)
  });

  const forceDeleteMutation = useMutation({
    mutationFn: (record: MaturityRecord) => apiDelete<{ deleted: boolean; id: string; title: string }>(`/admin/project-manager/maturity/${kind}/${record.id}`, "sa"),
    onSuccess: async () => {
      await invalidateKind(queryClient, kind);
      setPendingDelete(null);
    },
    onError: (error) => showError("Force delete failed", error)
  });

  const automationMdMutation = useMutation({
    mutationFn: ({ form, itemKind }: { form: MaturityForm; itemKind: MaturityKind }) =>
      apiPost<{ file: string; referenceNo: string }>(
        "/admin/project-manager/automation-md/reference",
        { ...maturityPayload(prepareMaturitySubmit(form, itemKind)), kind: itemKind },
        "sa"
      ),
    onSuccess: async (result) => {
      await Promise.all([invalidateKind(queryClient, "timeline"), invalidateKind(queryClient, "gantt")]);
      toast.success("Queued for AI", { description: result.referenceNo });
    },
    onError: (error) => showError("Automation sync failed", error)
  });

  const reorderTodoMutation = useMutation({
    mutationFn: async ({ direction, record, rows }: { direction: "down" | "up"; record: MaturityRecord; rows: MaturityRecord[] }) => {
      const ordered = rows.map((item, index) => ({ ...item, nextSortOrder: (index + 1) * 10 }));
      const currentIndex = ordered.findIndex((item) => item.id === record.id);
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      const current = ordered[currentIndex];
      const target = ordered[targetIndex];
      if (!current || !target) return;
      await Promise.all([
        apiPut<MaturityRecord>(`/admin/project-manager/maturity/todos/${current.id}`, maturityPayload({ ...formFromRecord(current, "todos"), sortOrder: String(target.nextSortOrder) }), "sa"),
        apiPut<MaturityRecord>(`/admin/project-manager/maturity/todos/${target.id}`, maturityPayload({ ...formFromRecord(target, "todos"), sortOrder: String(current.nextSortOrder) }), "sa")
      ]);
    },
    onSuccess: async () => {
      await invalidateKind(queryClient, "todos");
    },
    onError: (error) => showError("Move failed", error)
  });

  const commandMutation = useMutation({
    mutationFn: () => apiPost<{ automation: MaturityRecord; activity: MaturityRecord }>("/admin/project-manager/commands", { command, ...inferReferenceFromCommand(command, lookups) }, "sa"),
    onSuccess: async () => {
      await Promise.all(["activities", "automations", "timeline"].map((item) => invalidateKind(queryClient, item as MaturityKind)));
      toast.success("Command completed", { description: command });
    },
    onError: (error) => showError("Command failed", error)
  });

  const nextStageMutation = useMutation({
    mutationFn: async ({ currentKind, form, nextKind }: { currentKind: MaturityKind; form: MaturityForm; nextKind: MaturityKind }) => {
      const payload = maturityPayload(prepareMaturitySubmit(form, currentKind));
      const saved = form.id
        ? await apiPut<MaturityRecord>(`/admin/project-manager/maturity/${currentKind}/${form.id}`, payload, "sa")
        : await apiPost<MaturityRecord>(`/admin/project-manager/maturity/${currentKind}`, payload, "sa");
      const children = await apiGet<MaturityRecord[]>(`/admin/project-manager/maturity/${nextKind}`, "sa");
      const existingChild = children.find((child) => child.referenceId === saved.key);
      return { currentKind, existingChild, nextKind, parent: saved };
    },
    onSuccess: async ({ currentKind, existingChild, nextKind, parent }) => {
      await Promise.all([invalidateWorkflowKinds(queryClient, currentKind), invalidateWorkflowKinds(queryClient, nextKind)]);
      if (currentKind === "issues") await queryClient.invalidateQueries({ queryKey: ["admin", "project-manager", "maturity", "issues", "reference-options"] });
      setKind(nextKind);
      setSearchValue("");
      setStatusFilter("all");
      setUpsertMode("upsert");
      if (existingChild) {
        setUpsertRecord(existingChild);
        setUpsertDraft(null);
        toast.info(`${labelForKind(nextKind)} opened`, { description: existingChild.title });
        return;
      }
      setUpsertRecord(null);
      setUpsertDraft(childDraftForStage(nextKind, parent, currentKind));
      toast.success(`${labelForKind(currentKind)} saved`, { description: `New ${singularLabelForKind(nextKind)} is linked to ${parent.key}.` });
    },
    onError: (error) => showError("Next stage failed", error)
  });

  function toggleTodo(record: MaturityRecord, done: boolean) {
    updateMutation.mutate({
      ...formFromRecord(record, kind),
      active: !done,
      id: record.id,
      status: done ? "done" : "open"
    });
  }

  function toggleTimelineComplete(record: MaturityRecord, done: boolean) {
    updateMutation.mutate({
      ...formFromRecord(record, "timeline"),
      active: !done,
      id: record.id,
      status: done ? "completed" : "planned"
    });
  }

  function openEditor(record: MaturityRecord | null) {
    setUpsertDraft(null);
    if (isLargeKind(kind)) {
      setUpsertRecord(record);
      setUpsertMode("upsert");
      return;
    }
    setDialogRecord(record);
    setDialogOpen(true);
  }

  function openNewRecord() {
    const draftParent = workDrillMode && workSupportKinds.includes(kind) ? rootIssue : activeParent;
    const draft = workDrillMode && draftParent ? childDraftForStage(kind, draftParent, draftParent.kind) : null;
    setUpsertDraft(draft);
    if (isLargeKind(kind)) {
      setUpsertRecord(null);
      setUpsertMode("upsert");
      return;
    }
    setDialogRecord(null);
    setDialogOpen(true);
  }

  function drillRecord(record: MaturityRecord) {
    const nextStage = nextStageForKind(kind);
    if (!workDrillMode || !nextStage) {
      openEditor(record);
      return;
    }
    setDrillPath((current) => [...current, { kind, record }]);
    setKind(nextStage.kind);
    setSearchValue("");
    setStatusFilter("all");
  }

  function backDrill() {
    const nextPath = drillPath.slice(0, -1);
    const previous = drillPath[drillPath.length - 1];
    setDrillPath(nextPath);
    setKind(previous?.kind ?? "issues");
    setSearchValue("");
    setStatusFilter("all");
  }

  if (upsertMode === "upsert") {
    return (
      <MaturityUpsertPage
        errorMessage={errorMessage(saveMutation.error ?? updateMutation.error)}
        kind={kind}
        loading={saveMutation.isPending || updateMutation.isPending || nextStageMutation.isPending}
        lookups={lookups}
        draft={upsertDraft}
        record={upsertRecord}
        onBack={() => { setUpsertMode("list"); setUpsertRecord(null); setUpsertDraft(null); }}
        onAskAi={(form) => automationMdMutation.mutate({ form, itemKind: kind })}
        onNextStage={(nextKind, form) => nextStageMutation.mutate({ currentKind: kind, form, nextKind })}
        onSubmit={(form) => {
          if (form.id) updateMutation.mutate({ ...form, id: form.id });
          else saveMutation.mutate(form);
        }}
      />
    );
  }

  return (
    <WorkspacePage
      title={workDrillMode ? "" : title}
      description={workDrillMode ? "" : description}
      technicalName={technicalName}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" className="h-9 rounded-md" onClick={() => void recordsQuery.refetch()}>
            <RefreshCw className={cn("size-4", recordsQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
          {workDrillMode && drillPath.length ? (
            <Button type="button" variant="outline" className="h-9 rounded-md" onClick={backDrill}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
          ) : null}
          {!workDrillMode ? (
            <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-md" title="Run github:now" disabled={commandMutation.isPending} onClick={() => commandMutation.mutate()}>
              <Play className={cn("size-4", commandMutation.isPending && "animate-pulse")} />
            </Button>
          ) : null}
          {!(workDrillMode && kind === "todos") ? <Button type="button" className="h-9 rounded-md" onClick={openNewRecord}>
            <Plus className="size-4" />
            New {labelForKind(kind).toLowerCase()}
          </Button> : null}
        </div>
      }
    >
      <div className="space-y-4">
        {!workDrillMode ? <div className="flex flex-wrap gap-2 border-b border-border/70">
          {availableTabs.map((tab) => (
            <button
              key={tab.kind}
              className={cn("inline-flex h-10 items-center gap-2 border-b-2 px-3 text-sm font-medium", kind === tab.kind ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}
              type="button"
              onClick={() => { setKind(tab.kind); setSearchValue(""); setStatusFilter("all"); }}
            >
              <tab.icon className="size-4" />
              {tab.label}
            </button>
          ))}
        </div> : (
          <div className="space-y-2">
            {drillPath.length ? (
              <WorkStageNav
                activeKind={kind}
                onSelect={(nextKind) => {
                  if (nextKind === "issues") {
                    setDrillPath([]);
                  }
                  setKind(nextKind);
                  setSearchValue("");
                  setStatusFilter("all");
                }}
              />
            ) : null}
            <WorkStageHeader currentKind={kind} />
          </div>
        )}
        {workDrillMode && kind === "todos" ? (
          <SimpleTodoList
            loading={recordsQuery.isFetching}
            records={filteredRecords}
            saving={saveMutation.isPending || updateMutation.isPending || reorderTodoMutation.isPending}
            onAdd={(title) => {
              const draftParent = rootIssue ?? activeParent;
              const draft = draftParent ? childDraftForStage("todos", draftParent, draftParent.kind) : {};
              const nextSortOrder = Math.max(0, ...filteredRecords.map((record) => Number(record.sortOrder) || 0)) + 10;
              const form = prepareMaturitySubmit(formFromRecord(null, "todos", { ...draft, sortOrder: nextSortOrder, status: "open", title, type: "todo" }), "todos");
              saveMutation.mutate(form);
            }}
            onEdit={openEditor}
            onForceDelete={setPendingDelete}
            onMove={(record, direction) => reorderTodoMutation.mutate({ direction, record, rows: filteredRecords })}
            onToggle={toggleTodo}
          />
        ) : workDrillMode && kind === "timeline" ? (
          <TimelineActivityList
            loading={recordsQuery.isFetching}
            records={filteredRecords}
            saving={updateMutation.isPending}
            onEdit={openEditor}
            onForceDelete={setPendingDelete}
            onToggleComplete={toggleTimelineComplete}
          />
        ) : workDrillMode && kind === "gantt" ? (
          <GanttStrip records={filteredRecords} />
        ) : (
          <>
            <WorkspaceFilters
              columnOptions={[]}
              filterOptions={statusFilters}
              filterValue={statusFilter}
              onFilterValueChange={setStatusFilter}
              onSearchValueChange={setSearchValue}
              onShowAllColumns={() => undefined}
              searchPlaceholder={`Search ${labelForKind(kind).toLowerCase()}`}
              searchValue={searchValue}
            />

            <MaturityTable
              kind={kind}
              loading={recordsQuery.isFetching}
              records={filteredRecords}
              onDeactivate={(record) => lifecycleMutation.mutate({ action: "deactivate", record })}
              onDrill={drillRecord}
              onEdit={openEditor}
              onForceDelete={setPendingDelete}
              onRestore={(record) => lifecycleMutation.mutate({ action: "restore", record })}
              onSendAutomationMd={(record) => automationMdMutation.mutate({ form: formFromRecord(record, kind), itemKind: kind })}
              onToggleTodo={toggleTodo}
            />
          </>
        )}
      </div>

      <MaturityDialog
        kind={kind}
        loading={saveMutation.isPending || updateMutation.isPending}
        open={dialogOpen}
        record={dialogRecord}
        errorMessage={errorMessage(saveMutation.error ?? updateMutation.error)}
        onClose={() => { setDialogOpen(false); setDialogRecord(null); }}
        lookups={lookups}
        onAskAi={(form) => automationMdMutation.mutate({ form, itemKind: kind })}
        onSubmit={(form) => {
          if (form.id) updateMutation.mutate({ ...form, id: form.id });
          else saveMutation.mutate(form);
        }}
      />

      <ForceDeleteDialog
        deleting={forceDeleteMutation.isPending}
        record={pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => { if (pendingDelete) forceDeleteMutation.mutate(pendingDelete); }}
      />
    </WorkspacePage>
  );
}

export function ProjectManagerDiscussions() {
  return (
    <ProjectManagerMaturity
      availableTabs={discussionTabs}
      description="Standalone decision notes connected to issue reference numbers."
      initialKind="discussions"
      technicalName="page.project-manager.discussions"
      title="Discussions"
    />
  );
}

function WorkStageNav({ activeKind, onSelect }: { activeKind: MaturityKind; onSelect: (kind: MaturityKind) => void }) {
  const stages: Array<{ kind: MaturityKind; label: string }> = [
    { kind: "issues", label: "Issues" },
    { kind: "tasks", label: "Tasks" },
    { kind: "reviews", label: "Reviews" },
    { kind: "automations", label: "Automation" },
    { kind: "activities", label: "Activity" },
    { kind: "todos", label: "Todos" },
    { kind: "timeline", label: "Timeline" },
    { kind: "gantt", label: "Gantt" }
  ];
  return (
    <div className="flex flex-wrap gap-2 border-b border-border/70">
      {stages.map((stage) => (
        <button
          key={stage.kind}
          className={cn("inline-flex h-10 items-center gap-2 border-b-2 px-3 text-sm font-medium", activeKind === stage.kind ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}
          type="button"
          onClick={() => onSelect(stage.kind)}
        >
          <CheckCircle2 className="size-4" />
          {stage.label}
        </button>
      ))}
    </div>
  );
}

function WorkStageHeader({ currentKind }: { currentKind: MaturityKind }) {
  return (
    <div className="border-b border-border/70 pb-2">
      <h1 className="text-xl font-semibold tracking-normal text-foreground/80">{labelForKind(currentKind)}</h1>
    </div>
  );
}

function SimpleTodoList({
  loading,
  records,
  saving,
  onAdd,
  onEdit,
  onForceDelete,
  onMove,
  onToggle
}: {
  loading: boolean;
  records: MaturityRecord[];
  saving: boolean;
  onAdd: (title: string) => void;
  onEdit: (record: MaturityRecord) => void;
  onForceDelete: (record: MaturityRecord) => void;
  onMove: (record: MaturityRecord, direction: "down" | "up") => void;
  onToggle: (record: MaturityRecord, done: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const orderedRecords = useMemo(() => [...records].sort((first, second) => Number(first.sortOrder || 0) - Number(second.sortOrder || 0) || first.title.localeCompare(second.title)), [records]);
  const submit = () => {
    const nextTitle = title.trim();
    if (!nextTitle) return;
    onAdd(nextTitle);
    setTitle("");
  };
  return (
    <section className="rounded-md border border-border bg-card">
      <div className="flex flex-col gap-2 border-b border-border/70 p-3 sm:flex-row">
        <Input
          className="h-9"
          disabled={saving}
          placeholder="Add todo"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") submit();
          }}
        />
        <Button type="button" className="h-9 rounded-md" disabled={saving || !title.trim()} onClick={submit}>
          <Plus className="size-4" />
          Add
        </Button>
      </div>
      <div className="divide-y divide-border/70">
        {orderedRecords.map((record, index) => {
          const done = record.status === "done" || !record.active;
          return (
            <div key={record.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2.5">
              <input
                checked={done}
                className="size-4 rounded border-border"
                type="checkbox"
                onChange={(event) => onToggle(record, event.target.checked)}
              />
              <button type="button" className={cn("min-w-0 text-left text-sm font-medium", done ? "text-muted-foreground line-through" : "text-foreground")} onClick={() => onEdit(record)}>
                {record.title}
              </button>
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-md" disabled={saving || index === 0} title="Move up" onClick={() => onMove(record, "up")}>
                  <ArrowUp className="size-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-md" disabled={saving || index === orderedRecords.length - 1} title="Move down" onClick={() => onMove(record, "down")}>
                  <ArrowDown className="size-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-md text-destructive hover:text-destructive" title="Delete" onClick={() => onForceDelete(record)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          );
        })}
        {orderedRecords.length === 0 ? (
          <div className="px-3 py-10 text-center text-sm text-muted-foreground">{loading ? "Loading todos..." : "No todos yet."}</div>
        ) : null}
      </div>
    </section>
  );
}

function TimelineActivityList({
  loading,
  records,
  saving,
  onEdit,
  onForceDelete,
  onToggleComplete
}: {
  loading: boolean;
  records: MaturityRecord[];
  saving: boolean;
  onEdit: (record: MaturityRecord) => void;
  onForceDelete: (record: MaturityRecord) => void;
  onToggleComplete: (record: MaturityRecord, done: boolean) => void;
}) {
  const orderedRecords = useMemo(() => [...records].sort((first, second) => timelineDate(first).localeCompare(timelineDate(second)) || first.title.localeCompare(second.title)), [records]);
  return (
    <section className="rounded-md border border-border bg-card">
      <div className="grid grid-cols-[1fr_140px_140px_150px_90px] gap-3 border-b border-border/70 bg-muted/40 px-4 py-3 text-xs font-medium uppercase text-muted-foreground">
        <div>Activity</div>
        <div>From</div>
        <div>To</div>
        <div>Status</div>
        <div className="text-right">Action</div>
      </div>
      <div className="divide-y divide-border/70">
        {orderedRecords.map((record) => {
          const completed = ["completed", "done", "released"].includes(record.status) || !record.active;
          return (
            <div key={record.id} className="grid grid-cols-[1fr_140px_140px_150px_90px] items-center gap-3 px-4 py-3 text-sm">
              <button type="button" className="min-w-0 text-left font-medium hover:underline" onClick={() => onEdit(record)}>
                <span className={cn(completed && "text-muted-foreground line-through")}>{record.title}</span>
                {record.eventName ? <div className="mt-1 font-mono text-xs text-muted-foreground">{record.eventName}</div> : null}
              </button>
              <div className="font-mono text-xs text-muted-foreground">{record.startDate || record.dueDate || "-"}</div>
              <div className="font-mono text-xs text-muted-foreground">{record.endDate || record.dueDate || "-"}</div>
              <label className="inline-flex items-center gap-2">
                <input
                  checked={completed}
                  className="size-4 rounded border-border"
                  disabled={saving}
                  type="checkbox"
                  onChange={(event) => onToggleComplete(record, event.target.checked)}
                />
                <WorkspaceStatusBadge label={completed ? "completed" : record.status || "planned"} tone={completed ? "success" : "neutral"} />
              </label>
              <div className="flex justify-end">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-md text-destructive hover:text-destructive" title="Delete" onClick={() => onForceDelete(record)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          );
        })}
        {orderedRecords.length === 0 ? (
          <div className="px-3 py-10 text-center text-sm text-muted-foreground">{loading ? "Loading timeline..." : "No timeline activity yet."}</div>
        ) : null}
      </div>
    </section>
  );
}

function MaturityTable({
  kind,
  loading,
  records,
  onDeactivate,
  onDrill,
  onEdit,
  onForceDelete,
  onRestore,
  onSendAutomationMd,
  onToggleTodo
}: {
  kind: MaturityKind;
  loading: boolean;
  records: MaturityRecord[];
  onDeactivate: (record: MaturityRecord) => void;
  onDrill: (record: MaturityRecord) => void;
  onEdit: (record: MaturityRecord) => void;
  onForceDelete: (record: MaturityRecord) => void;
  onRestore: (record: MaturityRecord) => void;
  onSendAutomationMd: (record: MaturityRecord) => void;
  onToggleTodo: (record: MaturityRecord, done: boolean) => void;
}) {
  const columns = columnsForKind(kind);
  const canDrill = nextStageForKind(kind) !== null;
  return (
    <WorkspaceTablePanel>
      <div className="overflow-x-auto">
        {kind === "kanban" ? <KanbanStrip records={records} /> : null}
        {kind === "gantt" ? <GanttStrip records={records} /> : null}
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
              <Header>#</Header>
              <Header>Title</Header>
              <Header>Reference no</Header>
              {columns.map((column) => <Header key={column.id}>{column.label}</Header>)}
              <Header>Status</Header>
              <Header className="text-right">Action</Header>
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => (
              <tr
                key={record.id}
                className={cn("border-b border-border/70 last:border-b-0 hover:bg-muted/20", !record.active && "bg-muted/20 text-muted-foreground")}
              >
                <td className="px-4 py-2.5 text-muted-foreground">{index + 1}</td>
                <td className="px-4 py-2.5">
                  {kind === "todos" ? (
                    <label className="inline-flex cursor-pointer items-center gap-2 font-medium">
                      <input
                        checked={record.status === "done" || !record.active}
                        className="size-4 rounded border-border"
                        type="checkbox"
                        onChange={(event) => onToggleTodo(record, event.target.checked)}
                      />
                      <span className={cn(record.status === "done" || !record.active ? "text-muted-foreground line-through" : "text-foreground")}>{record.title}</span>
                    </label>
                  ) : (
                    <button
                      type="button"
                      className={cn("font-medium hover:underline", !canDrill && "cursor-default hover:no-underline")}
                      onClick={() => {
                        if (canDrill) onDrill(record);
                      }}
                    >
                      {record.title}
                    </button>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <button
                    type="button"
                    className="font-mono text-xs text-muted-foreground hover:text-foreground hover:underline"
                    onClick={() => onEdit(record)}
                  >
                    {referenceNoForRecord(kind, record)}
                  </button>
                </td>
                {columns.map((column) => <td key={column.id} className="px-4 py-2.5 text-muted-foreground">{cell(record, column.id)}</td>)}
                <td className="px-4 py-2.5">
                  <WorkspaceStatusBadge label={record.status || (record.active ? "active" : "inactive")} tone={record.active ? "success" : "danger"} />
                </td>
                <td className="px-4 py-1.5 text-right">
                  <div onClick={(event) => event.stopPropagation()}>
                  <WorkspaceRowActions
                    title={record.title}
                    deleteLabel="Deactivate"
                    isSuspended={!record.active}
                    restoreLabel="Restore"
                    onDelete={() => onDeactivate(record)}
                    onEdit={() => onEdit(record)}
                    onRestore={() => onRestore(record)}
                    onView={() => onDrill(record)}
                    actions={[
                      { id: "automation-md", icon: <Bot className="size-4" />, label: "Ask AI", onSelect: () => onSendAutomationMd(record) },
                      { id: "force-delete", icon: <Trash2 className="size-4" />, label: "Force delete", tone: "destructive", onSelect: () => onForceDelete(record) }
                    ]}
                  />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {records.length === 0 && loading ? <WorkspaceTableSkeletonRows columns={columns.length + 5} /> : null}
      {records.length === 0 && !loading ? <WorkspaceTableEmptyState>No {labelForKind(kind).toLowerCase()} records found.</WorkspaceTableEmptyState> : null}
    </WorkspaceTablePanel>
  );
}

function MaturityDialog({
  errorMessage,
  kind,
  loading,
  lookups,
  open,
  record,
  onClose,
  onAskAi,
  onSubmit
}: {
  errorMessage?: string;
  kind: MaturityKind;
  loading: boolean;
  lookups: ReferenceLookups;
  open: boolean;
  record: MaturityRecord | null;
  onClose: () => void;
  onAskAi: (form: MaturityForm) => void;
  onSubmit: (form: MaturityForm) => void;
}) {
  const [form, setForm] = useState<MaturityForm>(() => formFromRecord(record, kind));
  const [localBanner, setLocalBanner] = useState("");

  useEffect(() => {
    setForm(formFromRecord(record, kind));
    setLocalBanner("");
  }, [record, open, kind]);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden rounded-md border-border/70 p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-border/70 px-5 py-4">
          <DialogTitle>{record ? `Edit ${labelForKind(kind).toLowerCase()}` : `New ${labelForKind(kind).toLowerCase()}`}</DialogTitle>
          <DialogDescription>Maintain assignment, traceability, automation, release, and governance details.</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (!form.title.trim()) {
              setLocalBanner("Title is required.");
              return;
            }
            setLocalBanner("");
            onSubmit(prepareMaturitySubmit(form, kind));
          }}
        >
          <div className="max-h-[68vh] overflow-y-auto px-5 py-4">
            {localBanner || errorMessage ? (
              <WorkspaceFormBanner title={localBanner ? "Missing required field" : "Could not save"}>{localBanner || errorMessage}</WorkspaceFormBanner>
            ) : null}
            <WorkspaceFormGrid columns={1}>
              <WorkspaceFormField label="Title" required>
                <Input className="h-11 rounded-md" value={form.title} onChange={(event) => updateForm(setForm, { title: event.target.value }, setLocalBanner)} />
              </WorkspaceFormField>
              {fieldsForKind(kind).map((field) => <MaturityField key={field} field={field} form={form} lookups={lookups} setForm={setForm} setLocalBanner={setLocalBanner} />)}
              <WorkspaceFormField label="Summary">
                <WorkspaceEditor content={form.richNotes} onChange={(value) => updateForm(setForm, { richNotes: value }, setLocalBanner)} placeholder="" />
              </WorkspaceFormField>
              <div className={cn("flex min-h-14 items-center justify-between rounded-md border px-4 py-3", form.active ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-border bg-muted/40 text-muted-foreground")}>
                <span className="text-sm font-semibold"><CheckCircle2 className="mr-2 inline size-4" />Active</span>
                <Switch checked={form.active} onCheckedChange={(checked) => updateForm(setForm, { active: checked }, setLocalBanner)} />
              </div>
            </WorkspaceFormGrid>
          </div>
          <DialogFooter className="border-t border-border/70 px-5 py-4 sm:justify-start">
            <Button
              type="button"
              variant="outline"
              className="rounded-md"
              disabled={loading}
              onClick={() => {
                if (!form.title.trim()) {
                  setLocalBanner("Title is required.");
                  return;
                }
                setLocalBanner("");
                onAskAi(prepareMaturitySubmit(form, kind));
              }}
            >
              <Bot className="size-4" />
              Ask AI
            </Button>
            <Button type="submit" disabled={loading} className="rounded-md bg-foreground text-background hover:bg-foreground/90">
              <Save className="size-4" />
              {loading ? "Saving..." : record ? "Update" : "Save"}
            </Button>
            <Button type="button" variant="outline" className="rounded-md" onClick={onClose}>
              <X className="size-4" />
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MaturityUpsertPage({
  draft,
  errorMessage,
  kind,
  loading,
  lookups,
  record,
  onBack,
  onAskAi,
  onNextStage,
  onSubmit
}: {
  draft?: Partial<MaturityRecord> | null;
  errorMessage?: string;
  kind: MaturityKind;
  loading: boolean;
  lookups: ReferenceLookups;
  record: MaturityRecord | null;
  onBack: () => void;
  onAskAi: (form: MaturityForm) => void;
  onNextStage: (kind: MaturityKind, form: MaturityForm) => void;
  onSubmit: (form: MaturityForm) => void;
}) {
  const [form, setForm] = useState<MaturityForm>(() => formFromRecord(record, kind, draft ?? undefined));
  const [localBanner, setLocalBanner] = useState("");
  const metaFields = metadataFieldsForKind(kind);
  const nextStage = nextStageForKind(kind);

  useEffect(() => {
    setForm(formFromRecord(record, kind, draft ?? undefined));
    setLocalBanner("");
  }, [draft, kind, record]);

  return (
    <WorkspacePage
      title={record ? form.title || `Edit ${labelForKind(kind).toLowerCase()}` : `Create new ${singularLabelForKind(kind)}`}
      description=""
      technicalName={`page.project-manager.${kind}.upsert`}
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-md"
            disabled={loading}
            onClick={() => {
              if (!form.title.trim()) {
                setLocalBanner("Title is required.");
                return;
              }
              setLocalBanner("");
              onAskAi(prepareMaturitySubmit(form, kind));
            }}
          >
            <Bot className="size-4" />
            Ask AI
          </Button>
          {nextStage ? (
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-md"
              disabled={loading}
              onClick={() => {
                if (!form.title.trim()) {
                  setLocalBanner("Title is required.");
                  return;
                }
                onNextStage(nextStage.kind, prepareMaturitySubmit(form, kind));
              }}
            >
              {nextStage.label}
            </Button>
          ) : null}
          <Button type="button" variant="outline" className="h-9 rounded-md" onClick={onBack}>
            <X className="size-4" />
            Cancel
          </Button>
        </>
      }
    >
      <form
        noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (!form.title.trim()) {
              setLocalBanner("Title is required.");
              return;
            }
            setLocalBanner("");
            onSubmit(prepareMaturitySubmit(form, kind));
          }}
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-4">
            {localBanner || errorMessage ? (
              <WorkspaceFormBanner title={localBanner ? "Missing required field" : "Could not save"}>{localBanner || errorMessage}</WorkspaceFormBanner>
            ) : null}
            <WorkspaceFormField label="Title" required>
              <Input
                autoFocus
                className="h-11 rounded-md text-base"
                placeholder={`Add a ${singularLabelForKind(kind)} title`}
                value={form.title}
                onChange={(event) => updateForm(setForm, { title: event.target.value }, setLocalBanner)}
              />
            </WorkspaceFormField>
            <WorkspaceTablePanel>
              <div className="border-b border-border/70 px-4 py-3">
                <div className="text-sm font-semibold text-foreground">Summary</div>
              </div>
              <div className="p-4">
                <WorkspaceEditor
                  content={form.richNotes}
                  onChange={(value) => updateForm(setForm, { richNotes: value }, setLocalBanner)}
                  placeholder=""
                />
              </div>
            </WorkspaceTablePanel>
            <div className="flex flex-wrap justify-end gap-2 border-t border-border/70 pt-4">
              <Button
                type="button"
                variant="outline"
                className="rounded-md"
                disabled={loading}
                onClick={() => {
                  if (!form.title.trim()) {
                    setLocalBanner("Title is required.");
                    return;
                  }
                  setLocalBanner("");
                  onAskAi(prepareMaturitySubmit(form, kind));
                }}
              >
                <Bot className="size-4" />
                Ask AI
              </Button>
              <Button type="button" variant="outline" className="rounded-md" onClick={onBack}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="rounded-md bg-foreground text-background hover:bg-foreground/90">
                <Save className="size-4" />
                {loading ? "Saving..." : record ? "Update" : "Create"}
              </Button>
            </div>
          </div>
          <aside className="space-y-1">
            {metaFields.map((field) => (
              <SidebarField key={field} title={fieldLabel(field)}>
                <MaturityField field={field} form={form} lookups={lookups} setForm={setForm} setLocalBanner={setLocalBanner} compact />
              </SidebarField>
            ))}
            <SidebarField title="Record state">
              <div className={cn("flex min-h-11 items-center justify-between rounded-md border px-3 py-2", form.active ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-border bg-muted/40 text-muted-foreground")}>
                <span className="text-sm font-semibold"><CheckCircle2 className="mr-2 inline size-4" />Active</span>
                <Switch checked={form.active} onCheckedChange={(checked) => updateForm(setForm, { active: checked }, setLocalBanner)} />
              </div>
            </SidebarField>
          </aside>
        </div>
      </form>
    </WorkspacePage>
  );
}

function SidebarField({ children, required, title }: { children: React.ReactNode; required?: boolean; title: string }) {
  return (
    <section className="border-b border-border/70 py-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-foreground">{title}{required ? <span className="ml-1 text-destructive">*</span> : null}</div>
      </div>
      {children}
    </section>
  );
}

function MaturityField({ compact = false, field, form, lookups, setForm, setLocalBanner }: { compact?: boolean; field: keyof MaturityForm; form: MaturityForm; lookups: ReferenceLookups; setForm: React.Dispatch<React.SetStateAction<MaturityForm>>; setLocalBanner: (value: string) => void }) {
  const options = lookupOptionsForField(field, lookups);
  const fixedOptions = optionsForField(field).map((value) => ({ value, label: value }));
  const control = ["dueDate", "endDate", "startDate"].includes(field) ? (
    <WorkspaceDatePicker value={String(form[field] ?? "")} placeholder={`Select ${fieldLabel(field).toLowerCase()}`} onValueChange={(value) => updateForm(setForm, { [field]: value } as Partial<MaturityForm>, setLocalBanner)} />
  ) : field === "labels" ? (
    <MaturityTagsField value={form.labels} onChange={(labels) => updateForm(setForm, { labels }, setLocalBanner)} />
  ) : isLookupField(field) ? (
    <WorkspaceAutocomplete
      createLabel="Use value"
      options={options}
      placeholder={`Select ${fieldLabel(field).toLowerCase()}`}
      value={String(form[field] ?? "")}
      onChange={(value, option) => {
        const patch: Partial<MaturityForm> = { [field]: value ?? "" } as Partial<MaturityForm>;
        if (field === "moduleId") {
          const moduleOption = option as (typeof lookups.moduleOptions[number] | undefined);
          patch.moduleKey = moduleOption?.moduleKey ?? "";
          patch.moduleGroupKey = moduleOption?.groupKey ?? "";
          patch.platformKey = moduleOption?.platformKey ?? "";
        }
        updateForm(setForm, patch, setLocalBanner);
      }}
      onCreate={(query) => updateForm(setForm, { [field]: query } as Partial<MaturityForm>, setLocalBanner)}
    />
  ) : fixedOptions.length ? (
    <WorkspaceSelect
      options={fixedOptions}
      placeholder={`Select ${fieldLabel(field).toLowerCase()}`}
      value={String(form[field] ?? "")}
      onValueChange={(value) => updateForm(setForm, { [field]: value } as Partial<MaturityForm>, setLocalBanner)}
    />
  ) : (
    <Input className="h-10 rounded-md font-mono" value={String(form[field] ?? "")} onChange={(event) => updateForm(setForm, { [field]: event.target.value } as Partial<MaturityForm>, setLocalBanner)} />
  );

  if (compact) return control;

  return (
    <WorkspaceFormField label={fieldLabel(field)}>
      {control}
    </WorkspaceFormField>
  );
}

function MaturityTagsField({ onChange, value }: { onChange: (value: string) => void; value: string }) {
  const [draft, setDraft] = useState("");
  const tags = value.split(",").map((label) => label.trim()).filter(Boolean);

  function commit(next = draft) {
    const clean = next.trim().replace(/,$/, "");
    if (!clean) return;
    const merged = Array.from(new Set([...tags, clean]));
    onChange(merged.join(", "));
    setDraft("");
  }

  function remove(tag: string) {
    onChange(tags.filter((item) => item !== tag).join(", "));
  }

  return (
    <div className="space-y-2">
      <div className="flex min-h-10 flex-wrap gap-1 rounded-md border border-border bg-background p-1.5">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex h-7 items-center gap-1 rounded-md bg-muted px-2 text-xs font-medium">
            {tag}
            <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => remove(tag)} aria-label={`Remove ${tag}`}>
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          className="h-7 min-w-28 flex-1 bg-transparent px-1 text-sm outline-none"
          placeholder={tags.length ? "Add tag" : "Add tags"}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => commit()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              commit();
            }
            if (event.key === "Backspace" && !draft && tags.length) {
              const lastTag = tags[tags.length - 1];
              if (lastTag) remove(lastTag);
            }
          }}
        />
      </div>
    </div>
  );
}

function ForceDeleteDialog({ deleting, record, onClose, onConfirm }: { deleting: boolean; record: MaturityRecord | null; onClose: () => void; onConfirm: () => void }) {
  const [confirmText, setConfirmText] = useState("");
  const canDelete = confirmText.trim().toUpperCase() === "DELETE";
  return (
    <Dialog open={Boolean(record)} onOpenChange={(nextOpen) => { if (!nextOpen) { setConfirmText(""); onClose(); } }}>
      <DialogContent className="rounded-md border-border/70 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Force delete record</DialogTitle>
          <DialogDescription>This permanently deletes {record?.title ?? "this record"}. Type DELETE to confirm.</DialogDescription>
        </DialogHeader>
        <Input className="h-11 rounded-md" value={confirmText} onChange={(event) => setConfirmText(event.target.value)} />
        <DialogFooter>
          <Button type="button" variant="outline" className="rounded-md" disabled={deleting} onClick={() => { setConfirmText(""); onClose(); }}>Cancel</Button>
          <Button type="button" variant="destructive" className="rounded-md" disabled={!canDelete || deleting || !record} onClick={onConfirm}>{deleting ? "Deleting..." : "Force delete"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KanbanStrip({ records }: { records: MaturityRecord[] }) {
  const lanes = ["Backlog", "Ready", "Assigned", "In Progress", "Blocked", "Review", "QA", "Done"];
  return (
    <div className="grid gap-2 border-b border-border/70 bg-muted/20 p-3 sm:grid-cols-4 lg:grid-cols-8">
      {lanes.map((lane) => (
        <div key={lane} className="rounded-md border border-border bg-background px-2 py-2 text-xs">
          <div className="font-semibold">{lane}</div>
          <div className="mt-1 text-muted-foreground">{records.filter((record) => record.lane === lane).length} cards</div>
        </div>
      ))}
    </div>
  );
}

function GanttStrip({ records }: { records: MaturityRecord[] }) {
  const planned = records.filter((record) => timelineDate(record)).sort((first, second) => timelineDate(first).localeCompare(timelineDate(second)) || first.title.localeCompare(second.title));
  const rows = planned.length ? planned : records;
  const dates = ganttDates(rows);
  const todayIndex = dates.findIndex((date) => date === todayKey());
  return (
    <div className="border-b border-border/70 bg-background">
      <div className="grid min-w-[1120px] grid-cols-[260px_88px_88px_58px_58px_minmax(520px,1fr)] text-xs">
        <div className="border-b border-r border-border/70 bg-muted/40 px-3 py-2 font-semibold uppercase text-muted-foreground">Name</div>
        <div className="border-b border-r border-border/70 bg-muted/40 px-2 py-2 font-semibold uppercase text-muted-foreground">Start</div>
        <div className="border-b border-r border-border/70 bg-muted/40 px-2 py-2 font-semibold uppercase text-muted-foreground">End</div>
        <div className="border-b border-r border-border/70 bg-muted/40 px-2 py-2 text-center font-semibold uppercase text-muted-foreground">Days</div>
        <div className="border-b border-r border-border/70 bg-muted/40 px-2 py-2 text-center font-semibold uppercase text-muted-foreground">Work</div>
        <div className="relative border-b border-border/70 bg-muted/40">
          <div className="grid h-full" style={{ gridTemplateColumns: `repeat(${dates.length}, minmax(26px, 1fr))` }}>
            {dates.map((date) => (
              <div key={date} className="border-r border-border/60 px-1 py-1 text-center">
                <div className="text-[10px] font-semibold uppercase text-muted-foreground">{weekday(date)}</div>
                <div className="font-mono text-[10px] text-foreground">{dayNumber(date)}</div>
              </div>
            ))}
          </div>
        </div>
        {rows.map((record, index) => {
          const start = record.startDate || record.dueDate || dates[0] || "";
          const end = record.endDate || record.dueDate || start;
          const startIndex = Math.max(0, dates.indexOf(start));
          const endIndex = Math.max(startIndex, dates.indexOf(end));
          const span = Math.max(1, endIndex - startIndex + 1);
          const days = ganttDays(start, end);
          const completed = completionPercent(record);
          return (
            <div key={record.id} className={cn("contents", index % 2 === 0 ? "bg-card" : "bg-muted/20")}>
              <div className="border-b border-r border-border/60 px-3 py-2 font-medium">{record.title}</div>
              <div className="border-b border-r border-border/60 px-2 py-2 font-mono text-[11px] text-muted-foreground">{start || "-"}</div>
              <div className="border-b border-r border-border/60 px-2 py-2 font-mono text-[11px] text-muted-foreground">{end || "-"}</div>
              <div className="border-b border-r border-border/60 px-2 py-2 text-center">{days}</div>
              <div className="border-b border-r border-border/60 px-2 py-2 text-center">{completed}%</div>
              <div className="relative border-b border-border/60">
                <div className="grid min-h-9" style={{ gridTemplateColumns: `repeat(${dates.length}, minmax(26px, 1fr))` }}>
                  {dates.map((date) => <div key={`${record.id}-${date}`} className="border-r border-border/40" />)}
                </div>
                <svg className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox={`0 0 ${dates.length} 1`}>
                  {todayIndex >= 0 ? <line x1={todayIndex + 0.5} x2={todayIndex + 0.5} y1="0" y2="1" stroke="rgb(239 68 68)" strokeWidth="0.03" /> : null}
                  <rect x={startIndex + 0.08} y="0.3" width={Math.max(0.84, span - 0.16)} height="0.4" rx="0.08" fill={record.status === "blocked" ? "rgb(239 68 68)" : "rgb(2 132 199)"} />
                  <rect x={startIndex + 0.08} y="0.3" width={Math.max(0, (span - 0.16) * (completed / 100))} height="0.4" rx="0.08" fill="rgb(34 197 94)" opacity="0.85" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
      {rows.length === 0 ? <div className="px-3 py-10 text-center text-sm text-muted-foreground">No schedule records yet.</div> : null}
    </div>
  );
}

function columnsForKind(kind: MaturityKind) {
  const referenceColumns = [{ id: "platformKey", label: "Platform" }, { id: "moduleGroupKey", label: "Group" }, { id: "moduleKey", label: "Module" }];
  if (kind === "pull-requests") return [{ id: "githubBranch", label: "Branch" }, { id: "githubPr", label: "PR" }, { id: "reviewer", label: "Reviewer" }, ...referenceColumns];
  if (kind === "agents") return [{ id: "actor", label: "Agent" }, { id: "referenceType", label: "Ref type" }, { id: "referenceId", label: "Ref id" }, ...referenceColumns];
  if (kind === "discussions") return [{ id: "referenceId", label: "Reference no" }, { id: "type", label: "Topic" }, { id: "assignee", label: "Owner" }, ...referenceColumns, { id: "priority", label: "Priority" }];
  if (kind === "actions") return [{ id: "command", label: "Command" }, { id: "eventName", label: "Event" }, { id: "actor", label: "Actor" }, ...referenceColumns];
  if (kind === "security-quality") return [{ id: "type", label: "Area" }, { id: "severity", label: "Severity" }, { id: "ownerTeam", label: "Owner" }, ...referenceColumns];
  if (kind === "github") return [{ id: "githubBranch", label: "Branch" }, { id: "githubCommit", label: "Commit" }, { id: "githubPr", label: "PR" }, ...referenceColumns];
  if (kind === "releases" || kind === "changelog") return [{ id: "version", label: "Version" }, { id: "type", label: "Type" }, { id: "ownerTeam", label: "Owner" }, ...referenceColumns];
  if (kind === "automations") return [{ id: "command", label: "Command" }, { id: "eventName", label: "Event" }, { id: "actor", label: "Actor" }, ...referenceColumns];
  if (kind === "timeline") return [{ id: "eventName", label: "Event" }, { id: "startDate", label: "From" }, { id: "endDate", label: "To" }, { id: "referenceType", label: "Ref type" }, ...referenceColumns];
  if (kind === "activities") return [{ id: "eventName", label: "Event" }, { id: "actor", label: "Actor" }, { id: "referenceType", label: "Ref type" }, ...referenceColumns];
  if (kind === "reviews") return [{ id: "reviewer", label: "Reviewer" }, { id: "referenceType", label: "Ref type" }, ...referenceColumns, { id: "priority", label: "Priority" }];
  if (kind === "gantt") return [{ id: "startDate", label: "Start" }, { id: "endDate", label: "End" }, { id: "assignee", label: "Owner" }, ...referenceColumns, { id: "priority", label: "Priority" }];
  if (kind === "todos") return [{ id: "priority", label: "Priority" }, { id: "dueDate", label: "Due" }, { id: "labels", label: "Tags" }];
  if (kind === "kanban") return [{ id: "lane", label: "Lane" }, { id: "assignee", label: "Assignee" }, ...referenceColumns, { id: "priority", label: "Priority" }];
  return [{ id: "type", label: "Type" }, { id: "assignee", label: "Assignee" }, ...referenceColumns, { id: "priority", label: "Priority" }];
}

function fieldsForKind(kind: MaturityKind): Array<keyof MaturityForm> {
  const references: Array<keyof MaturityForm> = ["platformKey", "moduleGroupKey", "moduleId", "moduleKey"];
  const base: Array<keyof MaturityForm> = ["type", "status", ...references, "ownerTeam", "priority", "sortOrder"];
  if (kind === "pull-requests") return ["githubBranch", "githubCommit", "githubPr", "githubUrl", "reviewer", "status", ...references, "referenceType", "referenceId", "version", "sortOrder"];
  if (kind === "agents") return ["actor", "eventName", "referenceType", "referenceId", ...references, "status", "sortOrder"];
  if (kind === "discussions") return ["referenceId", "assignee", "labels", "type", "status", ...references, "priority", "dueDate", "sortOrder"];
  if (kind === "actions") return ["command", "eventName", "actor", ...references, "referenceType", "referenceId", "status", "sortOrder"];
  if (kind === "security-quality") return ["type", "severity", "status", "ownerTeam", ...references, "referenceType", "referenceId", "priority", "dueDate", "sortOrder"];
  if (kind === "github") return ["githubBranch", "githubCommit", "githubPr", "githubIssue", "githubUrl", ...references, "referenceType", "referenceId", "version", "sortOrder"];
  if (kind === "automations") return ["command", "status", "referenceId"];
  if (kind === "changelog" || kind === "releases") return ["version", "type", "status", "ownerTeam", ...references, "githubPr", "githubCommit", "sortOrder"];
  if (kind === "issues") return ["assignee", "reviewer", "labels", "type", "status", "priority", "severity", "moduleId", "dueDate"];
  if (kind === "tasks") return ["assignee", "status", "priority", "dueDate", "referenceId"];
  if (kind === "reviews") return ["reviewer", "status", "dueDate", "referenceId"];
  if (kind === "gantt") return ["assignee", "status", "priority", "startDate", "endDate", "referenceId"];
  if (kind === "kanban") return ["lane", "assignee", "type", "status", ...references, "priority", "dueDate", "sortOrder"];
  if (kind === "activities") return ["eventName", "actor", "status", "referenceId"];
  if (kind === "timeline") return ["eventName", "actor", "startDate", "endDate", "status", "referenceId"];
  if (kind === "todos") return ["status", "priority", "dueDate", "labels", "sortOrder"];
  return ["assignee", "reviewer", "severity", "dueDate", "labels", ...base];
}

function metadataFieldsForKind(kind: MaturityKind): Array<keyof MaturityForm> {
  const references: Array<keyof MaturityForm> = ["platformKey", "moduleGroupKey", "moduleId"];
  if (kind === "pull-requests") return ["githubBranch", "githubPr", "githubCommit", "githubUrl", "reviewer", "status", ...references, "referenceType", "referenceId", "version"];
  if (kind === "agents") return ["actor", "eventName", "status", ...references, "referenceType", "referenceId"];
  if (kind === "discussions") return ["referenceId", "assignee", "labels", "type", "status", "priority", ...references, "dueDate"];
  if (kind === "actions") return ["command", "eventName", "actor", "status", ...references, "referenceType", "referenceId"];
  if (kind === "security-quality") return ["type", "severity", "status", "ownerTeam", "priority", ...references, "referenceType", "referenceId", "dueDate"];
  if (kind === "issues") return ["assignee", "reviewer", "labels", "type", "status", "priority", "severity", "moduleId", "dueDate"];
  if (kind === "tasks") return ["assignee", "status", "priority", "dueDate", "referenceId"];
  if (kind === "reviews") return ["reviewer", "status", "dueDate", "referenceId"];
  if (kind === "automations") return ["command", "status", "referenceId"];
  if (kind === "activities") return ["eventName", "actor", "status", "referenceId"];
  if (kind === "timeline") return ["eventName", "actor", "startDate", "endDate", "status", "referenceId"];
  if (kind === "gantt") return ["assignee", "status", "priority", "startDate", "endDate", "referenceId"];
  if (kind === "todos") return ["status", "priority", "dueDate", "labels"];
  if (kind === "kanban") return ["lane", "assignee", "type", "status", "priority", ...references, "dueDate"];
  if (kind === "changelog") return ["version", "type", "status", "ownerTeam", ...references, "githubPr", "githubCommit"];
  if (kind === "releases") return ["version", "status", "ownerTeam", ...references, "githubPr", "githubCommit"];
  if (kind === "coverage") return ["type", "status", "ownerTeam", "priority", ...references, "referenceType", "referenceId"];
  return fieldsForKind(kind).filter((field) => !["moduleKey", "sortOrder"].includes(field));
}

function lookupOptionsForField(field: keyof MaturityForm, lookups: ReferenceLookups) {
  if (field === "platformKey") return lookups.platformOptions;
  if (field === "moduleGroupKey") return lookups.groupOptions;
  if (field === "moduleId") return lookups.moduleOptions;
  if (field === "referenceId") return lookups.issueOptions;
  return optionsForField(field).map((value) => ({ value, label: value }));
}

function isLookupField(field: keyof MaturityForm) {
  return ["platformKey", "moduleGroupKey", "moduleId", "referenceId", "githubPr", "githubIssue", "githubUrl", "githubBranch", "githubCommit", "command", "eventName", "actor", "assignee", "reviewer", "ownerTeam", "version"].includes(field);
}

function optionsForField(field: keyof MaturityForm) {
  if (field === "status") return ["open", "planned", "draft", "ready", "assigned", "in-progress", "blocked", "in-review", "changes-requested", "approved", "merged", "qa", "needs-review", "resolved", "done", "active", "released", "cancelled"];
  if (field === "priority") return ["low", "medium", "high", "critical"];
  if (field === "severity") return ["low", "medium", "high", "critical"];
  if (field === "lane") return ["Backlog", "Ready", "Assigned", "In Progress", "Blocked", "Review", "QA", "Done"];
  if (field === "type") return ["feature", "bug", "enhancement", "discussion", "decision", "architecture", "chore", "refactor", "test", "docs", "release", "research", "automation", "api", "database", "security", "quality", "performance", "dependency"];
  if (field === "referenceType") return ["platform", "module-group", "module", "feature", "action", "api", "screen", "database", "task", "issue", "pull-request", "discussion", "release", "automation", "coverage"];
  return [];
}

function labelForKind(kind: MaturityKind) {
  return tabs.find((tab) => tab.kind === kind)?.label ?? kind;
}

function singularLabelForKind(kind: MaturityKind) {
  const labels: Partial<Record<MaturityKind, string>> = {
    actions: "action",
    agents: "agent note",
    activities: "activity",
    automations: "automation",
    changelog: "changelog entry",
    coverage: "coverage item",
    discussions: "discussion",
    github: "GitHub reference",
    gantt: "Gantt item",
    issues: "issue",
    kanban: "kanban card",
    "pull-requests": "pull request",
    releases: "release",
    reviews: "review",
    "security-quality": "security and quality item",
    tasks: "task",
    timeline: "timeline event",
    todos: "todo"
  };
  return labels[kind] ?? kind;
}

function nextStageForKind(kind: MaturityKind): { kind: MaturityKind; label: string } | null {
  const chain: Array<{ current: MaturityKind; kind: MaturityKind; label: string }> = [
    { current: "issues", kind: "tasks", label: "Task" },
    { current: "tasks", kind: "reviews", label: "Review" },
    { current: "reviews", kind: "automations", label: "Automation" },
    { current: "automations", kind: "activities", label: "Activity" }
  ];
  return chain.find((item) => item.current === kind) ?? null;
}

function fieldLabel(field: keyof MaturityForm) {
  const labels: Partial<Record<keyof MaturityForm, string>> = {
    dueDate: "Due date",
    endDate: "To date",
    eventName: "Event name",
    githubBranch: "GitHub branch",
    githubCommit: "GitHub commit",
    githubIssue: "GitHub issue",
    githubPr: "GitHub PR",
    githubUrl: "GitHub URL",
    moduleGroupKey: "Module group",
    moduleId: "Module lookup",
    moduleKey: "Module key",
    ownerTeam: "Owner/team",
    platformKey: "Platform",
    referenceId: "Reference no",
    referenceType: "Reference type",
    richNotes: "Notes",
    sortOrder: "Order",
    startDate: "From date"
  };
  return labels[field] ?? field;
}

function cell(record: MaturityRecord, id: string) {
  const value = record[id as keyof MaturityRecord];
  if (Array.isArray(value)) return value.length ? value.join(", ") : "-";
  return value ? String(value) : "-";
}

function referenceNoForRecord(kind: MaturityKind, record: MaturityRecord) {
  return record.referenceId || record.key;
}

function timelineDate(record: MaturityRecord) {
  return record.startDate || record.endDate || record.dueDate || "";
}

function ganttDates(records: MaturityRecord[]) {
  const starts = records.map((record) => record.startDate || record.dueDate).filter(Boolean);
  const ends = records.map((record) => record.endDate || record.dueDate || record.startDate).filter(Boolean);
  const first = parseDate(starts.sort()[0] ?? todayKey());
  const last = parseDate(ends.sort().at(-1) ?? starts.sort().at(-1) ?? todayKey());
  const start = addDays(first, -2);
  const end = addDays(last < first ? first : last, 4);
  const dates: string[] = [];
  for (let cursor = start; cursor <= end && dates.length < 42; cursor = addDays(cursor, 1)) {
    dates.push(formatDateKey(cursor));
  }
  return dates.length ? dates : [todayKey()];
}

function ganttDays(start: string, end: string) {
  if (!start && !end) return 0;
  const first = parseDate(start || end);
  const last = parseDate(end || start);
  return Math.max(1, Math.round((last.getTime() - first.getTime()) / 86400000) + 1);
}

function completionPercent(record: MaturityRecord) {
  if (["completed", "done", "released"].includes(record.status) || !record.active) return 100;
  if (record.status === "in-progress" || record.status === "active") return 50;
  if (record.status === "blocked") return 25;
  return 0;
}

function todayKey() {
  return formatDateKey(new Date());
}

function weekday(date: string) {
  return parseDate(date).toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1);
}

function dayNumber(date: string) {
  return parseDate(date).getDate();
}

function parseDate(value: string) {
  const parsed = value ? new Date(`${value}T00:00:00`) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formFromRecord(record: MaturityRecord | null, kind: MaturityKind, draft?: Partial<MaturityRecord>): MaturityForm {
  return {
    active: record?.active ?? draft?.active ?? true,
    actor: record?.actor ?? draft?.actor ?? "",
    assignee: record?.assignee ?? draft?.assignee ?? "",
    command: record?.command ?? draft?.command ?? "",
    description: record?.description ?? draft?.description ?? "",
    dueDate: record?.dueDate ?? draft?.dueDate ?? "",
    endDate: record?.endDate ?? draft?.endDate ?? "",
    eventName: record?.eventName ?? draft?.eventName ?? "",
    githubBranch: record?.githubBranch ?? draft?.githubBranch ?? "",
    githubCommit: record?.githubCommit ?? draft?.githubCommit ?? "",
    githubIssue: record?.githubIssue ?? draft?.githubIssue ?? "",
    githubPr: record?.githubPr ?? draft?.githubPr ?? "",
    githubUrl: record?.githubUrl ?? draft?.githubUrl ?? "",
    ...(record ? { id: record.id } : {}),
    key: record?.key ?? draft?.key ?? "",
    kind,
    labels: record?.labels?.join(", ") ?? draft?.labels?.join(", ") ?? "",
    lane: record?.lane ?? draft?.lane ?? (kind === "kanban" ? "Backlog" : ""),
    moduleGroupKey: record?.moduleGroupKey ?? draft?.moduleGroupKey ?? "",
    moduleId: record?.moduleId ?? draft?.moduleId ?? "",
    moduleKey: record?.moduleKey ?? draft?.moduleKey ?? "",
    ownerTeam: record?.ownerTeam ?? draft?.ownerTeam ?? "",
    platformKey: record?.platformKey ?? draft?.platformKey ?? "",
    priority: record?.priority ?? draft?.priority ?? "medium",
    referenceId: record?.referenceId ?? draft?.referenceId ?? "",
    referenceType: record?.referenceType ?? draft?.referenceType ?? "",
    reviewer: record?.reviewer ?? draft?.reviewer ?? "",
    richNotes: record?.richNotes ?? draft?.richNotes ?? "",
    severity: record?.severity ?? draft?.severity ?? "",
    sortOrder: record ? String(record.sortOrder) : String(draft?.sortOrder ?? 0),
    startDate: record?.startDate ?? draft?.startDate ?? "",
    status: record?.status ?? draft?.status ?? "open",
    title: record?.title ?? draft?.title ?? "",
    type: record?.type ?? draft?.type ?? "",
    version: record?.version ?? draft?.version ?? ""
  };
}

function maturityPayload(form: MaturityForm) {
  return {
    ...form,
    labels: form.labels.split(",").map((label) => label.trim()).filter(Boolean),
    sortOrder: Number(form.sortOrder) || 0
  };
}

function prepareMaturitySubmit(form: MaturityForm, kind: MaturityKind): MaturityForm {
  const key = form.key.trim() || `${kind}.${slugKey(form.title)}.${Date.now()}`;
  const referenceId = kind === "issues" ? key : form.referenceId.trim() || key;
  const referenceType = kind === "issues" ? "issue" : form.referenceType.trim() || "issue";
  return { ...form, key, referenceId, referenceType };
}

function childDraftForStage(kind: MaturityKind, parent: MaturityRecord, parentKind: MaturityKind): Partial<MaturityRecord> {
  const title = `${parent.title} - ${singularLabelForKind(kind)}`;
  return {
    active: true,
    assignee: parent.assignee,
    dueDate: parent.dueDate,
    endDate: parent.endDate || parent.dueDate,
    labels: parent.labels,
    moduleGroupKey: parent.moduleGroupKey,
    moduleId: parent.moduleId,
    moduleKey: parent.moduleKey,
    ownerTeam: parent.ownerTeam,
    platformKey: parent.platformKey,
    priority: parent.priority,
    referenceId: parent.key,
    referenceType: singularLabelForKind(parentKind),
    reviewer: parent.reviewer,
    startDate: parent.startDate || parent.dueDate,
    status: defaultStatusForKind(kind),
    title,
    type: parent.type
  };
}

function defaultStatusForKind(kind: MaturityKind) {
  if (kind === "tasks") return "assigned";
  if (kind === "reviews") return "in-review";
  if (kind === "automations") return "ready";
  if (kind === "activities") return "active";
  if (kind === "timeline") return "planned";
  if (kind === "gantt") return "planned";
  return "open";
}

function slugKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "") || "record";
}

function inferReferenceFromCommand(command: string, lookups: ReferenceLookups) {
  const parts = command.trim().split(/\s+/);
  const target = parts[1] ?? "";
  const match = lookups.moduleOptions.find((option) => option.moduleKey === target || option.value === target);
  return match ? { moduleGroupKey: match.groupKey, moduleId: match.value, moduleKey: match.moduleKey, platformKey: match.platformKey } : { moduleKey: target };
}

function buildReferenceLookups(result?: RegistryResult, issues: MaturityRecord[] = []): ReferenceLookups {
  const issueOptions = issues.map((issue) => ({
    value: issue.key,
    label: `${issue.key} - ${issue.title}`
  }));
  const platformOptions: ReferenceLookups["platformOptions"] = [];
  const groupOptions: ReferenceLookups["groupOptions"] = [];
  const moduleOptions: ReferenceLookups["moduleOptions"] = [];
  for (const platform of result?.platforms ?? []) {
    platformOptions.push({ value: platform.platform, label: platform.name });
    for (const group of platform.groups ?? []) {
      groupOptions.push({ value: group.groupKey, label: `${platform.name} / ${group.name}` });
      for (const module of group.modules ?? []) {
        moduleOptions.push({
          groupKey: group.groupKey,
          label: `${platform.name} / ${group.name} / ${module.name}`,
          moduleKey: module.moduleKey,
          platformKey: platform.platform,
          value: module.id
        });
      }
    }
  }
  return { groupOptions, issueOptions, moduleOptions, platformOptions };
}

function isLargeKind(kind: MaturityKind) {
  return ["actions", "activities", "agents", "automations", "discussions", "gantt", "issues", "kanban", "pull-requests", "reviews", "security-quality", "tasks", "timeline", "changelog", "releases", "coverage"].includes(kind);
}

async function invalidateKind(queryClient: ReturnType<typeof useQueryClient>, kind: MaturityKind) {
  await queryClient.invalidateQueries({ queryKey: ["admin", "project-manager", "maturity", kind] });
}

async function invalidateWorkflowKinds(queryClient: ReturnType<typeof useQueryClient>, kind: MaturityKind) {
  const related: MaturityKind[] = ["issues", "tasks", "reviews", "automations", "activities"].includes(kind) ? [kind, "timeline", "gantt"] : [kind];
  await Promise.all(related.map((item) => invalidateKind(queryClient, item)));
}

function updateForm(setForm: React.Dispatch<React.SetStateAction<MaturityForm>>, patch: Partial<MaturityForm>, setLocalBanner: (value: string) => void) {
  setLocalBanner("");
  setForm((current) => ({ ...current, ...patch }));
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "";
}

function showError(title: string, error: unknown) {
  toast.error(title, { description: error instanceof Error ? error.message : "Please try again." });
}

function Header({ children, className }: { children: string; className?: string }) {
  return <WorkspaceTableHeaderCell className={className}>{children}</WorkspaceTableHeaderCell>;
}
