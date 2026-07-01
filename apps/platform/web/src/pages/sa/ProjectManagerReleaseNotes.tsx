import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, GitCommit, GitPullRequest, ListTree, Play, Plus, RefreshCw, Save, Tag, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@codexsun/ui/components/dialog";
import { Input } from "@codexsun/ui/components/input";
import { Switch } from "@codexsun/ui/components/switch";
import { Textarea } from "@codexsun/ui/components/textarea";
import { WorkspaceAutocomplete } from "@codexsun/ui/workspace/autocomplete";
import { WorkspaceEditor } from "@codexsun/ui/workspace/editor";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { WorkspaceFormBanner, WorkspaceFormField, WorkspaceFormGrid } from "@codexsun/ui/workspace/upsert";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceTableEmptyState, WorkspaceTableHeaderCell, WorkspaceTablePanel, WorkspaceTableSkeletonRows } from "@codexsun/ui/workspace/table";
import { cn } from "@codexsun/ui/lib/utils";
import { apiDelete, apiGet, apiPost, apiPut } from "../../api";

type ReleaseNotesKind = "changelog" | "releases";
type ReleaseWorkspaceTab = "release-notes" | "changelog" | "pull-requests";

type ReleaseRecord = {
  active: boolean;
  description: string;
  githubBranch: string;
  githubCommit: string;
  githubPr: string;
  githubUrl: string;
  id: string;
  key: string;
  labels: string[];
  moduleGroupKey: string;
  moduleId: string;
  moduleKey: string;
  ownerTeam: string;
  platformKey: string;
  referenceId: string;
  referenceType: string;
  reviewer: string;
  richNotes: string;
  sortOrder: number;
  status: string;
  title: string;
  type: string;
  version: string;
};

type ReleaseForm = Omit<ReleaseRecord, "id" | "labels" | "sortOrder"> & {
  changeItems: string;
  id?: string;
  labels: string;
  sortOrder: string;
};

