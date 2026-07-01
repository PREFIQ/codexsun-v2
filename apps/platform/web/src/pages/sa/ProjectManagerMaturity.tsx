import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, CheckCircle2, CircleDot, GitPullRequest, MessageSquare, Paperclip, Play, PlayCircle, Plus, RefreshCw, Save, Settings, ShieldCheck, Trash2, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@codexsun/ui/components/dialog";
import { Input } from "@codexsun/ui/components/input";
import { Switch } from "@codexsun/ui/components/switch";
import { Textarea } from "@codexsun/ui/components/textarea";
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

type MaturityKind = "todos" | "tasks" | "reviews" | "issues" | "pull-requests" | "agents" | "discussions" | "actions" | "security-quality" | "kanban" | "timeline" | "changelog" | "github" | "releases" | "automations" | "coverage" | "activities";

type MaturityRecord = {
  active: boolean;
  actor: string;
  assignee: string;
  command: string;
  description: string;
  dueDate: string;
  eventName: string;
  githubBranch: string;
  githubCommit: string;
  githubIssue: string;
  githubPr: string;
  githubUrl: string;
  id: string;
  key: string;
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
  moduleOptions: Array<{ groupKey: string; label: string; moduleKey: string; platformKey: string; value: string }>;
  platformOptions: Array<{ label: string; value: string }>;
};

type MaturityTab = { icon: LucideIcon; kind: MaturityKind; label: string };

const tabs: MaturityTab[] = [
  { icon: CircleDot, kind: "issues", label: "Issues" },
  { icon: GitPullRequest, kind: "pull-requests", label: "Pull requests" },
  { icon: Bot, kind: "agents", label: "Agents notes" },
  { icon: MessageSquare, kind: "discussions", label: "Discussions" },
  { icon: PlayCircle, kind: "actions", label: "Actions" },
  { icon: ShieldCheck, kind: "security-quality", label: "Security and quality" },
  { icon: CheckCircle2, kind: "tasks", label: "Tasks" },
  { icon: CheckCircle2, kind: "reviews", label: "Reviews" },
  { icon: CheckCircle2, kind: "kanban", label: "Kanban" },
  { icon: CheckCircle2, kind: "automations", label: "Automations" },
  { icon: CheckCircle2, kind: "coverage", label: "Coverage" },
  { icon: CheckCircle2, kind: "activities", label: "Activities" },
  { icon: CheckCircle2, kind: "timeline", label: "Timeline" },
  { icon: CheckCircle2, kind: "todos", label: "Todos" },
  { icon: GitPullRequest, kind: "github", label: "Git refs" }
];

const workTabs = tabs.filter((tab) => !["agents", "discussions", "pull-requests", "reviews", "security-quality"].includes(tab.kind));

const discussionTabs: MaturityTab[] = [
  { icon: MessageSquare, kind: "discussions", label: "Discussion" },
  { icon: CheckCircle2, kind: "reviews", label: "Reviews" }
];