type RegistryResult = {
  platforms: Array<{
    name: string;
    platform: string;
    groups: Array<{
      groupKey: string;
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

const statusFilters = [
  { id: "all", label: "All records" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" }
];

const releaseTabs: Array<{ icon: typeof Tag; id: ReleaseWorkspaceTab; label: string }> = [
  { icon: Tag, id: "release-notes", label: "Deployed Release" },
  { icon: ListTree, id: "changelog", label: "Working Release" },
  { icon: GitPullRequest, id: "pull-requests", label: "GitHub" }
];

export function ProjectManagerReleaseNotes() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ReleaseWorkspaceTab>("release-notes");
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editorRecord, setEditorRecord] = useState<ReleaseRecord | null>(null);
  const [editorKind, setEditorKind] = useState<ReleaseNotesKind>("releases");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorVersion, setEditorVersion] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{ kind: ReleaseNotesKind; record: ReleaseRecord } | null>(null);

  const releasesQuery = useQuery<ReleaseRecord[]>({
    queryKey: ["admin", "project-manager", "maturity", "releases"],
    queryFn: () => apiGet<ReleaseRecord[]>("/admin/project-manager/maturity/releases", "sa")
  });

  const changelogQuery = useQuery<ReleaseRecord[]>({
    queryKey: ["admin", "project-manager", "maturity", "changelog"],
    queryFn: () => apiGet<ReleaseRecord[]>("/admin/project-manager/maturity/changelog", "sa")
  });

  const pullRequestsQuery = useQuery<ReleaseRecord[]>({
    queryKey: ["admin", "project-manager", "maturity", "pull-requests"],
    queryFn: () => apiGet<ReleaseRecord[]>("/admin/project-manager/maturity/pull-requests", "sa")
  });

  const registryQuery = useQuery<RegistryResult>({
    queryKey: ["admin", "project-manager", "result"],
    queryFn: () => apiGet<RegistryResult>("/admin/project-manager/result", "sa")
  });

  const lookups = useMemo(() => buildReferenceLookups(registryQuery.data), [registryQuery.data]);
  const releases = releasesQuery.data ?? [];
  const changelog = changelogQuery.data ?? [];
  const pullRequests = pullRequestsQuery.data ?? [];
  const filteredRecords = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    return releases.filter((record) => {
      const children = changelog.filter((child) => child.version === record.version);
      const childText = children.flatMap((child) => [child.title, child.key, child.type, child.moduleKey]).join(" ");
      const matchesSearch = !term || [record.title, record.key, record.version, record.status, record.type, record.ownerTeam, record.moduleKey, childText].some((value) => value.toLowerCase().includes(term));
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? record.active : !record.active);
      return matchesSearch && matchesStatus;
    });
  }, [changelog, releases, searchValue, statusFilter]);
  const filteredChangelog = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    return changelog.filter((record) => {
      const matchesSearch = !term || [record.title, record.key, record.version, record.status, record.type, record.ownerTeam, record.moduleKey, record.githubPr].some((value) => value.toLowerCase().includes(term));
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? record.active : !record.active);
      return matchesSearch && matchesStatus;
    });
  }, [changelog, searchValue, statusFilter]);
  const filteredPullRequests = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    return pullRequests.filter((record) => {
      const matchesSearch = !term || [record.title, record.key, record.version, record.status, record.githubPr, record.githubCommit, record.moduleKey].some((value) => value.toLowerCase().includes(term));
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? record.active : !record.active);
      return matchesSearch && matchesStatus;
    });
  }, [pullRequests, searchValue, statusFilter]);

  const saveMutation = useMutation({
    mutationFn: (form: ReleaseForm) => apiPost<ReleaseRecord>(`/admin/project-manager/maturity/${editorKind}`, payloadFromForm(form), "sa"),
    onSuccess: async (record) => {
      await invalidate(queryClient, editorKind);
      toast.success(`${titleForKind(editorKind)} saved`, { description: record.version || record.title });
      closeEditor();
    },
    onError: (error) => showError("Save failed", error)
  });

  const updateMutation = useMutation({
    mutationFn: (form: ReleaseForm & { id: string }) => apiPut<ReleaseRecord>(`/admin/project-manager/maturity/${editorKind}/${form.id}`, payloadFromForm(form), "sa"),
    onSuccess: async (record) => {
      await invalidate(queryClient, editorKind);
      toast.success(`${titleForKind(editorKind)} updated`, { description: record.version || record.title });
      closeEditor();
    },
    onError: (error) => showError("Update failed", error)
  });

  const deleteMutation = useMutation({
    mutationFn: ({ kind, record }: { kind: ReleaseNotesKind; record: ReleaseRecord }) => apiDelete<{ deleted: boolean }>(`/admin/project-manager/maturity/${kind}/${record.id}`, "sa"),
    onSuccess: async () => {
      await Promise.all([invalidate(queryClient, "releases"), invalidate(queryClient, "changelog")]);
      setPendingDelete(null);
    },
    onError: (error) => showError("Delete failed", error)
  });

  const commandMutation = useMutation({
    mutationFn: () => apiPost<{ automation: ReleaseRecord; activity: ReleaseRecord }>("/admin/project-manager/commands", { command: "github:now", referenceType: "release", referenceId: "release-notes" }, "sa"),
    onSuccess: async () => {
      await Promise.all(["actions", "automations", "github", "timeline", "pull-requests"].map((kind) => queryClient.invalidateQueries({ queryKey: ["admin", "project-manager", "maturity", kind] })));
      toast.success("github:now completed", { description: "Git action and references were written to Project Manager." });
    },
    onError: (error) => showError("github:now failed", error)
  });

  function openEditor(kind: ReleaseNotesKind, record: ReleaseRecord | null, version = "") {
    setEditorKind(kind);
    setEditorRecord(record);
    setEditorVersion(version);
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditorRecord(null);
    setEditorVersion("");
  }

  return (
    <WorkspacePage
      title="Release Notes"
      description="Deployed releases, working release changes, and GitHub references connected by version, module, and reference no."
      technicalName="page.project-manager.release-notes"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" className="h-9 rounded-md" onClick={() => { void releasesQuery.refetch(); void changelogQuery.refetch(); void pullRequestsQuery.refetch(); }}>
            <RefreshCw className={cn("size-4", (releasesQuery.isFetching || changelogQuery.isFetching || pullRequestsQuery.isFetching) && "animate-spin")} />
            Refresh
          </Button>
          <Button type="button" variant="outline" className="h-9 rounded-md" disabled={commandMutation.isPending} onClick={() => commandMutation.mutate()}>
            <Play className={cn("size-4", commandMutation.isPending && "animate-pulse")} />
            github:now
          </Button>
          <Button type="button" className="h-9 rounded-md" onClick={() => openEditor("releases", null)}>
            <Plus className="size-4" />
            New deployed release
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 border-b border-border/70">
          {releaseTabs.map((tab) => (
            <button
              key={tab.id}
              className={cn("inline-flex h-10 items-center gap-2 border-b-2 px-3 text-sm font-medium", activeTab === tab.id ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}
              type="button"
              onClick={() => { setActiveTab(tab.id); setSearchValue(""); setStatusFilter("all"); }}
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
          searchPlaceholder="Search deployed releases, working releases, or GitHub references"
          searchValue={searchValue}
        />
        {activeTab === "release-notes" ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {filteredRecords.map((record) => (
              <ReleaseSummaryCard key={record.id} changelog={changelog.filter((child) => child.version === record.version)} record={record} onAddChild={(release) => openEditor("changelog", null, release.version)} onEdit={(release) => openEditor("releases", release, release.version)} />
            ))}
            {releases.length === 0 && releasesQuery.isFetching ? <WorkspaceTableSkeletonRows columns={5} /> : null}
            {filteredRecords.length === 0 && !releasesQuery.isFetching ? <WorkspaceTablePanel><WorkspaceTableEmptyState>No deployed releases found.</WorkspaceTableEmptyState></WorkspaceTablePanel> : null}
          </div>
        ) : null}
        {activeTab === "changelog" ? (
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <ReleaseNoteCard key={record.id} changelog={filteredChangelog.filter((child) => child.version === record.version)} record={record} onAddChild={(release) => openEditor("changelog", null, release.version)} onDelete={(kind, childRecord) => setPendingDelete({ kind, record: childRecord })} onEdit={(kind, childRecord) => openEditor(kind, childRecord, childRecord.version)} />
            ))}
            {changelog.length === 0 && changelogQuery.isFetching ? <WorkspaceTableSkeletonRows columns={5} /> : null}
            {filteredChangelog.length === 0 && !changelogQuery.isFetching ? <WorkspaceTablePanel><WorkspaceTableEmptyState>No working release changes found.</WorkspaceTableEmptyState></WorkspaceTablePanel> : null}
          </div>
        ) : null}
        {activeTab === "pull-requests" ? (
          <PullRequestPanel loading={pullRequestsQuery.isFetching} records={filteredPullRequests} onRunGithubNow={() => commandMutation.mutate()} running={commandMutation.isPending} />
        ) : null}
      </div>

      <ReleaseNoteDialog
        errorMessage={errorMessage(saveMutation.error ?? updateMutation.error)}
        defaultVersion={editorVersion}
        kind={editorKind}
        loading={saveMutation.isPending || updateMutation.isPending}
        lookups={lookups}
        open={editorOpen}
        record={editorRecord}
        onClose={closeEditor}
        onSubmit={(form) => {
          if (form.id) updateMutation.mutate({ ...form, id: form.id });
          else saveMutation.mutate(form);
        }}
      />

      <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <DialogContent className="rounded-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {pendingDelete?.kind === "releases" ? "deployed release" : "working release change"}?</DialogTitle>
            <DialogDescription>This permanently removes {pendingDelete?.record.version || pendingDelete?.record.title} from the JSON registry.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-md" onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button type="button" variant="destructive" className="rounded-md" disabled={!pendingDelete || deleteMutation.isPending} onClick={() => { if (pendingDelete) deleteMutation.mutate(pendingDelete); }}>
              <Trash2 className="size-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WorkspacePage>
  );
}

function ReleaseSummaryCard({ changelog, record, onAddChild, onEdit }: { changelog: ReleaseRecord[]; record: ReleaseRecord; onAddChild: (record: ReleaseRecord) => void; onEdit: (record: ReleaseRecord) => void }) {
  return (
    <WorkspaceTablePanel>
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <button type="button" className="text-xl font-semibold hover:underline" onClick={() => onEdit(record)}>{record.version || record.title}</button>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <WorkspaceStatusBadge label={record.status || "planned"} tone={record.active ? "success" : "danger"} />
              {record.type ? <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 font-medium text-amber-800">{record.type}</span> : null}
              {record.githubCommit ? <span className="inline-flex items-center gap-1"><GitCommit className="size-3.5" /> {record.githubCommit}</span> : null}
            </div>
          </div>
          <Button type="button" variant="outline" className="h-8 rounded-md" onClick={() => onAddChild(record)}>
            <Plus className="size-4" />
            Change
          </Button>
        </div>
        <p className="min-h-10 text-sm text-muted-foreground">{record.description || "No release summary written yet."}</p>
        <div className="grid grid-cols-3 gap-2 border-t border-border/70 pt-3 text-xs">
          <div><div className="text-muted-foreground">Changes</div><div className="mt-1 font-semibold">{changelog.length}</div></div>
          <div><div className="text-muted-foreground">Module</div><div className="mt-1 truncate font-semibold">{record.moduleKey || "-"}</div></div>
          <div><div className="text-muted-foreground">Ref no</div><div className="mt-1 truncate font-mono">{record.referenceId || record.key}</div></div>
        </div>
      </div>
    </WorkspaceTablePanel>
  );
}

function ReleaseNoteCard({
  changelog,
  record,
  onAddChild,
  onDelete,
  onEdit
}: {
  changelog: ReleaseRecord[];
  record: ReleaseRecord;
  onAddChild: (record: ReleaseRecord) => void;
  onDelete: (kind: ReleaseNotesKind, record: ReleaseRecord) => void;
  onEdit: (kind: ReleaseNotesKind, record: ReleaseRecord) => void;
}) {
  const items: Array<{ id: string; record?: ReleaseRecord; text: string }> = [
    ...changeItemsFromRecord(record).map((item, index) => ({ id: `${record.id}-note-${index}`, text: item })),
    ...changelog.map((child) => ({ id: child.id, record: child, text: child.title }))
  ];
  return (
    <WorkspaceTablePanel>
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 pb-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="text-2xl font-semibold tracking-normal hover:underline" onClick={() => onEdit("releases", record)}>
                {record.version || record.title}
              </button>
              <WorkspaceStatusBadge label={record.status || (record.active ? "active" : "inactive")} tone={record.active ? "success" : "danger"} />
              {record.type ? <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">{record.type}</span> : null}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Tag className="size-4" /> {record.key}</span>
              <span>{record.ownerTeam || "Unassigned"} released {record.version ? "version" : "change"} {record.moduleKey ? `for ${record.moduleKey}` : ""}</span>
              {record.githubCommit ? <span className="inline-flex items-center gap-1"><GitCommit className="size-4" /> {record.githubCommit}</span> : null}
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="h-9 rounded-md" onClick={() => onAddChild(record)}>
              <Plus className="size-4" />
              Add change
            </Button>
            <Button type="button" variant="outline" className="h-9 rounded-md" onClick={() => onEdit("releases", record)}>Compare</Button>
            <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-md text-destructive" onClick={() => onDelete("releases", record)} title="Delete release">
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
        <div className="pt-5">
          <h2 className="text-xl font-semibold">What's Changed</h2>
          {record.description ? <p className="mt-2 text-sm text-muted-foreground">{record.description}</p> : null}
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm">
            {items.map((item) => {
              const childRecord = item.record;
              return (
              <li key={item.id}>
                {childRecord ? (
                  <span className="group inline-flex flex-wrap items-center gap-2">
                    <button type="button" className="text-left hover:underline" onClick={() => onEdit("changelog", childRecord)}>{item.text}</button>
                    <span className="text-xs text-muted-foreground">{childRecord.type}{childRecord.githubPr ? ` in ${childRecord.githubPr}` : ""}</span>
                    <button type="button" className="text-xs text-destructive opacity-0 group-hover:opacity-100" onClick={() => onDelete("changelog", childRecord)}>delete</button>
                  </span>
                ) : item.text}
              </li>
              );
            })}
          </ul>
        </div>
      </div>
    </WorkspaceTablePanel>
  );
}

function PullRequestPanel({ loading, records, running, onRunGithubNow }: { loading: boolean; records: ReleaseRecord[]; running: boolean; onRunGithubNow: () => void }) {
  return (
    <WorkspaceTablePanel>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
        <div>
          <div className="text-sm font-semibold">Pull requests</div>
          <div className="text-xs text-muted-foreground">GitHub connects deployed releases and working release changes through branch, PR, commit, version, and reference no.</div>
        </div>
        <Button type="button" variant="outline" className="h-9 rounded-md" disabled={running} onClick={onRunGithubNow}>
          <Play className={cn("size-4", running && "animate-pulse")} />
          github:now
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
              <Header>Pull request</Header>
              <Header>Branch</Header>
              <Header>Commit</Header>
              <Header>Version</Header>
              <Header>Reviewer</Header>
              <Header>Module</Header>
              <Header>Status</Header>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-b border-border/70 last:border-b-0">
                <td className="px-4 py-2.5">
                  <div className="font-medium">{record.githubPr || record.title}</div>
                  <div className="font-mono text-xs text-muted-foreground">{record.key}</div>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{record.githubBranch || "-"}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{record.githubCommit || "-"}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{record.version || "-"}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{record.reviewer || "-"}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{record.moduleKey || "-"}</td>
                <td className="px-4 py-2.5"><WorkspaceStatusBadge label={record.status || "draft"} tone={record.active ? "success" : "danger"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {records.length === 0 && loading ? <WorkspaceTableSkeletonRows columns={7} /> : null}
      {records.length === 0 && !loading ? <WorkspaceTableEmptyState>No GitHub references connected yet. Run github:now or add pull request records from Work & Automation.</WorkspaceTableEmptyState> : null}
    </WorkspaceTablePanel>
  );
}

function ReleaseNoteDialog({
  defaultVersion,
  errorMessage,
  kind,
  loading,
  lookups,
  open,
  record,
  onClose,
  onSubmit
}: {
  defaultVersion?: string;
  errorMessage?: string;
  kind: ReleaseNotesKind;
  loading: boolean;
  lookups: ReferenceLookups;
  open: boolean;
  record: ReleaseRecord | null;
  onClose: () => void;
  onSubmit: (form: ReleaseForm) => void;
}) {
  const [form, setForm] = useState<ReleaseForm>(() => formFromRecord(record, kind, defaultVersion));
  const [localBanner, setLocalBanner] = useState("");

  useEffect(() => {
    setForm(formFromRecord(record, kind, defaultVersion));
    setLocalBanner("");
  }, [record, kind, defaultVersion, open]);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden rounded-md p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border/70 px-5 py-4">
          <DialogTitle>{record ? `Edit ${kind === "releases" ? "deployed release" : "working release change"}` : `New ${kind === "releases" ? "deployed release" : "working release change"}`}</DialogTitle>
          <DialogDescription>{kind === "releases" ? "Create the deployed version summary after release is shipped." : "Add a not-yet-deployed working release change under the selected version."}</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (!form.title.trim() || !form.key.trim() || !form.version.trim()) {
              setLocalBanner("Title, key, and version are required.");
              return;
            }
            setLocalBanner("");
            onSubmit(form);
          }}
        >
          <div className="max-h-[68vh] overflow-y-auto px-5 py-4">
            {localBanner || errorMessage ? <WorkspaceFormBanner title={localBanner ? "Missing required field" : "Could not save"}>{localBanner || errorMessage}</WorkspaceFormBanner> : null}
            <WorkspaceFormGrid columns={2}>
              <WorkspaceFormField label="Version" required>
                <Input className="h-11 rounded-md font-mono" placeholder="v1.5.0-beta.2" value={form.version} onChange={(event) => setForm((current) => ({ ...current, version: event.target.value }))} />
              </WorkspaceFormField>
              <WorkspaceFormField label="Status">
                <WorkspaceSelect options={["planned", "draft", "pre-release", "released", "deprecated"].map((value) => ({ label: value, value }))} value={form.status} onValueChange={(status) => setForm((current) => ({ ...current, status }))} />
              </WorkspaceFormField>
              <WorkspaceFormField label={kind === "releases" ? "Deployed release title" : "Working change title"} required>
                <Input className="h-11 rounded-md" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
              </WorkspaceFormField>
              <WorkspaceFormField label="Key" required>
                <Input className="h-11 rounded-md font-mono" value={form.key} onChange={(event) => setForm((current) => ({ ...current, key: event.target.value }))} />
              </WorkspaceFormField>
              <WorkspaceFormField label="Type">
                <WorkspaceSelect options={["Added", "Changed", "Fixed", "Security", "Removed", "release", "pre-release", "hotfix"].map((value) => ({ label: value, value }))} value={form.type} onValueChange={(type) => setForm((current) => ({ ...current, type }))} />
              </WorkspaceFormField>
              <WorkspaceFormField label="Owner/team">
                <Input className="h-11 rounded-md" value={form.ownerTeam} onChange={(event) => setForm((current) => ({ ...current, ownerTeam: event.target.value }))} />
              </WorkspaceFormField>
              <WorkspaceFormField label="Platform">
                <WorkspaceAutocomplete createLabel="Use platform" options={lookups.platformOptions} value={form.platformKey} onChange={(value) => setForm((current) => ({ ...current, platformKey: value ?? "" }))} onCreate={(query) => setForm((current) => ({ ...current, platformKey: query }))} />
              </WorkspaceFormField>
              <WorkspaceFormField label="Module group">
                <WorkspaceAutocomplete createLabel="Use group" options={lookups.groupOptions} value={form.moduleGroupKey} onChange={(value) => setForm((current) => ({ ...current, moduleGroupKey: value ?? "" }))} onCreate={(query) => setForm((current) => ({ ...current, moduleGroupKey: query }))} />
              </WorkspaceFormField>
              <WorkspaceFormField label="Module lookup">
                <WorkspaceAutocomplete
                  createLabel="Use module"
                  options={lookups.moduleOptions}
                  value={form.moduleId}
                  onChange={(value, option) => {
                    const selected = option as ReferenceLookups["moduleOptions"][number] | undefined;
                    setForm((current) => ({ ...current, moduleId: value ?? "", moduleKey: selected?.moduleKey ?? "", moduleGroupKey: selected?.groupKey ?? current.moduleGroupKey, platformKey: selected?.platformKey ?? current.platformKey }));
                  }}
                  onCreate={(query) => setForm((current) => ({ ...current, moduleId: query }))}
                />
              </WorkspaceFormField>
              <WorkspaceFormField label="Module key">
                <Input className="h-11 rounded-md font-mono" value={form.moduleKey} onChange={(event) => setForm((current) => ({ ...current, moduleKey: event.target.value }))} />
              </WorkspaceFormField>
              <WorkspaceFormField label="GitHub PR">
                <Input className="h-11 rounded-md font-mono" value={form.githubPr} onChange={(event) => setForm((current) => ({ ...current, githubPr: event.target.value }))} />
              </WorkspaceFormField>
              <WorkspaceFormField label="Git commit">
                <Input className="h-11 rounded-md font-mono" value={form.githubCommit} onChange={(event) => setForm((current) => ({ ...current, githubCommit: event.target.value }))} />
              </WorkspaceFormField>
              <WorkspaceFormField label="GitHub URL">
                <Input className="h-11 rounded-md" value={form.githubUrl} onChange={(event) => setForm((current) => ({ ...current, githubUrl: event.target.value }))} />
              </WorkspaceFormField>
              <WorkspaceFormField label="Labels">
                <ReleaseTagsField value={form.labels} onChange={(labels) => setForm((current) => ({ ...current, labels }))} />
              </WorkspaceFormField>
              <WorkspaceFormField label="Reference type">
                <WorkspaceSelect options={["platform", "module-group", "module", "feature", "action", "api", "screen", "database", "issue", "pull-request", "discussion", "release", "working-release", "deployed-release"].map((value) => ({ label: value, value }))} value={form.referenceType} onValueChange={(referenceType) => setForm((current) => ({ ...current, referenceType }))} />
              </WorkspaceFormField>
              <WorkspaceFormField label="Reference no">
                <Input className="h-11 rounded-md font-mono" placeholder="PM-REF-001 or external id" value={form.referenceId} onChange={(event) => setForm((current) => ({ ...current, referenceId: event.target.value }))} />
              </WorkspaceFormField>
            </WorkspaceFormGrid>
            <div className="mt-4 space-y-4">
              <WorkspaceFormField label={kind === "releases" ? "Deployed release summary" : "Working change summary"}>
                <Textarea className="min-h-20 rounded-md" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              </WorkspaceFormField>
              {kind === "releases" ? (
                <WorkspaceFormField label="Deployed release notes">
                  <WorkspaceEditor content={form.changeItems} placeholder="Write highlights, known issues, migration notes, or rollout notes..." onChange={(changeItems) => setForm((current) => ({ ...current, changeItems }))} />
                </WorkspaceFormField>
              ) : null}
              <div className={cn("flex min-h-12 items-center justify-between rounded-md border px-4 py-3", form.active ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-border bg-muted/40 text-muted-foreground")}>
                <span className="text-sm font-semibold"><CheckCircle2 className="mr-2 inline size-4" />Active</span>
                <Switch checked={form.active} onCheckedChange={(checked) => setForm((current) => ({ ...current, active: checked }))} />
              </div>
            </div>
          </div>
          <DialogFooter className="border-t border-border/70 px-5 py-4">
            <Button type="button" variant="outline" className="rounded-md" onClick={onClose}>
              <X className="size-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="rounded-md bg-foreground text-background hover:bg-foreground/90">
              <Save className="size-4" />
              {loading ? "Saving..." : record ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReleaseTagsField({ onChange, value }: { onChange: (value: string) => void; value: string }) {
  const [draft, setDraft] = useState("");
  const tags = value.split(",").map((label) => label.trim()).filter(Boolean);

  function commit(next = draft) {
    const clean = next.trim().replace(/,$/, "");
    if (!clean) return;
    onChange(Array.from(new Set([...tags, clean])).join(", "));
    setDraft("");
  }

  function remove(tag: string) {
    onChange(tags.filter((item) => item !== tag).join(", "));
  }

  return (
    <div className="flex min-h-11 flex-wrap gap-1 rounded-md border border-border bg-background p-1.5">
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
        onBlur={() => commit()}
        onChange={(event) => setDraft(event.target.value)}
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
  );
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
        moduleOptions.push({ groupKey: group.groupKey, label: `${platform.name} / ${group.name} / ${module.name}`, moduleKey: module.moduleKey, platformKey: platform.platform, value: module.id });
      }
    }
  }
  return { groupOptions, moduleOptions, platformOptions };
}

function formFromRecord(record: ReleaseRecord | null, kind: ReleaseNotesKind, defaultVersion = ""): ReleaseForm {
  const form: ReleaseForm = {
    active: record?.active ?? true,
    changeItems: changeItemsFromRecord(record).join("\n"),
    description: record?.description ?? "",
    githubBranch: record?.githubBranch ?? "",
    githubCommit: record?.githubCommit ?? "",
    githubPr: record?.githubPr ?? "",
    githubUrl: record?.githubUrl ?? "",
    key: record?.key ?? `${kind === "releases" ? "release" : "changelog"}.${Date.now()}`,
    labels: record?.labels?.join(", ") ?? "",
    moduleGroupKey: record?.moduleGroupKey ?? "",
    moduleId: record?.moduleId ?? "",
    moduleKey: record?.moduleKey ?? "",
    ownerTeam: record?.ownerTeam ?? "Platform",
    platformKey: record?.platformKey ?? "",
    referenceId: record?.referenceId ?? "",
    referenceType: record?.referenceType ?? (kind === "releases" ? "deployed-release" : "working-release"),
    reviewer: record?.reviewer ?? "",
    richNotes: record?.richNotes ?? "",
    sortOrder: record ? String(record.sortOrder) : "0",
    status: record?.status ?? (kind === "releases" ? "planned" : "released"),
    title: record?.title ?? "",
    type: record?.type ?? (kind === "releases" ? "release" : "Changed"),
    version: record?.version ?? defaultVersion
  };
  return record?.id ? { ...form, id: record.id } : form;
}

function payloadFromForm(form: ReleaseForm) {
  return {
    ...form,
    labels: form.labels.split(",").map((label) => label.trim()).filter(Boolean),
    richNotes: form.changeItems,
    sortOrder: Number(form.sortOrder) || 0
  };
}

function changeItemsFromRecord(record: Pick<ReleaseRecord, "description" | "richNotes" | "title"> | null) {
  const source = record?.richNotes || "";
  const items = source.split(/\r?\n/).map((line) => line.replace(/^[-*]\s*/, "").trim()).filter(Boolean);
  return items.length ? items : record?.description ? [record.description] : record?.title ? [record.title] : [];
}

function titleForKind(kind: ReleaseNotesKind) {
  return kind === "releases" ? "Deployed release" : "Working release";
}

async function invalidate(queryClient: ReturnType<typeof useQueryClient>, kind: ReleaseNotesKind) {
  await queryClient.invalidateQueries({ queryKey: ["admin", "project-manager", "maturity", kind] });
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "";
}

function showError(title: string, error: unknown) {
  toast.error(title, { description: error instanceof Error ? error.message : "Please try again." });
}

function Header({ children }: { children: string }) {
  return <WorkspaceTableHeaderCell>{children}</WorkspaceTableHeaderCell>;
}