const statusFilters = [
  { id: "all", label: "All records" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" }
];

export function ProjectManagerMaturity({
  availableTabs = workTabs,
  description = "Team delivery, traceability, automation, release, and governance workspace.",
  initialKind = "tasks",
  technicalName = "page.project-manager.maturity",
  title = "Project Manager"
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
  const [upsertRecord, setUpsertRecord] = useState<MaturityRecord | null>(null);
  const [upsertMode, setUpsertMode] = useState<"list" | "upsert">("list");

  const recordsQuery = useQuery<MaturityRecord[]>({
    queryKey: ["admin", "project-manager", "maturity", kind],
    queryFn: () => apiGet<MaturityRecord[]>(`/admin/project-manager/maturity/${kind}`, "sa")
  });

  const registryQuery = useQuery<RegistryResult>({
    queryKey: ["admin", "project-manager", "result"],
    queryFn: () => apiGet<RegistryResult>("/admin/project-manager/result", "sa")
  });

  const lookups = useMemo(() => buildReferenceLookups(registryQuery.data), [registryQuery.data]);

  const records = recordsQuery.data ?? [];
  const filteredRecords = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    return records.filter((record) => {
      const matchesSearch = !term || [record.title, record.key, record.moduleKey, record.status, record.type, record.assignee, record.reviewer, record.version, record.command].some((value) => value.toLowerCase().includes(term));
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? record.active : !record.active);
      return matchesSearch && matchesStatus;
    });
  }, [records, searchValue, statusFilter]);

  const saveMutation = useMutation({
    mutationFn: (form: MaturityForm) => apiPost<MaturityRecord>(`/admin/project-manager/maturity/${kind}`, maturityPayload(form), "sa"),
    onSuccess: async (record) => {
      await invalidateKind(queryClient, kind);
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
      await invalidateKind(queryClient, kind);
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

  const commandMutation = useMutation({
    mutationFn: () => apiPost<{ automation: MaturityRecord; activity: MaturityRecord }>("/admin/project-manager/commands", { command, ...inferReferenceFromCommand(command, lookups) }, "sa"),
    onSuccess: async () => {
      await Promise.all(["actions", "activities", "automations", "github", "timeline"].map((item) => invalidateKind(queryClient, item as MaturityKind)));
      toast.success("Command completed", { description: command });
    },
    onError: (error) => showError("Command failed", error)
  });

  function openEditor(record: MaturityRecord | null) {
    if (isLargeKind(kind)) {
      setUpsertRecord(record);
      setUpsertMode("upsert");
      return;
    }
    setDialogRecord(record);
    setDialogOpen(true);
  }

  if (upsertMode === "upsert") {
    return (
      <MaturityUpsertPage
        errorMessage={errorMessage(saveMutation.error ?? updateMutation.error)}
        kind={kind}
        loading={saveMutation.isPending || updateMutation.isPending}
        lookups={lookups}
        record={upsertRecord}
        onBack={() => { setUpsertMode("list"); setUpsertRecord(null); }}
        onSubmit={(form) => {
          if (form.id) updateMutation.mutate({ ...form, id: form.id });
          else saveMutation.mutate(form);
        }}
      />
    );
  }

  return (
    <WorkspacePage
      title={title}
      description={description}
      technicalName={technicalName}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" className="h-9 rounded-md" onClick={() => void recordsQuery.refetch()}>
            <RefreshCw className={cn("size-4", recordsQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-md" title="Run github:now" disabled={commandMutation.isPending} onClick={() => commandMutation.mutate()}>
            <Play className={cn("size-4", commandMutation.isPending && "animate-pulse")} />
          </Button>
          <Button type="button" className="h-9 rounded-md" onClick={() => openEditor(null)}>
            <Plus className="size-4" />
            New {labelForKind(kind).toLowerCase()}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 border-b border-border/70">
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
        </div>
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
          onEdit={openEditor}
          onForceDelete={setPendingDelete}
          onRestore={(record) => lifecycleMutation.mutate({ action: "restore", record })}
        />
      </div>

      <MaturityDialog
        kind={kind}
        loading={saveMutation.isPending || updateMutation.isPending}
        open={dialogOpen}
        record={dialogRecord}
        errorMessage={errorMessage(saveMutation.error ?? updateMutation.error)}
        onClose={() => { setDialogOpen(false); setDialogRecord(null); }}
        lookups={lookups}
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
      description="Discussion and review workspace for product decisions, technical review, and improvement signals."
      initialKind="discussions"
      technicalName="page.project-manager.discussions"
      title="Discussions"
    />
  );
}

export function ProjectManagerAgentNotes() {
  return (
    <ProjectManagerMaturity
      availableTabs={[
        { icon: Bot, kind: "agents", label: "Agent Notes" },
        { icon: ShieldCheck, kind: "security-quality", label: "Security and Quality" }
      ]}
      description="Agent notes, security checks, quality reviews, risks, and validation items connected to project references."
      initialKind="agents"
      technicalName="page.project-manager.agent-security"
      title="Agent and Security"
    />
  );
}

function MaturityTable({
  kind,
  loading,
  records,
  onDeactivate,
  onEdit,
  onForceDelete,
  onRestore
}: {
  kind: MaturityKind;
  loading: boolean;
  records: MaturityRecord[];
  onDeactivate: (record: MaturityRecord) => void;
  onEdit: (record: MaturityRecord) => void;
  onForceDelete: (record: MaturityRecord) => void;
  onRestore: (record: MaturityRecord) => void;
}) {
  const columns = columnsForKind(kind);
  return (
    <WorkspaceTablePanel>
      <div className="overflow-x-auto">
        {kind === "kanban" ? <KanbanStrip records={records} /> : null}
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
              <Header>#</Header>
              <Header>Title</Header>
              <Header>Key</Header>
              {columns.map((column) => <Header key={column.id}>{column.label}</Header>)}
              <Header>Status</Header>
              <Header className="text-right">Action</Header>
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => (
              <tr key={record.id} className={cn("border-b border-border/70 last:border-b-0", !record.active && "bg-muted/20 text-muted-foreground")}>
                <td className="px-4 py-2.5 text-muted-foreground">{index + 1}</td>
                <td className="px-4 py-2.5">
                  <button type="button" className="font-medium hover:underline" onClick={() => onEdit(record)}>{record.title}</button>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{record.key}</td>
                {columns.map((column) => <td key={column.id} className="px-4 py-2.5 text-muted-foreground">{cell(record, column.id)}</td>)}
                <td className="px-4 py-2.5">
                  <WorkspaceStatusBadge label={record.status || (record.active ? "active" : "inactive")} tone={record.active ? "success" : "danger"} />
                </td>
                <td className="px-4 py-1.5 text-right">
                  <WorkspaceRowActions
                    title={record.title}
                    deleteLabel="Deactivate"
                    isSuspended={!record.active}
                    restoreLabel="Restore"
                    onDelete={() => onDeactivate(record)}
                    onEdit={() => onEdit(record)}
                    onRestore={() => onRestore(record)}
                    onView={() => onEdit(record)}
                    actions={[{ id: "force-delete", icon: <Trash2 className="size-4" />, label: "Force delete", tone: "destructive", onSelect: () => onForceDelete(record) }]}
                  />
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
  onSubmit
}: {
  errorMessage?: string;
  kind: MaturityKind;
  loading: boolean;
  lookups: ReferenceLookups;
  open: boolean;
  record: MaturityRecord | null;
  onClose: () => void;
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
            if (!form.key.trim()) {
              setLocalBanner("Key is required.");
              return;
            }
            setLocalBanner("");
            onSubmit(form);
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
              <WorkspaceFormField label="Key" required>
                <Input className="h-11 rounded-md font-mono" value={form.key} onChange={(event) => updateForm(setForm, { key: event.target.value }, setLocalBanner)} />
              </WorkspaceFormField>
              {fieldsForKind(kind).map((field) => <MaturityField key={field} field={field} form={form} lookups={lookups} setForm={setForm} setLocalBanner={setLocalBanner} />)}
              <WorkspaceFormField label="Description">
                <Textarea className="min-h-24 rounded-md" value={form.description} onChange={(event) => updateForm(setForm, { description: event.target.value }, setLocalBanner)} />
              </WorkspaceFormField>
              <WorkspaceFormField label="Notes">
                <WorkspaceEditor content={form.richNotes} onChange={(value) => updateForm(setForm, { richNotes: value }, setLocalBanner)} placeholder="Write context, review notes, decisions, blockers, or automation output..." />
              </WorkspaceFormField>
              <div className={cn("flex min-h-14 items-center justify-between rounded-md border px-4 py-3", form.active ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-border bg-muted/40 text-muted-foreground")}>
                <span className="text-sm font-semibold"><CheckCircle2 className="mr-2 inline size-4" />Active</span>
                <Switch checked={form.active} onCheckedChange={(checked) => updateForm(setForm, { active: checked }, setLocalBanner)} />
              </div>
            </WorkspaceFormGrid>
          </div>
          <DialogFooter className="border-t border-border/70 px-5 py-4 sm:justify-start">
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
  errorMessage,
  kind,
  loading,
  lookups,
  record,
  onBack,
  onSubmit
}: {
  errorMessage?: string;
  kind: MaturityKind;
  loading: boolean;
  lookups: ReferenceLookups;
  record: MaturityRecord | null;
  onBack: () => void;
  onSubmit: (form: MaturityForm) => void;
}) {
  const [form, setForm] = useState<MaturityForm>(() => formFromRecord(record, kind));
  const [localBanner, setLocalBanner] = useState("");
  const metaFields = metadataFieldsForKind(kind);

  return (
    <WorkspacePage
      title={record ? form.title || `Edit ${labelForKind(kind).toLowerCase()}` : `Create new ${singularLabelForKind(kind)}`}
      description={record ? `${labelForKind(kind)} working thread with ownership, traceability, and delivery context.` : "Capture the work clearly, then attach ownership, references, delivery state, and module scope."}
      technicalName={`page.project-manager.${kind}.upsert`}
      actions={
        <Button type="button" variant="outline" className="h-9 rounded-md" onClick={onBack}>
          <X className="size-4" />
          Cancel
        </Button>
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
          if (!form.key.trim()) {
            setLocalBanner("Key is required.");
            return;
          }
          setLocalBanner("");
          onSubmit(form);
        }}
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-4">
            {localBanner || errorMessage ? (
              <WorkspaceFormBanner title={localBanner ? "Missing required field" : "Could not save"}>{localBanner || errorMessage}</WorkspaceFormBanner>
            ) : null}
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                <CircleDot className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground">{record ? "Edit working item" : `Create new ${singularLabelForKind(kind)}`}</div>
                <div className="text-xs text-muted-foreground">{kindGuidance(kind)}</div>
              </div>
            </div>
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
                <div className="text-sm font-semibold text-foreground">Description</div>
                <div className="text-xs text-muted-foreground">Write the problem, intent, acceptance notes, decisions, or implementation details.</div>
              </div>
              <div className="p-4">
                <WorkspaceEditor
                  content={form.richNotes}
                  onChange={(value) => updateForm(setForm, { richNotes: value }, setLocalBanner)}
                  placeholder="Write the full working context here..."
                />
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Paperclip className="size-3.5" /> Attach files or references in the notes.</span>
                  <span>Use the sidebar to connect module, owner, status, labels, version, and delivery references.</span>
                </div>
              </div>
            </WorkspaceTablePanel>
            <WorkspaceFormField label="Short summary">
              <Textarea
                className="min-h-20 rounded-md"
                placeholder="Optional one-paragraph summary for list and timeline views."
                value={form.description}
                onChange={(event) => updateForm(setForm, { description: event.target.value }, setLocalBanner)}
              />
            </WorkspaceFormField>
            <div className="flex flex-wrap justify-end gap-2 border-t border-border/70 pt-4">
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
            <SidebarField title="Key" required>
              <Input className="h-10 rounded-md font-mono" placeholder="unique-key" value={form.key} onChange={(event) => updateForm(setForm, { key: event.target.value }, setLocalBanner)} />
            </SidebarField>
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
        <Settings className="size-4 text-muted-foreground" />
      </div>
      {children}
    </section>
  );
}

function MaturityField({ compact = false, field, form, lookups, setForm, setLocalBanner }: { compact?: boolean; field: keyof MaturityForm; form: MaturityForm; lookups: ReferenceLookups; setForm: React.Dispatch<React.SetStateAction<MaturityForm>>; setLocalBanner: (value: string) => void }) {
  const options = lookupOptionsForField(field, lookups);
  const fixedOptions = optionsForField(field).map((value) => ({ value, label: value }));
  const control = field === "dueDate" ? (
    <WorkspaceDatePicker value={form.dueDate} placeholder="Select due date" onValueChange={(value) => updateForm(setForm, { dueDate: value }, setLocalBanner)} />
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

function columnsForKind(kind: MaturityKind) {
  const referenceColumns = [{ id: "platformKey", label: "Platform" }, { id: "moduleGroupKey", label: "Group" }, { id: "moduleKey", label: "Module" }];
  if (kind === "pull-requests") return [{ id: "githubBranch", label: "Branch" }, { id: "githubPr", label: "PR" }, { id: "reviewer", label: "Reviewer" }, ...referenceColumns];
  if (kind === "agents") return [{ id: "actor", label: "Agent" }, { id: "referenceType", label: "Ref type" }, { id: "referenceId", label: "Ref id" }, ...referenceColumns];
  if (kind === "discussions") return [{ id: "type", label: "Topic" }, { id: "assignee", label: "Owner" }, ...referenceColumns, { id: "priority", label: "Priority" }];
  if (kind === "actions") return [{ id: "command", label: "Command" }, { id: "eventName", label: "Event" }, { id: "actor", label: "Actor" }, ...referenceColumns];
  if (kind === "security-quality") return [{ id: "type", label: "Area" }, { id: "severity", label: "Severity" }, { id: "ownerTeam", label: "Owner" }, ...referenceColumns];
  if (kind === "github") return [{ id: "githubBranch", label: "Branch" }, { id: "githubCommit", label: "Commit" }, { id: "githubPr", label: "PR" }, ...referenceColumns];
  if (kind === "releases" || kind === "changelog") return [{ id: "version", label: "Version" }, { id: "type", label: "Type" }, { id: "ownerTeam", label: "Owner" }, ...referenceColumns];
  if (kind === "automations") return [{ id: "command", label: "Command" }, { id: "eventName", label: "Event" }, { id: "actor", label: "Actor" }, ...referenceColumns];
  if (kind === "activities" || kind === "timeline") return [{ id: "eventName", label: "Event" }, { id: "actor", label: "Actor" }, { id: "referenceType", label: "Ref type" }, ...referenceColumns];
  if (kind === "reviews") return [{ id: "reviewer", label: "Reviewer" }, { id: "referenceType", label: "Ref type" }, ...referenceColumns, { id: "priority", label: "Priority" }];
  if (kind === "kanban") return [{ id: "lane", label: "Lane" }, { id: "assignee", label: "Assignee" }, ...referenceColumns, { id: "priority", label: "Priority" }];
  return [{ id: "type", label: "Type" }, { id: "assignee", label: "Assignee" }, ...referenceColumns, { id: "priority", label: "Priority" }];
}

function fieldsForKind(kind: MaturityKind): Array<keyof MaturityForm> {
  const references: Array<keyof MaturityForm> = ["platformKey", "moduleGroupKey", "moduleId", "moduleKey"];
  const base: Array<keyof MaturityForm> = ["type", "status", ...references, "ownerTeam", "priority", "sortOrder"];
  if (kind === "pull-requests") return ["githubBranch", "githubCommit", "githubPr", "githubUrl", "reviewer", "status", ...references, "referenceType", "referenceId", "version", "sortOrder"];
  if (kind === "agents") return ["actor", "eventName", "referenceType", "referenceId", ...references, "status", "sortOrder"];
  if (kind === "discussions") return ["assignee", "reviewer", "labels", "type", "status", ...references, "priority", "dueDate", "sortOrder"];
  if (kind === "actions") return ["command", "eventName", "actor", ...references, "referenceType", "referenceId", "status", "sortOrder"];
  if (kind === "security-quality") return ["type", "severity", "status", "ownerTeam", ...references, "referenceType", "referenceId", "priority", "dueDate", "sortOrder"];
  if (kind === "github") return ["githubBranch", "githubCommit", "githubPr", "githubIssue", "githubUrl", ...references, "referenceType", "referenceId", "version", "sortOrder"];
  if (kind === "automations") return ["command", "eventName", "actor", ...references, "referenceType", "referenceId", "status", "sortOrder"];
  if (kind === "changelog" || kind === "releases") return ["version", "type", "status", "ownerTeam", ...references, "githubPr", "githubCommit", "sortOrder"];
  if (kind === "reviews") return ["reviewer", "status", "referenceType", "referenceId", ...references, "priority", "dueDate", "sortOrder"];
  if (kind === "kanban") return ["lane", "assignee", "type", "status", ...references, "priority", "dueDate", "sortOrder"];
  if (kind === "activities" || kind === "timeline") return ["eventName", "actor", "referenceType", "referenceId", ...references, "version", "sortOrder"];
  return ["assignee", "reviewer", "severity", "dueDate", "labels", ...base];
}

function metadataFieldsForKind(kind: MaturityKind): Array<keyof MaturityForm> {
  const references: Array<keyof MaturityForm> = ["platformKey", "moduleGroupKey", "moduleId"];
  if (kind === "pull-requests") return ["githubBranch", "githubPr", "githubCommit", "githubUrl", "reviewer", "status", ...references, "referenceType", "referenceId", "version"];
  if (kind === "agents") return ["actor", "eventName", "status", ...references, "referenceType", "referenceId"];
  if (kind === "discussions") return ["assignee", "reviewer", "labels", "type", "status", "priority", ...references, "dueDate"];
  if (kind === "actions") return ["command", "eventName", "actor", "status", ...references, "referenceType", "referenceId"];
  if (kind === "security-quality") return ["type", "severity", "status", "ownerTeam", "priority", ...references, "referenceType", "referenceId", "dueDate"];
  if (kind === "issues") return ["assignee", "reviewer", "labels", "type", "status", "priority", "severity", ...references, "dueDate"];
  if (kind === "tasks") return ["assignee", "reviewer", "labels", "type", "status", "priority", ...references, "dueDate"];
  if (kind === "reviews") return ["reviewer", "status", "priority", "referenceType", "referenceId", ...references, "dueDate"];
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

function kindGuidance(kind: MaturityKind) {
  const guidance: Partial<Record<MaturityKind, string>> = {
    actions: "Register repeatable commands, workflow events, automation replies, and the module context they affect.",
    agents: "Keep AI or teammate implementation notes tied to the exact module, reference, and delivery state.",
    changelog: "Record versioned change, release impact, GitHub references, and module ownership.",
    coverage: "Track missing coverage, validation needs, ownership, and the exact registry reference.",
    discussions: "Capture product and engineering decisions before they become tasks, issues, or pull requests.",
    issues: "Describe the problem, assign owners, classify labels, and connect it to the module it affects.",
    kanban: "Move delivery work through lanes while keeping assignee, priority, and module context close.",
    "pull-requests": "Connect branch, PR, reviewer, module scope, and release/version references.",
    releases: "Collect release scope, version, owner, GitHub references, and rollout state.",
    reviews: "Capture review target, reviewer, decision state, and follow-up context.",
    "security-quality": "Track risk, audit, permission, testing, performance, and quality review items.",
    tasks: "Define the work, owner, review path, priority, due date, and module trace."
  };
  return guidance[kind] ?? "Connect the record to the right scope, owner, status, and development reference.";
}

function fieldLabel(field: keyof MaturityForm) {
  const labels: Partial<Record<keyof MaturityForm, string>> = {
    dueDate: "Due date",
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
    sortOrder: "Order"
  };
  return labels[field] ?? field;
}

function cell(record: MaturityRecord, id: string) {
  const value = record[id as keyof MaturityRecord];
  if (Array.isArray(value)) return value.length ? value.join(", ") : "-";
  return value ? String(value) : "-";
}

function formFromRecord(record: MaturityRecord | null, kind: MaturityKind): MaturityForm {
  return {
    active: record?.active ?? true,
    actor: record?.actor ?? "",
    assignee: record?.assignee ?? "",
    command: record?.command ?? "",
    description: record?.description ?? "",
    dueDate: record?.dueDate ?? "",
    eventName: record?.eventName ?? "",
    githubBranch: record?.githubBranch ?? "",
    githubCommit: record?.githubCommit ?? "",
    githubIssue: record?.githubIssue ?? "",
    githubPr: record?.githubPr ?? "",
    githubUrl: record?.githubUrl ?? "",
    ...(record ? { id: record.id } : {}),
    key: record?.key ?? "",
    labels: record?.labels?.join(", ") ?? "",
    lane: record?.lane ?? (kind === "kanban" ? "Backlog" : ""),
    moduleGroupKey: record?.moduleGroupKey ?? "",
    moduleId: record?.moduleId ?? "",
    moduleKey: record?.moduleKey ?? "",
    ownerTeam: record?.ownerTeam ?? "",
    platformKey: record?.platformKey ?? "",
    priority: record?.priority ?? "medium",
    referenceId: record?.referenceId ?? "",
    referenceType: record?.referenceType ?? "",
    reviewer: record?.reviewer ?? "",
    richNotes: record?.richNotes ?? "",
    severity: record?.severity ?? "",
    sortOrder: record ? String(record.sortOrder) : "0",
    status: record?.status ?? "open",
    title: record?.title ?? "",
    type: record?.type ?? "",
    version: record?.version ?? ""
  };
}

function maturityPayload(form: MaturityForm) {
  return {
    ...form,
    labels: form.labels.split(",").map((label) => label.trim()).filter(Boolean),
    sortOrder: Number(form.sortOrder) || 0
  };
}

function inferReferenceFromCommand(command: string, lookups: ReferenceLookups) {
  const parts = command.trim().split(/\s+/);
  const target = parts[1] ?? "";
  const match = lookups.moduleOptions.find((option) => option.moduleKey === target || option.value === target);
  return match ? { moduleGroupKey: match.groupKey, moduleId: match.value, moduleKey: match.moduleKey, platformKey: match.platformKey } : { moduleKey: target };
}

function buildReferenceLookups(result?: RegistryResult): ReferenceLookups {
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
  return { groupOptions, moduleOptions, platformOptions };
}

function isLargeKind(kind: MaturityKind) {
  return ["actions", "agents", "discussions", "issues", "kanban", "pull-requests", "reviews", "security-quality", "tasks", "changelog", "releases", "coverage"].includes(kind);
}

async function invalidateKind(queryClient: ReturnType<typeof useQueryClient>, kind: MaturityKind) {
  await queryClient.invalidateQueries({ queryKey: ["admin", "project-manager", "maturity", kind] });
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
