import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, CheckCircle2, ChevronRight, CircleAlert, Pencil, Plus, RefreshCw, Save, Sparkles, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@codexsun/ui/components/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@codexsun/ui/components/dialog"
import { Input } from "@codexsun/ui/components/input"
import { Switch } from "@codexsun/ui/components/switch"
import { Textarea } from "@codexsun/ui/components/textarea"
import { WorkspacePage } from "@codexsun/ui/workspace/page"
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters"
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination"
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions"
import { WorkspaceShowCard, WorkspaceShowLayout, WorkspaceDetailTable } from "@codexsun/ui/workspace/show"
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status"
import { WorkspaceTableEmptyState, WorkspaceTableHeaderCell, WorkspaceTablePanel, WorkspaceTableSkeletonRows } from "@codexsun/ui/workspace/table"
import { WorkspaceFormBanner, WorkspaceFormField, WorkspaceFormGrid, WorkspaceFormPanel, WorkspaceUpsertPage } from "@codexsun/ui/workspace/upsert"
import { buildShowingLabel } from "@codexsun/ui/workspace/utils"
import { WorkspaceAutocomplete } from "@codexsun/ui/workspace/autocomplete"
import { WorkspaceEditor } from "@codexsun/ui/workspace/editor"
import { cn } from "@codexsun/ui/lib/utils"
import { apiDelete, apiGet, apiPost, apiPut } from "../../api"

type Level = "platform" | "group" | "module" | "feature"

type BaseRecord = {
  active: boolean
  description: string
  id: string
  name: string
  status: string
}

type PlatformRecord = BaseRecord & {
  platform: string
}

type ModuleGroupRecord = BaseRecord & {
  groupKey: string
  platformRegistryId: string
  sortOrder: number
}

type ModuleRegistryRecord = BaseRecord & {
  moduleGroupId: string
  moduleKey: string
  moduleType: string
  parentModuleId: string
  routePath: string
  sortOrder: number
}

type FeatureRegistryRecord = BaseRecord & {
  featureKey: string
  moduleId: string
  permissionKey: string
  routePath: string
  sortOrder: number
  type: string
}

type DetailKind = "action" | "api" | "screen" | "database" | "planning" | "note"

type DetailRecord = BaseRecord & {
  acceptanceCriteria: string
  auditEvent: string
  blockers: string
  componentPath: string
  defaultValue: string
  dependencyKeys: string[]
  featureId: string
  fieldName: string
  fieldNature: string
  fieldType: string
  indexed: boolean
  key: string
  kind: DetailKind
  lifecycleAction: boolean
  method: string
  migrationId: string
  moduleId: string
  nullable: boolean
  operation: string
  ownerTeam: string
  pageType: string
  permissionKey: string
  planType: string
  relation: string
  richNotes: string
  riskLevel: string
  routePath: string
  scope: string
  softDelete: boolean
  sortOrder: number
  subscriptionFlagKey: string
  tableName: string
  tableScope: string
  tenantRequired: boolean
  testPath: string
  validationPlan: string
  unique: boolean
  version: string
}

type AnyRecord = PlatformRecord | ModuleGroupRecord | ModuleRegistryRecord | FeatureRegistryRecord

type DetailFormState = {
  acceptanceCriteria: string
  active: boolean
  auditEvent: string
  blockers: string
  componentPath: string
  defaultValue: string
  dependencyKeys: string
  description: string
  featureId: string
  fieldName: string
  fieldNature: string
  fieldType: string
  id?: string
  indexed: boolean
  key: string
  lifecycleAction: boolean
  method: string
  migrationId: string
  name: string
  nullable: boolean
  operation: string
  ownerTeam: string
  pageType: string
  permissionKey: string
  planType: string
  relation: string
  richNotes: string
  riskLevel: string
  routePath: string
  scope: string
  softDelete: boolean
  sortOrder: string
  subscriptionFlagKey: string
  tableName: string
  tableScope: string
  tenantRequired: boolean
  testPath: string
  validationPlan: string
  unique: boolean
  version: string
}

type RegistryIssueTarget =
  | { kind: Level; record: AnyRecord }
  | { kind: "feature"; record: FeatureRegistryRecord }
  | { kind: DetailKind; record: DetailRecord }

type DrillView =
  | { mode: "list" }
  | { mode: "show"; level: Level; record: AnyRecord }
  | { mode: "upsert"; level: Level; record: AnyRecord | null; returnTo: "list" | "show" }

type FormState = {
  active: boolean
  description: string
  id?: string
  keyValue: string
  name: string
  parentModuleId: string
  permissionKey: string
  routePath: string
  sortOrder: string
  type: string
}

const statusFilters = [
  { id: "all", label: "All records" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" }
]

export function PlatformRegistry({ onBack: _onBack }: { onBack: () => void }) {
  const queryClient = useQueryClient()
  const [level, setLevel] = useState<Level>("platform")
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformRecord | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<ModuleGroupRecord | null>(null)
  const [selectedModule, setSelectedModule] = useState<ModuleRegistryRecord | null>(null)
  const [view, setView] = useState<DrillView>({ mode: "list" })
  const [platformDialogRecord, setPlatformDialogRecord] = useState<PlatformRecord | null>(null)
  const [platformDialogOpen, setPlatformDialogOpen] = useState(false)
  const [groupDialogRecord, setGroupDialogRecord] = useState<ModuleGroupRecord | null>(null)
  const [groupDialogOpen, setGroupDialogOpen] = useState(false)
  const [moduleDialogRecord, setModuleDialogRecord] = useState<ModuleRegistryRecord | null>(null)
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false)
  const [featureDialogRecord, setFeatureDialogRecord] = useState<FeatureRegistryRecord | null>(null)
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false)
  const [detailDialog, setDetailDialog] = useState<{ kind: DetailKind; record: DetailRecord | null } | null>(null)
  const [pendingForceDelete, setPendingForceDelete] = useState<{ level: Level; record: AnyRecord } | { kind: DetailKind; record: DetailRecord } | null>(null)
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(100)
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    description: true,
    key: true,
    name: true,
    routePath: true,
    sortOrder: true,
    status: true
  })

  const platformsQuery = useQuery<PlatformRecord[]>({
    queryKey: ["admin", "platform-registry"],
    queryFn: () => apiGet<PlatformRecord[]>("/admin/platform-registry", "sa")
  })

  const groupsQuery = useQuery<ModuleGroupRecord[]>({
    enabled: Boolean(selectedPlatform),
    queryKey: ["admin", "platform-registry", selectedPlatform?.id, "module-groups"],
    queryFn: () => apiGet<ModuleGroupRecord[]>(`/admin/platform-registry/${selectedPlatform?.id}/module-groups`, "sa")
  })

  const modulesQuery = useQuery<ModuleRegistryRecord[]>({
    enabled: Boolean(selectedGroup),
    queryKey: ["admin", "platform-module-groups", selectedGroup?.id, "modules"],
    queryFn: () => apiGet<ModuleRegistryRecord[]>(`/admin/platform-module-groups/${selectedGroup?.id}/modules`, "sa")
  })

  const featuresQuery = useQuery<FeatureRegistryRecord[]>({
    enabled: Boolean(selectedModule),
    queryKey: ["admin", "platform-module-registry", selectedModule?.id, "features"],
    queryFn: () => apiGet<FeatureRegistryRecord[]>(`/admin/platform-module-registry/${selectedModule?.id}/features`, "sa")
  })

  const actionQuery = useDetailQuery("action", selectedModule)
  const apiQuery = useDetailQuery("api", selectedModule)
  const screenQuery = useDetailQuery("screen", selectedModule)
  const databaseQuery = useDetailQuery("database", selectedModule)
  const planningQuery = useDetailQuery("planning", selectedModule)
  const noteQuery = useDetailQuery("note", selectedModule)

  const activeQuery = level === "platform" ? platformsQuery : level === "group" ? groupsQuery : modulesQuery
  const records = (activeQuery.data ?? []) as AnyRecord[]
  const moduleParentNames = useMemo(() => {
    if (level !== "module") return new Map<string, string>()
    return new Map((records as ModuleRegistryRecord[]).map((module) => [module.id, module.name]))
  }, [level, records])
  const displayRecords = useMemo(() => (level === "module" ? orderModuleRecords(records as ModuleRegistryRecord[]) : records), [level, records])

  const saveMutation = useMutation({
    mutationFn: (form: FormState) => saveRecord(level, form, selectedPlatform, selectedGroup, selectedModule),
    onSuccess: async (record: AnyRecord) => {
      await invalidateLevel(queryClient, level, selectedPlatform, selectedGroup)
      toast.success(`${labelForLevel(level)} saved`, {
        description: `${record.name} is ready in the ${labelForLevel(level).toLowerCase()} list.`
      })
      if (level === "platform" && platformDialogOpen) {
        setPlatformDialogOpen(false)
        setPlatformDialogRecord(null)
        setView({ mode: "list" })
        return
      }
      if (level === "group" && groupDialogOpen) {
        setGroupDialogOpen(false)
        setGroupDialogRecord(null)
        setView({ mode: "list" })
        return
      }
      if (level === "module" && moduleDialogOpen) {
        setModuleDialogOpen(false)
        setModuleDialogRecord(null)
        setView({ mode: "list" })
        return
      }
      if (level === "feature" && featureDialogOpen) {
        setFeatureDialogOpen(false)
        setFeatureDialogRecord(null)
        setLevel("module")
        return
      }
      setView({ mode: "show", level, record })
    },
    onError: (error) => showRegistryError(`${labelForLevel(level)} save failed`, error)
  })

  const updateMutation = useMutation({
    mutationFn: (form: FormState & { id: string }) => updateRecord(level, form),
    onSuccess: async (record: AnyRecord) => {
      await invalidateLevel(queryClient, level, selectedPlatform, selectedGroup)
      toast.success(`${labelForLevel(level)} updated`, {
        description: `${record.name} was updated successfully.`
      })
      if (level === "platform" && platformDialogOpen) {
        setPlatformDialogOpen(false)
        setPlatformDialogRecord(null)
        setView({ mode: "list" })
        return
      }
      if (level === "group" && groupDialogOpen) {
        setGroupDialogOpen(false)
        setGroupDialogRecord(null)
        setView({ mode: "list" })
        return
      }
      if (level === "module" && moduleDialogOpen) {
        setModuleDialogOpen(false)
        setModuleDialogRecord(null)
        setView({ mode: "list" })
        return
      }
      if (level === "feature" && featureDialogOpen) {
        setFeatureDialogOpen(false)
        setFeatureDialogRecord(null)
        setLevel("module")
        return
      }
      setView({ mode: "show", level, record })
    },
    onError: (error) => showRegistryError(`${labelForLevel(level)} update failed`, error)
  })

  const deactivateMutation = useMutation({
    mutationFn: (record: AnyRecord) => lifecycleRecord(level, record.id, "deactivate"),
    onSuccess: async (record: AnyRecord) => {
      await invalidateLevel(queryClient, level, selectedPlatform, selectedGroup)
      toast.warning(`${labelForLevel(level)} deactivated`, { description: `${record.name} is now inactive.` })
      if (level === "feature") {
        setLevel("module")
        return
      }
      setView((current) => (current.mode === "show" ? { mode: "show", level, record } : current))
    },
    onError: (error) => showRegistryError(`${labelForLevel(level)} deactivate failed`, error)
  })

  const restoreMutation = useMutation({
    mutationFn: (record: AnyRecord) => lifecycleRecord(level, record.id, "restore"),
    onSuccess: async (record: AnyRecord) => {
      await invalidateLevel(queryClient, level, selectedPlatform, selectedGroup)
      toast.info(`${labelForLevel(level)} restored`, { description: `${record.name} is active again.` })
      if (level === "feature") {
        setLevel("module")
        return
      }
      setView((current) => (current.mode === "show" ? { mode: "show", level, record } : current))
    },
    onError: (error) => showRegistryError(`${labelForLevel(level)} restore failed`, error)
  })

  const forceDeleteMutation = useMutation({
    mutationFn: ({ level: deleteLevel, record }: { level: Level; record: AnyRecord }) => forceDeleteRecord(deleteLevel, record.id),
    onSuccess: async (_result, variables) => {
      await invalidateLevel(queryClient, variables.level, selectedPlatform, selectedGroup)
      toast.success(`${labelForLevel(variables.level)} force deleted`, {
        description: `${variables.record.name} was permanently deleted.`
      })
      setPendingForceDelete(null)
      if (variables.level === "feature") {
        setLevel("module")
        return
      }
      setView({ mode: "list" })
    },
    onError: (error) => showRegistryError("Force delete failed", error)
  })

  const detailSaveMutation = useMutation({
    mutationFn: ({ form, kind }: { form: DetailFormState; kind: DetailKind }) => {
      if (!selectedModule) throw new Error("Select a module before saving this registry record.")
      return apiPost<DetailRecord>(`/admin/project-manager/${detailPath(kind)}`, detailPayload(form, selectedModule.id), "sa")
    },
    onSuccess: async (record, variables) => {
      await invalidateDetail(queryClient, variables.kind, selectedModule)
      toast.success(`${detailLabel(variables.kind)} saved`, { description: `${record.name} is now mapped.` })
      setDetailDialog(null)
    },
    onError: (error) => showRegistryError("Registry save failed", error)
  })

  const detailUpdateMutation = useMutation({
    mutationFn: ({ form, kind }: { form: DetailFormState & { id: string }; kind: DetailKind }) =>
      apiPut<DetailRecord>(`/admin/project-manager/${detailPath(kind)}/${form.id}`, detailPayload(form), "sa"),
    onSuccess: async (record, variables) => {
      await invalidateDetail(queryClient, variables.kind, selectedModule)
      toast.success(`${detailLabel(variables.kind)} updated`, { description: `${record.name} was updated.` })
      setDetailDialog(null)
    },
    onError: (error) => showRegistryError("Registry update failed", error)
  })

  const detailLifecycleMutation = useMutation({
    mutationFn: ({ action, kind, record }: { action: "deactivate" | "restore"; kind: DetailKind; record: DetailRecord }) =>
      apiPost<DetailRecord>(`/admin/project-manager/${detailPath(kind)}/${record.id}/${action}`, {}, "sa"),
    onSuccess: async (_record, variables) => {
      await invalidateDetail(queryClient, variables.kind, selectedModule)
      toast.info(`${detailLabel(variables.kind)} ${variables.action === "restore" ? "restored" : "deactivated"}`)
    },
    onError: (error) => showRegistryError("Registry lifecycle failed", error)
  })

  const detailForceDeleteMutation = useMutation({
    mutationFn: ({ kind, record }: { kind: DetailKind; record: DetailRecord }) =>
      apiDelete<{ deleted: boolean; id: string; name: string }>(`/admin/project-manager/${detailPath(kind)}/${record.id}`, "sa"),
    onSuccess: async (_result, variables) => {
      await invalidateDetail(queryClient, variables.kind, selectedModule)
      toast.success(`${detailLabel(variables.kind)} force deleted`, { description: `${variables.record.name} was permanently deleted.` })
      setPendingForceDelete(null)
    },
    onError: (error) => showRegistryError("Force delete failed", error)
  })

  const raiseIssueMutation = useMutation({
    mutationFn: (target: RegistryIssueTarget) => apiPost<{ id: string; key: string; title: string }>(
      "/admin/project-manager/maturity/issues",
      registryIssuePayload(target, selectedPlatform, selectedGroup, selectedModule),
      "sa"
    ),
    onSuccess: (record) => {
      toast.success("Issue raised", { description: record.key })
    },
    onError: (error) => showRegistryError("Issue raise failed", error)
  })

  const magicFillMutation = useMutation({
    mutationFn: async ({ target }: { target: "features" | DetailKind }) => {
      if (!selectedModule) throw new Error("Select a module before running magic fill.")
      if (target === "features") {
        const existing = featuresQuery.data ?? []
        const existingKeys = new Set(existing.map((feature) => feature.featureKey.toLowerCase()))
        const suggestions = magicFeatureForms(selectedModule).filter((feature) => !existingKeys.has(feature.keyValue.toLowerCase()))
        const records = await Promise.all(suggestions.map((form) => apiPost<FeatureRegistryRecord>("/admin/platform-feature-registry", featurePayload(form, selectedModule.id), "sa")))
        return { count: records.length, target }
      }
      const existing = detailRecordsForKind(target, { actionQuery, apiQuery, databaseQuery, noteQuery, planningQuery, screenQuery })
      const existingKeys = new Set((existing.data ?? []).map((record) => record.key.toLowerCase()))
      const suggestions = magicDetailForms(target, selectedModule, featuresQuery.data ?? []).filter((form) => !existingKeys.has(form.key.toLowerCase()))
      const records = await Promise.all(suggestions.map((form) => apiPost<DetailRecord>(`/admin/project-manager/${detailPath(target)}`, detailPayload(form, selectedModule.id), "sa")))
      return { count: records.length, target }
    },
    onSuccess: async (result) => {
      if (result.target === "features") await queryClient.invalidateQueries({ queryKey: ["admin", "platform-module-registry", selectedModule?.id, "features"] })
      else await invalidateDetail(queryClient, result.target, selectedModule)
      toast.success("Magic fill complete", {
        description: result.count ? `${result.count} missing record${result.count === 1 ? "" : "s"} added.` : "Everything already matches the current rules."
      })
    },
    onError: (error) => showRegistryError("Magic fill failed", error)
  })

  const filteredRecords = useMemo(() => {
    const term = searchValue.trim().toLowerCase()
    return displayRecords.filter((record) => {
      const status = record.active ? "active" : "inactive"
      const parentName = level === "module" ? moduleParentNames.get((record as ModuleRegistryRecord).parentModuleId) ?? "" : ""
      const searchable = [record.name, record.description, parentName, status, recordKey(level, record), routePath(level, record), sortOrder(level, record)]
      const matchesSearch = !term || searchable.some((value) => value.toLowerCase().includes(term))
      const matchesStatus = statusFilter === "all" || status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [displayRecords, level, moduleParentNames, searchValue, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / rowsPerPage))
  const pageRecords = filteredRecords.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
  const columns = columnsForLevel(level)

  function resetListState(nextLevel: Level) {
    setLevel(nextLevel)
    setView({ mode: "list" })
    setSearchValue("")
    setStatusFilter("all")
    setCurrentPage(1)
  }

  function drillPlatform(record: PlatformRecord) {
    setSelectedPlatform(record)
    setSelectedGroup(null)
    resetListState("group")
  }

  function drillGroup(record: ModuleGroupRecord) {
    setSelectedGroup(record)
    setSelectedModule(null)
    resetListState("module")
  }

  function backOneLevel() {
    if (level === "module") {
      setSelectedGroup(null)
      setSelectedModule(null)
      resetListState("group")
      return
    }
    if (level === "group") {
      setSelectedPlatform(null)
      setSelectedGroup(null)
      resetListState("platform")
    }
  }

  function submitForm(form: FormState) {
    if (form.id) {
      updateMutation.mutate({ ...form, id: form.id })
      return
    }
    saveMutation.mutate(form)
  }

  function openUpsert(record: AnyRecord | null, returnTo: "list" | "show") {
    if (level === "platform") {
      setPlatformDialogRecord(record as PlatformRecord | null)
      setPlatformDialogOpen(true)
      return
    }
    if (level === "group") {
      setGroupDialogRecord(record as ModuleGroupRecord | null)
      setGroupDialogOpen(true)
      return
    }
    if (level === "module") {
      setModuleDialogRecord(record as ModuleRegistryRecord | null)
      setModuleDialogOpen(true)
      return
    }
    if (level === "feature") {
      setFeatureDialogRecord(record as FeatureRegistryRecord | null)
      setFeatureDialogOpen(true)
      return
    }
    setView({ mode: "upsert", level, record, returnTo })
  }

  function submitPlatformDialog(form: FormState) {
    if (form.id) {
      updateMutation.mutate({ ...form, id: form.id })
      return
    }
    saveMutation.mutate(form)
  }

  function submitGroupDialog(form: FormState) {
    if (form.id) {
      updateMutation.mutate({ ...form, id: form.id })
      return
    }
    saveMutation.mutate(form)
  }

  function submitModuleDialog(form: FormState) {
    if (form.id) {
      updateMutation.mutate({ ...form, id: form.id })
      return
    }
    saveMutation.mutate(form)
  }

  function submitFeatureDialog(form: FormState) {
    if (form.id) {
      updateMutation.mutate({ ...form, id: form.id })
      return
    }
    saveMutation.mutate(form)
  }

  if (view.mode === "show") {
    return (
      <>
        <RegistryShowPage
          actionData={actionQuery.data ?? []}
          actionLoading={actionQuery.isFetching}
          apiData={apiQuery.data ?? []}
          apiLoading={apiQuery.isFetching}
          databaseData={databaseQuery.data ?? []}
          databaseLoading={databaseQuery.isFetching}
          features={featuresQuery.data ?? []}
          featuresLoading={featuresQuery.isFetching}
          level={view.level}
          noteData={noteQuery.data ?? []}
          noteLoading={noteQuery.isFetching}
          planningData={planningQuery.data ?? []}
          planningLoading={planningQuery.isFetching}
          record={view.record}
          screenData={screenQuery.data ?? []}
          screenLoading={screenQuery.isFetching}
          onBack={() => setView({ mode: "list" })}
          onDeactivate={() => deactivateMutation.mutate(view.record)}
          onEdit={() => {
            if (view.level === "platform") {
              setPlatformDialogRecord(view.record as PlatformRecord)
              setPlatformDialogOpen(true)
              return
            }
            if (view.level === "group") {
              setGroupDialogRecord(view.record as ModuleGroupRecord)
              setGroupDialogOpen(true)
              return
            }
            if (view.level === "module") {
              setModuleDialogRecord(view.record as ModuleRegistryRecord)
              setModuleDialogOpen(true)
            }
          }}
          onFeatureCreate={() => {
            setLevel("feature")
            setFeatureDialogRecord(null)
            setFeatureDialogOpen(true)
          }}
          onFeatureDeactivate={(record) => {
            setLevel("feature")
            deactivateMutation.mutate(record)
          }}
          onFeatureEdit={(record) => {
            setLevel("feature")
            setFeatureDialogRecord(record)
            setFeatureDialogOpen(true)
          }}
          onFeatureForceDelete={(record) => setPendingForceDelete({ level: "feature", record })}
          onFeatureRestore={(record) => {
            setLevel("feature")
            restoreMutation.mutate(record)
          }}
          onFeaturesRefresh={() => void featuresQuery.refetch()}
          onDetailCreate={(kind) => setDetailDialog({ kind, record: null })}
          onDetailDeactivate={(kind, record) => detailLifecycleMutation.mutate({ action: "deactivate", kind, record })}
          onDetailEdit={(kind, record) => setDetailDialog({ kind, record })}
          onDetailForceDelete={(kind, record) => setPendingForceDelete({ kind, record })}
          onDetailRefresh={(kind) => void detailQueryForKind(kind, { actionQuery, apiQuery, databaseQuery, noteQuery, planningQuery, screenQuery }).refetch()}
          onDetailRestore={(kind, record) => detailLifecycleMutation.mutate({ action: "restore", kind, record })}
          onForceDelete={() => setPendingForceDelete({ level: view.level, record: view.record })}
          onMagicFill={(target) => magicFillMutation.mutate({ target })}
          onRaiseIssue={(target) => raiseIssueMutation.mutate(target)}
          magicFillTarget={magicFillMutation.variables?.target ?? null}
          magicFilling={magicFillMutation.isPending}
          onRestore={() => restoreMutation.mutate(view.record)}
        />
        <PlatformRegistryDialog
          errorMessage={errorMessage(saveMutation.error ?? updateMutation.error)}
          loading={saveMutation.isPending || updateMutation.isPending}
          open={platformDialogOpen}
          record={platformDialogRecord}
          onClose={() => {
            setPlatformDialogOpen(false)
            setPlatformDialogRecord(null)
          }}
          onSubmit={submitPlatformDialog}
        />
        <ModuleGroupDialog
          errorMessage={errorMessage(saveMutation.error ?? updateMutation.error)}
          loading={saveMutation.isPending || updateMutation.isPending}
          open={groupDialogOpen}
          record={groupDialogRecord}
          onClose={() => {
            setGroupDialogOpen(false)
            setGroupDialogRecord(null)
          }}
          onSubmit={submitGroupDialog}
        />
        <ModuleRegistryDialog
          errorMessage={errorMessage(saveMutation.error ?? updateMutation.error)}
          loading={saveMutation.isPending || updateMutation.isPending}
          open={moduleDialogOpen}
          record={moduleDialogRecord}
          onClose={() => {
            setModuleDialogOpen(false)
            setModuleDialogRecord(null)
          }}
          onSubmit={submitModuleDialog}
        />
        <FeatureRegistryDialog
          errorMessage={errorMessage(saveMutation.error ?? updateMutation.error)}
          loading={saveMutation.isPending || updateMutation.isPending}
          open={featureDialogOpen}
          record={featureDialogRecord}
          onClose={() => {
            setFeatureDialogOpen(false)
            setFeatureDialogRecord(null)
            setLevel(view.level)
          }}
          onSubmit={submitFeatureDialog}
        />
        <DetailRegistryDialog
          errorMessage={errorMessage(detailSaveMutation.error ?? detailUpdateMutation.error)}
          features={featuresQuery.data ?? []}
          kind={detailDialog?.kind ?? "action"}
          loading={detailSaveMutation.isPending || detailUpdateMutation.isPending}
          module={selectedModule}
          open={Boolean(detailDialog)}
          record={detailDialog?.record ?? null}
          onClose={() => setDetailDialog(null)}
          onSubmit={(form) => {
            if (!detailDialog) return
            if (form.id) detailUpdateMutation.mutate({ form: { ...form, id: form.id }, kind: detailDialog.kind })
            else detailSaveMutation.mutate({ form, kind: detailDialog.kind })
          }}
        />
        <ForceDeleteDialog
          deleting={forceDeleteMutation.isPending || detailForceDeleteMutation.isPending}
          pending={pendingForceDelete}
          onClose={() => setPendingForceDelete(null)}
          onConfirm={() => {
            if (!pendingForceDelete) return
            if ("kind" in pendingForceDelete) detailForceDeleteMutation.mutate(pendingForceDelete)
            else forceDeleteMutation.mutate(pendingForceDelete)
          }}
        />
      </>
    )
  }

  if (view.mode === "upsert") {
    return (
      <RegistryUpsertPage
        errorMessage={errorMessage(saveMutation.error ?? updateMutation.error)}
        level={view.level}
        loading={saveMutation.isPending || updateMutation.isPending}
        record={view.record}
        onBack={() => setView(view.returnTo === "show" && view.record ? { mode: "show", level: view.level, record: view.record } : { mode: "list" })}
        onSubmit={submitForm}
      />
    )
  }

  return (
    <WorkspacePage
      title={titleForLevel(level, selectedPlatform, selectedGroup)}
      description={descriptionForLevel(level, selectedPlatform, selectedGroup)}
      technicalName={`page.project-manager.${level}-registry.list`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {level !== "platform" ? (
            <Button type="button" variant="outline" className="h-9 rounded-md" onClick={backOneLevel}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
          ) : null}
          <Button
            className="h-9 rounded-md"
            disabled={activeQuery.isFetching}
            onClick={() => void activeQuery.refetch()}
            type="button"
            variant="outline"
          >
            <RefreshCw className={cn("size-4", activeQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button type="button" className="h-9 rounded-md" onClick={() => openUpsert(null, "list")}>
            <Plus className="size-4" />
            New {labelForLevel(level).toLowerCase()}
          </Button>
        </div>
      }
    >
      <WorkspaceFilters
        columnOptions={columns.map((column) => ({
          id: column.id,
          label: column.label,
          checked: visibleColumns[column.id] ?? true,
          onCheckedChange: (checked) => setVisibleColumns((current) => ({ ...current, [column.id]: checked }))
        }))}
        filterOptions={statusFilters}
        filterValue={statusFilter}
        onFilterValueChange={(value) => {
          setStatusFilter(value)
          setCurrentPage(1)
        }}
        onSearchValueChange={(value) => {
          setSearchValue(value)
          setCurrentPage(1)
        }}
        onShowAllColumns={() => setVisibleColumns((current) => ({ ...current, ...Object.fromEntries(columns.map((column) => [column.id, true])) }))}
        searchPlaceholder={`Search ${labelForLevel(level).toLowerCase()} records`}
        searchValue={searchValue}
      />
      <WorkspaceTablePanel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead className="bg-muted/50">
              <tr>
                <RegistryHeader>#</RegistryHeader>
                {columns.map((column) => (visibleColumns[column.id] ? <RegistryHeader key={column.id}>{column.label}</RegistryHeader> : null))}
                <RegistryHeader className="text-right">Action</RegistryHeader>
              </tr>
            </thead>
            <tbody>
              {pageRecords.map((record, index) => (
                <tr key={record.id} className={cn("border-b border-border/70 last:border-b-0", !record.active && "bg-muted/20 text-muted-foreground")}>
                  <td className="px-4 py-2.5 text-muted-foreground">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                  {visibleColumns.name ? (
                    <td className="px-4 py-2.5">
                      <button
                        className={cn("inline-flex max-w-72 items-center gap-2 truncate font-medium hover:underline", level === "module" && (record as ModuleRegistryRecord).parentModuleId && "pl-5")}
                        type="button"
                        onClick={() => {
                          if (level === "platform") drillPlatform(record as PlatformRecord)
                          else if (level === "group") drillGroup(record as ModuleGroupRecord)
                          else {
                            setSelectedModule(record as ModuleRegistryRecord)
                            setView({ mode: "show", level, record })
                          }
                        }}
                      >
                        {level === "module" && (record as ModuleRegistryRecord).parentModuleId ? <span className="text-muted-foreground">-&gt;</span> : null}
                        {record.name}
                        {level !== "module" ? <ChevronRight className="size-3.5 text-muted-foreground" /> : null}
                      </button>
                    </td>
                  ) : null}
                  {visibleColumns.key ? <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{recordKey(level, record)}</td> : null}
                  {visibleColumns.parent && level === "module" ? <td className="px-4 py-2.5 text-xs text-muted-foreground">{parentModuleName(record as ModuleRegistryRecord, moduleParentNames)}</td> : null}
                  {visibleColumns.routePath && level === "module" ? <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{routePath(level, record) || "-"}</td> : null}
                  {visibleColumns.sortOrder && level !== "platform" ? <td className="px-4 py-2.5 tabular-nums">{sortOrder(level, record)}</td> : null}
                  {visibleColumns.description ? <td className="max-w-md px-4 py-2.5 text-muted-foreground">{record.description || "-"}</td> : null}
                  {visibleColumns.status ? (
                    <td className="px-4 py-2.5">
                      <WorkspaceStatusBadge label={record.active ? "active" : "inactive"} tone={record.active ? "success" : "danger"} />
                    </td>
                  ) : null}
                  <td className="px-4 py-1.5 text-right">
                    <WorkspaceRowActions
                      title={record.name}
                      deleteLabel="Deactivate"
                      isSuspended={!record.active}
                      restoreLabel="Restore"
                      onDelete={() => deactivateMutation.mutate(record)}
                      onEdit={() => openUpsert(record, "list")}
                      onRestore={() => restoreMutation.mutate(record)}
                      onView={() => {
                        if (level === "module") setSelectedModule(record as ModuleRegistryRecord)
                        setView({ mode: "show", level, record })
                      }}
                      actions={[
                        {
                          id: "force-delete",
                          icon: <Trash2 className="size-4" />,
                          label: "Force delete",
                          tone: "destructive",
                          onSelect: () => setPendingForceDelete({ level, record })
                        }
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pageRecords.length === 0 && activeQuery.isFetching ? <WorkspaceTableSkeletonRows columns={columns.length + 2} /> : null}
        {pageRecords.length === 0 && !activeQuery.isFetching ? <WorkspaceTableEmptyState>No {labelForLevel(level).toLowerCase()} records found.</WorkspaceTableEmptyState> : null}
      </WorkspaceTablePanel>
      <WorkspacePagination
        page={currentPage}
        rowsPerPage={rowsPerPage}
        showingLabel={buildShowingLabel(currentPage, rowsPerPage, filteredRecords.length)}
        singularLabel="records"
        totalCount={filteredRecords.length}
        totalPages={totalPages}
        onNextPage={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
        onPageChange={setCurrentPage}
        onPreviousPage={() => setCurrentPage((page) => Math.max(1, page - 1))}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value)
          setCurrentPage(1)
        }}
      />
      <PlatformRegistryDialog
        errorMessage={errorMessage(saveMutation.error ?? updateMutation.error)}
        loading={saveMutation.isPending || updateMutation.isPending}
        open={platformDialogOpen}
        record={platformDialogRecord}
        onClose={() => {
          setPlatformDialogOpen(false)
          setPlatformDialogRecord(null)
        }}
        onSubmit={submitPlatformDialog}
      />
      <ModuleGroupDialog
        errorMessage={errorMessage(saveMutation.error ?? updateMutation.error)}
        loading={saveMutation.isPending || updateMutation.isPending}
        open={groupDialogOpen}
        record={groupDialogRecord}
        onClose={() => {
          setGroupDialogOpen(false)
          setGroupDialogRecord(null)
        }}
        onSubmit={submitGroupDialog}
      />
      <ModuleRegistryDialog
        errorMessage={errorMessage(saveMutation.error ?? updateMutation.error)}
        loading={saveMutation.isPending || updateMutation.isPending}
        open={moduleDialogOpen}
        record={moduleDialogRecord}
        onClose={() => {
          setModuleDialogOpen(false)
          setModuleDialogRecord(null)
        }}
        onSubmit={submitModuleDialog}
      />
      <ForceDeleteDialog
        deleting={forceDeleteMutation.isPending || detailForceDeleteMutation.isPending}
        pending={pendingForceDelete}
        onClose={() => setPendingForceDelete(null)}
        onConfirm={() => {
          if (!pendingForceDelete) return
          if ("kind" in pendingForceDelete) detailForceDeleteMutation.mutate(pendingForceDelete)
          else forceDeleteMutation.mutate(pendingForceDelete)
        }}
      />
    </WorkspacePage>
  )
}

function RegistryShowPage({
  actionData,
  actionLoading,
  apiData,
  apiLoading,
  databaseData,
  databaseLoading,
  features,
  featuresLoading,
  level,
  noteData,
  noteLoading,
  planningData,
  planningLoading,
  record,
  screenData,
  screenLoading,
  onBack,
  onDeactivate,
  onDetailCreate,
  onDetailDeactivate,
  onDetailEdit,
  onDetailForceDelete,
  onDetailRefresh,
  onDetailRestore,
  onEdit,
  onFeatureCreate,
  onFeatureDeactivate,
  onFeatureEdit,
  onFeatureForceDelete,
  onFeatureRestore,
  onFeaturesRefresh,
  onForceDelete,
  onMagicFill,
  magicFilling,
  magicFillTarget,
  onRaiseIssue,
  onRestore
}: {
  actionData: DetailRecord[]
  actionLoading: boolean
  apiData: DetailRecord[]
  apiLoading: boolean
  databaseData: DetailRecord[]
  databaseLoading: boolean
  features: FeatureRegistryRecord[]
  featuresLoading: boolean
  level: Level
  noteData: DetailRecord[]
  noteLoading: boolean
  planningData: DetailRecord[]
  planningLoading: boolean
  record: AnyRecord
  screenData: DetailRecord[]
  screenLoading: boolean
  onBack: () => void
  onDeactivate: () => void
  onDetailCreate: (kind: DetailKind) => void
  onDetailDeactivate: (kind: DetailKind, record: DetailRecord) => void
  onDetailEdit: (kind: DetailKind, record: DetailRecord) => void
  onDetailForceDelete: (kind: DetailKind, record: DetailRecord) => void
  onDetailRefresh: (kind: DetailKind) => void
  onDetailRestore: (kind: DetailKind, record: DetailRecord) => void
  onEdit: () => void
  onFeatureCreate: () => void
  onFeatureDeactivate: (record: FeatureRegistryRecord) => void
  onFeatureEdit: (record: FeatureRegistryRecord) => void
  onFeatureForceDelete: (record: FeatureRegistryRecord) => void
  onFeatureRestore: (record: FeatureRegistryRecord) => void
  onFeaturesRefresh: () => void
  onForceDelete: () => void
  onMagicFill: (target: "features" | DetailKind) => void
  magicFilling: boolean
  magicFillTarget: "features" | DetailKind | null
  onRaiseIssue: (target: RegistryIssueTarget) => void
  onRestore: () => void
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "features" | "actions" | "apis" | "screens" | "database" | "planning" | "notes">("overview")
  const moduleWorkspaceTabs = [
    { id: "overview", label: "Overview" },
    { id: "features", label: "Feature Registry" },
    { id: "actions", label: "Actions" },
    { id: "apis", label: "APIs" },
    { id: "screens", label: "Screens" },
    { id: "database", label: "Database" },
    { id: "planning", label: "Planning" },
    { id: "notes", label: "Model Notes" }
  ] as const

  return (
    <WorkspacePage
      title={record.name}
      description={level === "module" ? "Module working area for features, actions, APIs, screens, database, and planning references." : `Review ${labelForLevel(level).toLowerCase()} identity and lifecycle status.`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" className="h-9 rounded-md" onClick={onBack}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <Button type="button" className="h-9 rounded-md" onClick={onEdit}>
            <Pencil className="size-4" />
            Edit
          </Button>
          <Button type="button" variant="outline" className="h-9 rounded-md" onClick={() => onRaiseIssue({ kind: level, record })}>
            <CircleAlert className="size-4" />
            Raise issue
          </Button>
          <Button type="button" variant="outline" className="h-9 rounded-md" onClick={record.active ? onDeactivate : onRestore}>
            {record.active ? "Deactivate" : "Restore"}
          </Button>
          <Button type="button" variant="outline" className="h-9 rounded-md text-destructive hover:text-destructive" onClick={onForceDelete}>
            <Trash2 className="size-4" />
            Force delete
          </Button>
        </div>
      }
    >
      {level === "module" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 border-b border-border/70">
            {moduleWorkspaceTabs.map((tab) => (
              <button
                key={tab.id}
                className={cn(
                  "h-10 border-b-2 px-3 text-sm font-medium",
                  activeTab === tab.id ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                type="button"
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {activeTab === "overview" ? <ModuleOverviewPanel level={level} record={record} /> : null}
          {activeTab === "features" ? (
            <FeatureRegistryPanel
              features={features}
              loading={featuresLoading}
              onCreate={onFeatureCreate}
              onDeactivate={onFeatureDeactivate}
              onEdit={onFeatureEdit}
              onForceDelete={onFeatureForceDelete}
              onMagicFill={() => onMagicFill("features")}
              magicFilling={magicFilling && magicFillTarget === "features"}
              onRaiseIssue={(feature) => onRaiseIssue({ kind: "feature", record: feature })}
              onRefresh={onFeaturesRefresh}
              onRestore={onFeatureRestore}
            />
          ) : null}
          {activeTab === "actions" ? <DetailRegistryPanel kind="action" loading={actionLoading} magicFilling={magicFilling && magicFillTarget === "action"} records={actionData} onCreate={onDetailCreate} onDeactivate={onDetailDeactivate} onEdit={onDetailEdit} onForceDelete={onDetailForceDelete} onMagicFill={onMagicFill} onRaiseIssue={(detail) => onRaiseIssue({ kind: "action", record: detail })} onRefresh={onDetailRefresh} onRestore={onDetailRestore} /> : null}
          {activeTab === "apis" ? <DetailRegistryPanel kind="api" loading={apiLoading} magicFilling={magicFilling && magicFillTarget === "api"} records={apiData} onCreate={onDetailCreate} onDeactivate={onDetailDeactivate} onEdit={onDetailEdit} onForceDelete={onDetailForceDelete} onMagicFill={onMagicFill} onRaiseIssue={(detail) => onRaiseIssue({ kind: "api", record: detail })} onRefresh={onDetailRefresh} onRestore={onDetailRestore} /> : null}
          {activeTab === "screens" ? <DetailRegistryPanel kind="screen" loading={screenLoading} magicFilling={magicFilling && magicFillTarget === "screen"} records={screenData} onCreate={onDetailCreate} onDeactivate={onDetailDeactivate} onEdit={onDetailEdit} onForceDelete={onDetailForceDelete} onMagicFill={onMagicFill} onRaiseIssue={(detail) => onRaiseIssue({ kind: "screen", record: detail })} onRefresh={onDetailRefresh} onRestore={onDetailRestore} /> : null}
          {activeTab === "database" ? <DetailRegistryPanel kind="database" loading={databaseLoading} magicFilling={magicFilling && magicFillTarget === "database"} records={databaseData} onCreate={onDetailCreate} onDeactivate={onDetailDeactivate} onEdit={onDetailEdit} onForceDelete={onDetailForceDelete} onMagicFill={onMagicFill} onRaiseIssue={(detail) => onRaiseIssue({ kind: "database", record: detail })} onRefresh={onDetailRefresh} onRestore={onDetailRestore} /> : null}
          {activeTab === "planning" ? (
            <PlanningRegistryPanel kind="planning" loading={planningLoading} magicFilling={magicFilling && magicFillTarget === "planning"} records={planningData} onCreate={onDetailCreate} onDeactivate={onDetailDeactivate} onEdit={onDetailEdit} onForceDelete={onDetailForceDelete} onMagicFill={onMagicFill} onRaiseIssue={(detail) => onRaiseIssue({ kind: "planning", record: detail })} onRefresh={onDetailRefresh} onRestore={onDetailRestore} />
          ) : null}
          {activeTab === "notes" ? <DetailRegistryPanel kind="note" loading={noteLoading} magicFilling={magicFilling && magicFillTarget === "note"} records={noteData} onCreate={onDetailCreate} onDeactivate={onDetailDeactivate} onEdit={onDetailEdit} onForceDelete={onDetailForceDelete} onMagicFill={onMagicFill} onRefresh={onDetailRefresh} onRestore={onDetailRestore} /> : null}
        </div>
      ) : (
        <WorkspaceShowLayout>
          <WorkspaceShowCard title={`${labelForLevel(level)} profile`}>
            <WorkspaceDetailTable rows={detailRows(level, record)} />
          </WorkspaceShowCard>
          <WorkspaceShowCard title="Activity">
            <p className="px-4 py-3 text-sm text-muted-foreground">Activity will appear after registry actions are recorded for this level.</p>
          </WorkspaceShowCard>
        </WorkspaceShowLayout>
      )}
    </WorkspacePage>
  )
}

function ModuleOverviewPanel({ level, record }: { level: Level; record: AnyRecord }) {
  return (
    <WorkspaceShowLayout>
      <WorkspaceShowCard title="Module profile">
        <WorkspaceDetailTable rows={detailRows(level, record)} />
      </WorkspaceShowCard>
      <WorkspaceShowCard title="Registry direction">
        <div className="space-y-3 px-4 py-3 text-sm text-muted-foreground">
          <p>This module is the working area for reference coverage. Features come first, then actions, APIs, screens, database ownership, and planning can attach to the same module record.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {["Feature", "Action", "API", "Screen", "Database", "Planning"].map((item) => (
              <div key={item} className="rounded-md border border-border/70 px-3 py-2">{item}</div>
            ))}
          </div>
        </div>
      </WorkspaceShowCard>
    </WorkspaceShowLayout>
  )
}

function FeatureRegistryPanel({
  features,
  loading,
  onCreate,
  onDeactivate,
  onEdit,
  onForceDelete,
  onMagicFill,
  magicFilling,
  onRaiseIssue,
  onRefresh,
  onRestore
}: {
  features: FeatureRegistryRecord[]
  loading: boolean
  onCreate: () => void
  onDeactivate: (record: FeatureRegistryRecord) => void
  onEdit: (record: FeatureRegistryRecord) => void
  onForceDelete: (record: FeatureRegistryRecord) => void
  onMagicFill: () => void
  magicFilling: boolean
  onRaiseIssue: (record: FeatureRegistryRecord) => void
  onRefresh: () => void
  onRestore: (record: FeatureRegistryRecord) => void
}) {
  return (
    <WorkspaceTablePanel>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">Feature Registry</h3>
          <p className="text-sm text-muted-foreground">Map pages, actions, APIs, reports, settings, and workflows under this module.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-md" title="Magic fill standard feature map" disabled={magicFilling} onClick={onMagicFill}>
            <Sparkles className={cn("size-4", magicFilling && "animate-pulse")} />
          </Button>
          <Button type="button" variant="outline" className="h-9 rounded-md" onClick={onRefresh}>
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button type="button" className="h-9 rounded-md" onClick={onCreate}>
            <Plus className="size-4" />
            New feature
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
              <RegistryHeader>#</RegistryHeader>
              <RegistryHeader>Name</RegistryHeader>
              <RegistryHeader>Feature key</RegistryHeader>
              <RegistryHeader>Type</RegistryHeader>
              <RegistryHeader>Route</RegistryHeader>
              <RegistryHeader>Permission</RegistryHeader>
              <RegistryHeader>Status</RegistryHeader>
              <RegistryHeader className="text-right">Action</RegistryHeader>
            </tr>
          </thead>
          <tbody>
            {features.map((feature, index) => (
              <tr key={feature.id} className={cn("border-b border-border/70 last:border-b-0", !feature.active && "bg-muted/20 text-muted-foreground")}>
                <td className="px-4 py-2.5 text-muted-foreground">{index + 1}</td>
                <td className="px-4 py-2.5">
                  <button type="button" className="font-medium hover:underline" onClick={() => onEdit(feature)}>
                    {feature.name}
                  </button>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{feature.featureKey}</td>
                <td className="px-4 py-2.5">{feature.type}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{feature.routePath || "-"}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{feature.permissionKey || "-"}</td>
                <td className="px-4 py-2.5">
                  <WorkspaceStatusBadge label={feature.active ? "active" : "inactive"} tone={feature.active ? "success" : "danger"} />
                </td>
                <td className="px-4 py-1.5 text-right">
                  <WorkspaceRowActions
                    title={feature.name}
                    deleteLabel="Deactivate"
                    isSuspended={!feature.active}
                    restoreLabel="Restore"
                    onDelete={() => onDeactivate(feature)}
                    onEdit={() => onEdit(feature)}
                    onRestore={() => onRestore(feature)}
                    onView={() => onEdit(feature)}
                    actions={[
                      {
                        id: "raise-issue",
                        icon: <CircleAlert className="size-4" />,
                        label: "Raise issue",
                        onSelect: () => onRaiseIssue(feature)
                      },
                      {
                        id: "force-delete",
                        icon: <Trash2 className="size-4" />,
                        label: "Force delete",
                        tone: "destructive",
                        onSelect: () => onForceDelete(feature)
                      }
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {features.length === 0 && loading ? <WorkspaceTableSkeletonRows columns={8} /> : null}
      {features.length === 0 && !loading ? <WorkspaceTableEmptyState>No feature records found.</WorkspaceTableEmptyState> : null}
    </WorkspaceTablePanel>
  )
}

function DetailRegistryPanel({
  kind,
  loading,
  records,
  onCreate,
  onDeactivate,
  onEdit,
  onForceDelete,
  onMagicFill,
  magicFilling,
  onRaiseIssue,
  onRefresh,
  onRestore
}: {
  kind: DetailKind
  loading: boolean
  magicFilling: boolean
  records: DetailRecord[]
  onCreate: (kind: DetailKind) => void
  onDeactivate: (kind: DetailKind, record: DetailRecord) => void
  onEdit: (kind: DetailKind, record: DetailRecord) => void
  onForceDelete: (kind: DetailKind, record: DetailRecord) => void
  onMagicFill: (kind: DetailKind) => void
  onRaiseIssue?: (record: DetailRecord) => void
  onRefresh: (kind: DetailKind) => void
  onRestore: (kind: DetailKind, record: DetailRecord) => void
}) {
  const columns = detailColumns(kind)
  return (
    <WorkspaceTablePanel>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">{detailLabel(kind)}</h3>
          <p className="text-sm text-muted-foreground">{detailDescription(kind)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-md" title={`Magic fill ${detailShortLabel(kind)} records`} disabled={magicFilling} onClick={() => onMagicFill(kind)}>
            <Sparkles className={cn("size-4", magicFilling && "animate-pulse")} />
          </Button>
          <Button type="button" variant="outline" className="h-9 rounded-md" onClick={() => onRefresh(kind)}>
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button type="button" className="h-9 rounded-md" onClick={() => onCreate(kind)}>
            <Plus className="size-4" />
            New {detailShortLabel(kind)}
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        {kind === "api" ? <ApiCoverageStrip records={records} /> : null}
        {kind === "database" ? <DatabaseCoverageStrip records={records} /> : null}
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
              <RegistryHeader>#</RegistryHeader>
              <RegistryHeader>Name</RegistryHeader>
              <RegistryHeader>Key</RegistryHeader>
              {columns.map((column) => <RegistryHeader key={column.id}>{column.label}</RegistryHeader>)}
              <RegistryHeader>Status</RegistryHeader>
              <RegistryHeader className="text-right">Action</RegistryHeader>
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => (
              <tr key={record.id} className={cn("border-b border-border/70 last:border-b-0", !record.active && "bg-muted/20 text-muted-foreground")}>
                <td className="px-4 py-2.5 text-muted-foreground">{index + 1}</td>
                <td className="px-4 py-2.5">
                  <button type="button" className="font-medium hover:underline" onClick={() => onEdit(kind, record)}>
                    {record.name}
                  </button>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{record.key}</td>
                {columns.map((column) => (
                  <td key={column.id} className="px-4 py-2.5 text-muted-foreground">{detailCell(record, column.id)}</td>
                ))}
                <td className="px-4 py-2.5">
                  <WorkspaceStatusBadge label={record.active ? "active" : "inactive"} tone={record.active ? "success" : "danger"} />
                </td>
                <td className="px-4 py-1.5 text-right">
                  <WorkspaceRowActions
                    title={record.name}
                    deleteLabel="Deactivate"
                    isSuspended={!record.active}
                    restoreLabel="Restore"
                    onDelete={() => onDeactivate(kind, record)}
                    onEdit={() => onEdit(kind, record)}
                    onRestore={() => onRestore(kind, record)}
                    onView={() => onEdit(kind, record)}
                    actions={[
                      ...(onRaiseIssue ? [{ id: "raise-issue", icon: <CircleAlert className="size-4" />, label: "Raise issue", onSelect: () => onRaiseIssue(record) }] : []),
                      { id: "force-delete", icon: <Trash2 className="size-4" />, label: "Force delete", tone: "destructive", onSelect: () => onForceDelete(kind, record) }
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {records.length === 0 && loading ? <WorkspaceTableSkeletonRows columns={columns.length + 5} /> : null}
      {records.length === 0 && !loading ? <WorkspaceTableEmptyState>No {detailShortLabel(kind)} records found.</WorkspaceTableEmptyState> : null}
    </WorkspaceTablePanel>
  )
}

function PlanningRegistryPanel(props: {
  kind: "planning"
  loading: boolean
  magicFilling: boolean
  records: DetailRecord[]
  onCreate: (kind: DetailKind) => void
  onDeactivate: (kind: DetailKind, record: DetailRecord) => void
  onEdit: (kind: DetailKind, record: DetailRecord) => void
  onForceDelete: (kind: DetailKind, record: DetailRecord) => void
  onMagicFill: (kind: DetailKind) => void
  onRaiseIssue: (record: DetailRecord) => void
  onRefresh: (kind: DetailKind) => void
  onRestore: (kind: DetailKind, record: DetailRecord) => void
}) {
  const planned = props.records.filter((record) => record.status === "planned").length
  const blocked = props.records.filter((record) => ["blocked", "risk", "needs-review"].includes(record.status)).length
  const ready = props.records.filter((record) => ["ready", "active", "approved"].includes(record.status)).length
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <PlanningMetric label="Planned" value={planned} />
        <PlanningMetric label="Ready" value={ready} />
        <PlanningMetric label="Blocked / review" value={blocked} tone="danger" />
      </div>
      <DetailRegistryPanel {...props} />
    </div>
  )
}

function PlanningMetric({ label, tone = "default", value }: { label: string; tone?: "danger" | "default"; value: number }) {
  return (
    <div className={cn("rounded-md border px-4 py-3", tone === "danger" ? "border-rose-200 bg-rose-50 text-rose-900" : "border-border bg-background text-foreground")}>
      <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-normal">{value}</div>
    </div>
  )
}

function ApiCoverageStrip({ records }: { records: DetailRecord[] }) {
  const expected = ["list", "create", "show", "edit", "delete"]
  const covered = new Set(records.map((record) => record.operation).filter(Boolean))
  return (
    <div className="flex flex-wrap gap-2 border-b border-border/70 bg-muted/20 px-4 py-3">
      {expected.map((operation) => (
        <span key={operation} className={cn("rounded-md border px-2.5 py-1 text-xs font-medium", covered.has(operation) ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-border bg-background text-muted-foreground")}>
          {operation}
        </span>
      ))}
    </div>
  )
}

function DatabaseCoverageStrip({ records }: { records: DetailRecord[] }) {
  const tables = [...new Set(records.map((record) => record.tableName).filter(Boolean))]
  return (
    <div className="flex flex-wrap gap-2 border-b border-border/70 bg-muted/20 px-4 py-3">
      {(tables.length ? tables : ["No table mapped"]).map((table) => {
        const fieldCount = records.filter((record) => record.tableName === table).length
        return (
          <span key={table} className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {table}{fieldCount ? ` · ${fieldCount} fields` : ""}
          </span>
        )
      })}
    </div>
  )
}

function RegistryUpsertPage({
  errorMessage,
  level,
  loading,
  record,
  onBack,
  onSubmit
}: {
  errorMessage?: string
  level: Level
  loading: boolean
  record: AnyRecord | null
  onBack: () => void
  onSubmit: (record: FormState) => void
}) {
  const isEdit = record !== null
  const [form, setForm] = useState<FormState>({
    active: record?.active ?? true,
    description: record?.description ?? "",
    ...(record ? { id: record.id } : {}),
    keyValue: record ? recordKey(level, record) : "",
    name: record?.name ?? "",
    parentModuleId: level === "module" && record ? (record as ModuleRegistryRecord).parentModuleId ?? "" : "",
    permissionKey: "",
    routePath: record ? routePath(level, record) : "",
    sortOrder: record ? sortOrder(level, record) : "0",
    type: "page"
  })
  const [localBanner, setLocalBanner] = useState("")
  const keyLabel = level === "platform" ? "Platform" : level === "group" ? "Group key" : "Module key"

  return (
    <WorkspaceUpsertPage
      title={isEdit ? `Edit ${labelForLevel(level).toLowerCase()}` : `New ${labelForLevel(level).toLowerCase()}`}
      description={`Update ${labelForLevel(level).toLowerCase()} identity and active status.`}
      action={
        <Button type="button" variant="outline" onClick={onBack} className="h-9 rounded-md">
          <X className="size-4" />
          Cancel
        </Button>
      }
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          if (!form.name.trim()) {
            setLocalBanner("Name is required.")
            return
          }
          if (!form.keyValue.trim()) {
            setLocalBanner(`${keyLabel} is required.`)
            return
          }
          setLocalBanner("")
          onSubmit(form)
        }}
      >
        <WorkspaceFormPanel
          footer={
            <>
              <Button type="submit" disabled={loading} className="rounded-md bg-foreground text-background hover:bg-foreground/90">
                <Save className="size-4" />
                {loading ? "Saving..." : isEdit ? "Update" : "Save"}
              </Button>
              <Button type="button" variant="outline" className="rounded-md" onClick={onBack}>
                <X className="size-4" />
                Cancel
              </Button>
            </>
          }
        >
          {localBanner || errorMessage ? (
            <WorkspaceFormBanner title={localBanner ? "Missing required field" : "Could not save"}>
              {localBanner || errorMessage}
            </WorkspaceFormBanner>
          ) : null}
          <WorkspaceFormGrid columns={2}>
            <WorkspaceFormField label="Name" required>
              <Input className="h-11 rounded-md" value={form.name} onChange={(event) => updateForm(setForm, { name: event.target.value }, setLocalBanner)} required />
            </WorkspaceFormField>
            <WorkspaceFormField label={keyLabel} required>
              <Input className="h-11 rounded-md font-mono" value={form.keyValue} onChange={(event) => updateForm(setForm, { keyValue: event.target.value }, setLocalBanner)} required />
            </WorkspaceFormField>
            {level === "module" ? (
              <WorkspaceFormField label="Route path">
                <Input className="h-11 rounded-md font-mono" value={form.routePath} onChange={(event) => updateForm(setForm, { routePath: event.target.value }, setLocalBanner)} />
              </WorkspaceFormField>
            ) : null}
            {level !== "platform" ? (
              <WorkspaceFormField label="Sort order">
                <Input className="h-11 rounded-md" value={form.sortOrder} onChange={(event) => updateForm(setForm, { sortOrder: event.target.value }, setLocalBanner)} />
              </WorkspaceFormField>
            ) : null}
            <WorkspaceFormField label="Description">
              <Textarea className="min-h-28 rounded-md" value={form.description} onChange={(event) => updateForm(setForm, { description: event.target.value }, setLocalBanner)} />
            </WorkspaceFormField>
            <div className="flex items-end">
              <div className={cn("flex h-[4.5rem] w-full items-center justify-between rounded-md border px-4", form.active ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-border bg-muted/40 text-muted-foreground")}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <CheckCircle2 className="size-4" />
                    Active
                  </div>
                  <p className="mt-1 text-sm">Active records appear in the project manager drill-down.</p>
                </div>
                <Switch checked={form.active} onCheckedChange={(checked) => setForm((current) => ({ ...current, active: checked }))} />
              </div>
            </div>
          </WorkspaceFormGrid>
        </WorkspaceFormPanel>
      </form>
    </WorkspaceUpsertPage>
  )
}

function RegistryDialogGrid({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0 space-y-4">{left}</div>
      <aside className="space-y-3 border-t border-border/70 pt-4 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">{right}</aside>
    </div>
  )
}

function RegistrySideSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="space-y-3 rounded-md border border-border/70 bg-muted/10 p-3">
      <div className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">{title}</div>
      {children}
    </div>
  )
}

function RegistryActiveCard({
  checked,
  description,
  onCheckedChange
}: {
  checked: boolean
  description: string
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className={cn("flex min-h-14 items-center justify-between rounded-md border px-3 py-2", checked ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-border bg-muted/40 text-muted-foreground")}>
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <CheckCircle2 className="size-4" />
          Active
        </div>
        <p className="mt-1 text-xs">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

function PlatformRegistryDialog({
  errorMessage,
  loading,
  open,
  record,
  onClose,
  onSubmit
}: {
  errorMessage?: string
  loading: boolean
  open: boolean
  record: PlatformRecord | null
  onClose: () => void
  onSubmit: (record: FormState) => void
}) {
  const isEdit = record !== null
  const [form, setForm] = useState<FormState>({
    active: record?.active ?? true,
    description: record?.description ?? "",
    ...(record ? { id: record.id } : {}),
    keyValue: record?.platform ?? "",
    name: record?.name ?? "",
    parentModuleId: "",
    permissionKey: "",
    routePath: "",
    sortOrder: "0",
    type: "page"
  })
  const [localBanner, setLocalBanner] = useState("")

  useEffect(() => {
    setForm({
      active: record?.active ?? true,
      description: record?.description ?? "",
      ...(record ? { id: record.id } : {}),
      keyValue: record?.platform ?? "",
      name: record?.name ?? "",
      parentModuleId: "",
      permissionKey: "",
      routePath: "",
      sortOrder: "0",
      type: "page"
    })
    setLocalBanner("")
  }, [record, open])

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose() }}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden rounded-md border-border/70 p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border/70 px-5 py-4">
          <DialogTitle>{isEdit ? "Edit platform registry" : "New platform registry"}</DialogTitle>
          <DialogDescription>Maintain platform identity and active status.</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            if (!form.name.trim()) {
              setLocalBanner("Name is required.")
              return
            }
            if (!form.keyValue.trim()) {
              setLocalBanner("Platform is required.")
              return
            }
            setLocalBanner("")
            onSubmit(form)
          }}
        >
          <div className="max-h-[68vh] overflow-y-auto px-5 py-4">
            {localBanner || errorMessage ? (
              <WorkspaceFormBanner title={localBanner ? "Missing required field" : "Could not save"}>
                {localBanner || errorMessage}
              </WorkspaceFormBanner>
            ) : null}
            <RegistryDialogGrid
              left={
                <>
                  <WorkspaceFormField label="Name" required>
                    <Input className="h-11 rounded-md" value={form.name} onChange={(event) => updateForm(setForm, { name: event.target.value }, setLocalBanner)} required />
                  </WorkspaceFormField>
                  <WorkspaceFormField label="Description">
                    <Textarea className="min-h-36 rounded-md" value={form.description} onChange={(event) => updateForm(setForm, { description: event.target.value }, setLocalBanner)} />
                  </WorkspaceFormField>
                </>
              }
              right={
                <>
                  <RegistrySideSection title="Identity">
                    <WorkspaceFormField label="Platform" required>
                      <Input className="h-11 rounded-md font-mono" value={form.keyValue} onChange={(event) => updateForm(setForm, { keyValue: event.target.value }, setLocalBanner)} required />
                    </WorkspaceFormField>
                  </RegistrySideSection>
                  <RegistrySideSection title="State">
                    <RegistryActiveCard checked={form.active} description="Appears in project drill-down." onCheckedChange={(checked) => setForm((current) => ({ ...current, active: checked }))} />
                  </RegistrySideSection>
                </>
              }
            />
          </div>
          <DialogFooter className="border-t border-border/70 px-5 py-4 sm:justify-start">
            <Button type="submit" disabled={loading} className="rounded-md bg-foreground text-background hover:bg-foreground/90">
              <Save className="size-4" />
              {loading ? "Saving..." : isEdit ? "Update" : "Save"}
            </Button>
            <Button type="button" variant="outline" className="rounded-md" onClick={onClose}>
              <X className="size-4" />
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ModuleGroupDialog({
  errorMessage,
  loading,
  open,
  record,
  onClose,
  onSubmit
}: {
  errorMessage?: string
  loading: boolean
  open: boolean
  record: ModuleGroupRecord | null
  onClose: () => void
  onSubmit: (record: FormState) => void
}) {
  const isEdit = record !== null
  const [form, setForm] = useState<FormState>({
    active: record?.active ?? true,
    description: record?.description ?? "",
    ...(record ? { id: record.id } : {}),
    keyValue: record?.groupKey ?? "",
    name: record?.name ?? "",
    parentModuleId: "",
    permissionKey: "",
    routePath: "",
    sortOrder: record ? String(record.sortOrder) : "0",
    type: "page"
  })
  const [localBanner, setLocalBanner] = useState("")

  useEffect(() => {
    setForm({
      active: record?.active ?? true,
      description: record?.description ?? "",
      ...(record ? { id: record.id } : {}),
      keyValue: record?.groupKey ?? "",
      name: record?.name ?? "",
      parentModuleId: "",
      permissionKey: "",
      routePath: "",
      sortOrder: record ? String(record.sortOrder) : "0",
      type: "page"
    })
    setLocalBanner("")
  }, [record, open])

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose() }}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden rounded-md border-border/70 p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border/70 px-5 py-4">
          <DialogTitle>{isEdit ? "Edit module group" : "New module group"}</DialogTitle>
          <DialogDescription>Maintain module group identity and active status.</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            if (!form.name.trim()) {
              setLocalBanner("Name is required.")
              return
            }
            if (!form.keyValue.trim()) {
              setLocalBanner("Group key is required.")
              return
            }
            setLocalBanner("")
            onSubmit(form)
          }}
        >
          <div className="max-h-[68vh] overflow-y-auto px-5 py-4">
            {localBanner || errorMessage ? (
              <WorkspaceFormBanner title={localBanner ? "Missing required field" : "Could not save"}>
                {localBanner || errorMessage}
              </WorkspaceFormBanner>
            ) : null}
            <RegistryDialogGrid
              left={
                <>
                  <WorkspaceFormField label="Name" required>
                    <Input className="h-11 rounded-md" value={form.name} onChange={(event) => updateForm(setForm, { name: event.target.value }, setLocalBanner)} required />
                  </WorkspaceFormField>
                  <WorkspaceFormField label="Description">
                    <Textarea className="min-h-36 rounded-md" value={form.description} onChange={(event) => updateForm(setForm, { description: event.target.value }, setLocalBanner)} />
                  </WorkspaceFormField>
                </>
              }
              right={
                <>
                  <RegistrySideSection title="Identity">
                    <WorkspaceFormField label="Group key" required>
                      <Input className="h-11 rounded-md font-mono" value={form.keyValue} onChange={(event) => updateForm(setForm, { keyValue: event.target.value }, setLocalBanner)} required />
                    </WorkspaceFormField>
                  </RegistrySideSection>
                  <RegistrySideSection title="State">
                    <RegistryActiveCard checked={form.active} description="Appears in selected platform." onCheckedChange={(checked) => setForm((current) => ({ ...current, active: checked }))} />
                  </RegistrySideSection>
                </>
              }
            />
          </div>
          <DialogFooter className="border-t border-border/70 px-5 py-4 sm:justify-start">
            <Button type="submit" disabled={loading} className="rounded-md bg-foreground text-background hover:bg-foreground/90">
              <Save className="size-4" />
              {loading ? "Saving..." : isEdit ? "Update" : "Save"}
            </Button>
            <Button type="button" variant="outline" className="rounded-md" onClick={onClose}>
              <X className="size-4" />
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ModuleRegistryDialog({
  errorMessage,
  loading,
  open,
  record,
  onClose,
  onSubmit
}: {
  errorMessage?: string
  loading: boolean
  open: boolean
  record: ModuleRegistryRecord | null
  onClose: () => void
  onSubmit: (record: FormState) => void
}) {
  const isEdit = record !== null
  const [form, setForm] = useState<FormState>({
    active: record?.active ?? true,
    description: record?.description ?? "",
    ...(record ? { id: record.id } : {}),
    keyValue: record?.moduleKey ?? "",
    name: record?.name ?? "",
    parentModuleId: record?.parentModuleId ?? "",
    permissionKey: "",
    routePath: record?.routePath ?? "",
    sortOrder: record ? String(record.sortOrder) : "0",
    type: record?.moduleType ?? "module"
  })
  const [localBanner, setLocalBanner] = useState("")

  useEffect(() => {
    setForm({
      active: record?.active ?? true,
      description: record?.description ?? "",
      ...(record ? { id: record.id } : {}),
      keyValue: record?.moduleKey ?? "",
      name: record?.name ?? "",
      parentModuleId: record?.parentModuleId ?? "",
      permissionKey: "",
      routePath: record?.routePath ?? "",
      sortOrder: record ? String(record.sortOrder) : "0",
      type: record?.moduleType ?? "module"
    })
    setLocalBanner("")
  }, [record, open])

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose() }}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden rounded-md border-border/70 p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border/70 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle>{isEdit ? "Edit module registry" : "New module registry"}</DialogTitle>
              <DialogDescription>Maintain module identity, route, and active status.</DialogDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="mr-8 h-9 w-9 shrink-0 rounded-md"
              title="Magic fill module key and route"
              onClick={() => {
                setLocalBanner("")
                setForm((current) => magicModuleForm(current))
              }}
            >
              <Sparkles className="size-4" />
            </Button>
          </div>
        </DialogHeader>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            if (!form.name.trim()) {
              setLocalBanner("Name is required.")
              return
            }
            if (!form.keyValue.trim()) {
              setLocalBanner("Module key is required.")
              return
            }
            setLocalBanner("")
            onSubmit(form)
          }}
        >
          <div className="max-h-[68vh] overflow-y-auto px-5 py-4">
            {localBanner || errorMessage ? (
              <WorkspaceFormBanner title={localBanner ? "Missing required field" : "Could not save"}>
                {localBanner || errorMessage}
              </WorkspaceFormBanner>
            ) : null}
            <RegistryDialogGrid
              left={
                <>
                  <WorkspaceFormField label="Name" required>
                    <Input className="h-11 rounded-md" value={form.name} onChange={(event) => updateForm(setForm, { name: event.target.value }, setLocalBanner)} required />
                  </WorkspaceFormField>
                  <WorkspaceFormField label="Route path">
                    <Input className="h-11 rounded-md font-mono" value={form.routePath} onChange={(event) => updateForm(setForm, { routePath: event.target.value }, setLocalBanner)} />
                  </WorkspaceFormField>
                  <WorkspaceFormField label="Description">
                    <Textarea className="min-h-36 rounded-md" value={form.description} onChange={(event) => updateForm(setForm, { description: event.target.value }, setLocalBanner)} />
                  </WorkspaceFormField>
                </>
              }
              right={
                <>
                  <RegistrySideSection title="Identity">
                    <WorkspaceFormField label="Module key" required>
                      <Input className="h-11 rounded-md font-mono" value={form.keyValue} onChange={(event) => updateForm(setForm, { keyValue: event.target.value }, setLocalBanner)} required />
                    </WorkspaceFormField>
                  </RegistrySideSection>
                  <RegistrySideSection title="State">
                    <RegistryActiveCard checked={form.active} description="Appears in selected module group." onCheckedChange={(checked) => setForm((current) => ({ ...current, active: checked }))} />
                  </RegistrySideSection>
                </>
              }
            />
          </div>
          <DialogFooter className="border-t border-border/70 px-5 py-4 sm:justify-start">
            <Button type="submit" disabled={loading} className="rounded-md bg-foreground text-background hover:bg-foreground/90">
              <Save className="size-4" />
              {loading ? "Saving..." : isEdit ? "Update" : "Save"}
            </Button>
            <Button type="button" variant="outline" className="rounded-md" onClick={onClose}>
              <X className="size-4" />
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function FeatureRegistryDialog({
  errorMessage,
  loading,
  open,
  record,
  onClose,
  onSubmit
}: {
  errorMessage?: string
  loading: boolean
  open: boolean
  record: FeatureRegistryRecord | null
  onClose: () => void
  onSubmit: (record: FormState) => void
}) {
  const isEdit = record !== null
  const [form, setForm] = useState<FormState>({
    active: record?.active ?? true,
    description: record?.description ?? "",
    ...(record ? { id: record.id } : {}),
    keyValue: record?.featureKey ?? "",
    name: record?.name ?? "",
    parentModuleId: "",
    permissionKey: record?.permissionKey ?? "",
    routePath: record?.routePath ?? "",
    sortOrder: record ? String(record.sortOrder) : "0",
    type: record?.type ?? "page"
  })
  const [localBanner, setLocalBanner] = useState("")

  useEffect(() => {
    setForm({
      active: record?.active ?? true,
      description: record?.description ?? "",
      ...(record ? { id: record.id } : {}),
      keyValue: record?.featureKey ?? "",
      name: record?.name ?? "",
      parentModuleId: "",
      permissionKey: record?.permissionKey ?? "",
      routePath: record?.routePath ?? "",
      sortOrder: record ? String(record.sortOrder) : "0",
      type: record?.type ?? "page"
    })
    setLocalBanner("")
  }, [record, open])

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose() }}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden rounded-md border-border/70 p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border/70 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle>{isEdit ? "Edit feature registry" : "New feature registry"}</DialogTitle>
              <DialogDescription>Maintain feature identity, type, route, permission, and active status.</DialogDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="mr-8 h-9 w-9 shrink-0 rounded-md"
              title="Magic fill feature key, route, and permission"
              onClick={() => {
                setLocalBanner("")
                setForm((current) => magicFeatureForm(current))
              }}
            >
              <Sparkles className="size-4" />
            </Button>
          </div>
        </DialogHeader>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            if (!form.name.trim()) {
              setLocalBanner("Name is required.")
              return
            }
            if (!form.keyValue.trim()) {
              setLocalBanner("Feature key is required.")
              return
            }
            setLocalBanner("")
            onSubmit(form)
          }}
        >
          <div className="max-h-[68vh] overflow-y-auto px-5 py-4">
            {localBanner || errorMessage ? (
              <WorkspaceFormBanner title={localBanner ? "Missing required field" : "Could not save"}>
                {localBanner || errorMessage}
              </WorkspaceFormBanner>
            ) : null}
            <RegistryDialogGrid
              left={
                <>
                  <WorkspaceFormField label="Name" required>
                    <Input className="h-11 rounded-md" value={form.name} onChange={(event) => updateForm(setForm, { name: event.target.value }, setLocalBanner)} required />
                  </WorkspaceFormField>
                  <WorkspaceFormField label="Route path">
                    <Input className="h-11 rounded-md font-mono" value={form.routePath} onChange={(event) => updateForm(setForm, { routePath: event.target.value }, setLocalBanner)} />
                  </WorkspaceFormField>
                  <WorkspaceFormField label="Permission key">
                    <Input className="h-11 rounded-md font-mono" value={form.permissionKey} onChange={(event) => updateForm(setForm, { permissionKey: event.target.value }, setLocalBanner)} />
                  </WorkspaceFormField>
                  <WorkspaceFormField label="Description">
                    <Textarea className="min-h-36 rounded-md" value={form.description} onChange={(event) => updateForm(setForm, { description: event.target.value }, setLocalBanner)} />
                  </WorkspaceFormField>
                </>
              }
              right={
                <>
                  <RegistrySideSection title="Identity">
                    <WorkspaceFormField label="Feature key" required>
                      <Input className="h-11 rounded-md font-mono" value={form.keyValue} onChange={(event) => updateForm(setForm, { keyValue: event.target.value }, setLocalBanner)} required />
                    </WorkspaceFormField>
                    <WorkspaceFormField label="Type">
                      <select
                        className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={form.type}
                        onChange={(event) => updateForm(setForm, { type: event.target.value }, setLocalBanner)}
                      >
                        <option value="page">Page</option>
                        <option value="action">Action</option>
                        <option value="api">API</option>
                        <option value="report">Report</option>
                        <option value="setting">Setting</option>
                        <option value="workflow">Workflow</option>
                      </select>
                    </WorkspaceFormField>
                  </RegistrySideSection>
                  <RegistrySideSection title="State">
                    <RegistryActiveCard checked={form.active} description="Appears in module workspace." onCheckedChange={(checked) => setForm((current) => ({ ...current, active: checked }))} />
                  </RegistrySideSection>
                </>
              }
            />
          </div>
          <DialogFooter className="border-t border-border/70 px-5 py-4 sm:justify-start">
            <Button type="submit" disabled={loading} className="rounded-md bg-foreground text-background hover:bg-foreground/90">
              <Save className="size-4" />
              {loading ? "Saving..." : isEdit ? "Update" : "Save"}
            </Button>
            <Button type="button" variant="outline" className="rounded-md" onClick={onClose}>
              <X className="size-4" />
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DetailRegistryDialog({
  errorMessage,
  features,
  kind,
  loading,
  module,
  open,
  record,
  onClose,
  onSubmit
}: {
  errorMessage?: string
  features: FeatureRegistryRecord[]
  kind: DetailKind
  loading: boolean
  module: ModuleRegistryRecord | null
  open: boolean
  record: DetailRecord | null
  onClose: () => void
  onSubmit: (record: DetailFormState) => void
}) {
  const isEdit = record !== null
  const [form, setForm] = useState<DetailFormState>(() => detailFormFromRecord(record, kind))
  const [localBanner, setLocalBanner] = useState("")

  useEffect(() => {
    setForm(detailFormFromRecord(record, kind))
    setLocalBanner("")
  }, [record, open, kind])

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose() }}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden rounded-md border-border/70 p-0 sm:max-w-5xl">
        <DialogHeader className="border-b border-border/70 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle>{isEdit ? `Edit ${detailShortLabel(kind)}` : `New ${detailShortLabel(kind)}`}</DialogTitle>
              <DialogDescription>Maintain registry metadata, coverage references, ownership, and implementation notes.</DialogDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="mr-8 h-9 w-9 shrink-0 rounded-md"
              title="Magic fill this form"
              disabled={!module}
              onClick={() => {
                if (!module) return
                setLocalBanner("")
                setForm((current) => magicDetailForm(kind, module, features, current))
              }}
            >
              <Sparkles className="size-4" />
            </Button>
          </div>
        </DialogHeader>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            if (!form.name.trim()) {
              setLocalBanner("Name is required.")
              return
            }
            if (!form.key.trim()) {
              setLocalBanner("Key is required.")
              return
            }
            setLocalBanner("")
            onSubmit(form)
          }}
        >
          <div className="max-h-[68vh] overflow-y-auto px-5 py-4">
            {localBanner || errorMessage ? (
              <WorkspaceFormBanner title={localBanner ? "Missing required field" : "Could not save"}>
                {localBanner || errorMessage}
              </WorkspaceFormBanner>
            ) : null}
            <RegistryDialogGrid
              left={
                <>
                  <WorkspaceFormField label="Name" required>
                    <Input className="h-11 rounded-md" value={form.name} onChange={(event) => updateDetailForm(setForm, { name: event.target.value }, setLocalBanner)} required />
                  </WorkspaceFormField>
                  <WorkspaceFormField label="Key" required>
                    <Input className="h-11 rounded-md font-mono" value={form.key} onChange={(event) => updateDetailForm(setForm, { key: event.target.value }, setLocalBanner)} required />
                  </WorkspaceFormField>
                  <WorkspaceFormField label="Description">
                    <Textarea className="min-h-24 rounded-md" value={form.description} onChange={(event) => updateDetailForm(setForm, { description: event.target.value }, setLocalBanner)} />
                  </WorkspaceFormField>
                  <WorkspaceFormField label="Rich notes">
                    <WorkspaceEditor content={form.richNotes} placeholder="Write implementation notes, coverage gaps, decisions, and debug observations..." onChange={(value) => updateDetailForm(setForm, { richNotes: value }, setLocalBanner)} />
                  </WorkspaceFormField>
                </>
              }
              right={
                <>
                  <RegistrySideSection title="Reference">
                    {detailUsesFeature(kind) ? (
                      <WorkspaceFormField label="Feature">
                        <WorkspaceAutocomplete
                          createLabel="Use feature"
                          options={features.map((feature) => ({ value: feature.id, label: `${feature.name} (${feature.featureKey})` }))}
                          placeholder="Select linked feature"
                          value={form.featureId}
                          onChange={(value) => updateDetailForm(setForm, { featureId: value ?? "" }, setLocalBanner)}
                          onCreate={(query) => updateDetailForm(setForm, { featureId: query }, setLocalBanner)}
                        />
                      </WorkspaceFormField>
                    ) : null}
                    {detailFields(kind).map((field) => (
                      <DetailField key={field} field={field} form={form} setForm={setForm} setLocalBanner={setLocalBanner} />
                    ))}
                  </RegistrySideSection>
                  <RegistrySideSection title="State">
                    <div className="space-y-2">
                      {booleanFieldsForKind(kind).map((field) => (
                        <div key={field} className={cn("flex min-h-11 items-center justify-between rounded-md border px-3 py-2", form[field as keyof DetailFormState] ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-border bg-background text-muted-foreground")}>
                          <span className="text-sm font-semibold">{booleanLabel(field)}</span>
                          <Switch checked={Boolean(form[field as keyof DetailFormState])} onCheckedChange={(checked) => updateDetailForm(setForm, { [field]: checked } as Partial<DetailFormState>, setLocalBanner)} />
                        </div>
                      ))}
                    </div>
                  </RegistrySideSection>
                </>
              }
            />
          </div>
          <DialogFooter className="border-t border-border/70 px-5 py-4 sm:justify-start">
            <Button type="submit" disabled={loading} className="rounded-md bg-foreground text-background hover:bg-foreground/90">
              <Save className="size-4" />
              {loading ? "Saving..." : isEdit ? "Update" : "Save"}
            </Button>
            <Button type="button" variant="outline" className="rounded-md" onClick={onClose}>
              <X className="size-4" />
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ForceDeleteDialog({
  deleting,
  pending,
  onClose,
  onConfirm
}: {
  deleting: boolean
  pending: { level: Level; record: AnyRecord } | { kind: DetailKind; record: DetailRecord } | null
  onClose: () => void
  onConfirm: () => void
}) {
  const [confirmText, setConfirmText] = useState("")
  const canDelete = confirmText.trim().toUpperCase() === "DELETE"
  const title = pending ? ("kind" in pending ? detailShortLabel(pending.kind) : labelForLevel(pending.level).toLowerCase()) : "record"

  return (
    <Dialog open={Boolean(pending)} onOpenChange={(nextOpen) => {
      if (!nextOpen) {
        setConfirmText("")
        onClose()
      }
    }}>
      <DialogContent className="rounded-md border-border/70 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Force delete {title}</DialogTitle>
          <DialogDescription>
            This permanently deletes {pending?.record.name ?? "this record"}. Type DELETE to confirm.
          </DialogDescription>
        </DialogHeader>
        <Input className="h-11 rounded-md" value={confirmText} onChange={(event) => setConfirmText(event.target.value)} />
        <DialogFooter>
          <Button type="button" variant="outline" className="rounded-md" disabled={deleting} onClick={() => {
            setConfirmText("")
            onClose()
          }}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" className="rounded-md" disabled={!canDelete || deleting || !pending} onClick={onConfirm}>
            {deleting ? "Deleting..." : "Force delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function columnsForLevel(level: Level) {
  const common = [
    { id: "name", label: "Name" },
    { id: "key", label: level === "platform" ? "Platform" : level === "group" ? "Group key" : level === "module" ? "Module key" : "Feature key" }
  ]
  if (level === "module") common.push({ id: "parent", label: "Parent" })
  if (level === "module" || level === "feature") common.push({ id: "routePath", label: "Route" })
  if (level !== "platform") common.push({ id: "sortOrder", label: "Order" })
  common.push({ id: "description", label: "Description" }, { id: "status", label: "Status" })
  return common
}

function detailRows(level: Level, record: AnyRecord): Array<[string, ReactNode]> {
  const rows: Array<[string, ReactNode]> = [
    ["Name", record.name],
    [level === "platform" ? "Platform" : level === "group" ? "Group key" : level === "module" ? "Module key" : "Feature key", <span key="key" className="font-mono text-xs">{recordKey(level, record)}</span>]
  ]
  if (level === "module" || level === "feature") rows.push(["Route", <span key="route" className="font-mono text-xs">{routePath(level, record) || "-"}</span>])
  if (level === "module") {
    const module = record as ModuleRegistryRecord
    rows.push(["Parent module", module.parentModuleId ? <span key="parent" className="font-mono text-xs">{module.parentModuleId}</span> : "-"])
    rows.push(["Module type", module.moduleType || "module"])
  }
  if (level === "feature") {
    rows.push(
      ["Type", (record as FeatureRegistryRecord).type],
      ["Permission", <span key="permission" className="font-mono text-xs">{(record as FeatureRegistryRecord).permissionKey || "-"}</span>]
    )
  }
  if (level !== "platform") rows.push(["Order", sortOrder(level, record)])
  rows.push(
    ["Description", record.description || "-"],
    ["Status", <WorkspaceStatusBadge key="status" label={record.active ? "active" : "inactive"} tone={record.active ? "success" : "danger"} />]
  )
  return rows
}

function recordKey(level: Level, record: AnyRecord) {
  if (level === "platform") return (record as PlatformRecord).platform
  if (level === "group") return (record as ModuleGroupRecord).groupKey
  if (level === "module") return (record as ModuleRegistryRecord).moduleKey
  return (record as FeatureRegistryRecord).featureKey
}

function routePath(level: Level, record: AnyRecord) {
  if (level === "module") return (record as ModuleRegistryRecord).routePath
  if (level === "feature") return (record as FeatureRegistryRecord).routePath
  return ""
}

function parentModuleName(module: ModuleRegistryRecord, parentNames: Map<string, string>) {
  if (!module.parentModuleId) return module.moduleType === "area" ? "Area" : "-"
  return parentNames.get(module.parentModuleId) ?? module.parentModuleId
}

function orderModuleRecords(records: ModuleRegistryRecord[]) {
  const children = new Map<string, ModuleRegistryRecord[]>()
  const roots: ModuleRegistryRecord[] = []
  for (const record of records) {
    if (record.parentModuleId) {
      const bucket = children.get(record.parentModuleId) ?? []
      bucket.push(record)
      children.set(record.parentModuleId, bucket)
    } else {
      roots.push(record)
    }
  }
  const bySort = (a: ModuleRegistryRecord, b: ModuleRegistryRecord) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)
  const ordered: ModuleRegistryRecord[] = []
  for (const root of roots.sort(bySort)) {
    ordered.push(root)
    ordered.push(...(children.get(root.id) ?? []).sort(bySort))
  }
  const rootIds = new Set(roots.map((root) => root.id))
  for (const [parentId, bucket] of children) {
    if (!rootIds.has(parentId)) ordered.push(...bucket.sort(bySort))
  }
  return ordered
}

function sortOrder(level: Level, record: AnyRecord) {
  return level === "platform" ? "" : String((record as ModuleGroupRecord | ModuleRegistryRecord | FeatureRegistryRecord).sortOrder)
}

function titleForLevel(level: Level, platform: PlatformRecord | null, group: ModuleGroupRecord | null) {
  if (level === "group") return `${platform?.name ?? "Platform"} Module Groups`
  if (level === "module") return `${group?.name ?? "Module Group"} Module Registry`
  if (level === "feature") return "Feature Registry"
  return "Platform Registry"
}

function descriptionForLevel(level: Level, platform: PlatformRecord | null, group: ModuleGroupRecord | null) {
  if (level === "group") return `Platform Registry > ${platform?.name ?? "Module Groups"}`
  if (level === "module") return `Platform Registry > ${platform?.name ?? "Platform"} > ${group?.name ?? "Module Registry"}`
  if (level === "feature") return `Platform Registry > ${platform?.name ?? "Platform"} > ${group?.name ?? "Module Group"} > Feature Registry`
  return "Platform Registry > Module Group > Module Registry > Feature Registry"
}

function labelForLevel(level: Level) {
  if (level === "group") return "Module Group"
  if (level === "module") return "Module Registry"
  if (level === "feature") return "Feature Registry"
  return "Platform Registry"
}

function useDetailQuery(kind: DetailKind, module: ModuleRegistryRecord | null) {
  return useQuery<DetailRecord[]>({
    enabled: Boolean(module),
    queryKey: ["admin", "platform-module-registry", module?.id, detailPath(kind)],
    queryFn: () => apiGet<DetailRecord[]>(`/admin/platform-module-registry/${module?.id}/${detailPath(kind)}`, "sa")
  })
}

function detailPath(kind: DetailKind) {
  if (kind === "action") return "actions"
  if (kind === "api") return "apis"
  if (kind === "screen") return "screens"
  if (kind === "note") return "notes"
  return kind
}

function detailLabel(kind: DetailKind) {
  if (kind === "api") return "API Registry"
  if (kind === "database") return "Database Registry"
  if (kind === "planning") return "Planning Registry"
  if (kind === "note") return "Model Notes"
  return `${kind.charAt(0).toUpperCase()}${kind.slice(1)} Registry`
}

function detailShortLabel(kind: DetailKind) {
  if (kind === "api") return "API"
  if (kind === "database") return "database object"
  if (kind === "planning") return "work item"
  if (kind === "note") return "model note"
  return kind
}

function detailDescription(kind: DetailKind) {
  if (kind === "action") return "Map user actions, permission keys, routes, ownership, and feature flags."
  if (kind === "api") return "Map backend endpoints, methods, permissions, audit events, lifecycle, and risk."
  if (kind === "screen") return "Map UI screens, components, routes, page types, and test coverage."
  if (kind === "database") return "Map tables and schema ownership, migrations, soft delete, and audit needs."
  if (kind === "planning") return "Track epics, features, tasks, bugs, releases, milestones, and versions."
  return "Capture rich model notes, decisions, dependencies, debug findings, and improvement ideas."
}

function detailColumns(kind: DetailKind) {
  if (kind === "api") return [{ id: "operation", label: "Operation" }, { id: "route", label: "Route" }, { id: "permissionKey", label: "Permission" }, { id: "auditEvent", label: "Audit" }, { id: "riskLevel", label: "Risk" }]
  if (kind === "screen") return [{ id: "pageType", label: "Page type" }, { id: "routePath", label: "Route" }, { id: "componentPath", label: "Component" }, { id: "testPath", label: "Test" }]
  if (kind === "database") return [{ id: "tableName", label: "Table" }, { id: "fieldName", label: "Field" }, { id: "fieldType", label: "Type" }, { id: "fieldNature", label: "Nature" }, { id: "fieldFlags", label: "Flags" }, { id: "relation", label: "Relation" }]
  if (kind === "planning") return [{ id: "planType", label: "Plan type" }, { id: "ownerTeam", label: "Owner" }, { id: "riskLevel", label: "Risk" }, { id: "testPath", label: "Test path" }]
  if (kind === "note") return [{ id: "ownerTeam", label: "Owner" }, { id: "version", label: "Version" }, { id: "dependencyKeys", label: "Dependencies" }, { id: "scope", label: "Scope" }]
  return [{ id: "routePath", label: "Route" }, { id: "permissionKey", label: "Permission" }, { id: "scope", label: "Scope" }, { id: "subscriptionFlagKey", label: "Flag" }]
}

function detailCell(record: DetailRecord, id: string) {
  if (id === "route") return `${record.method || "-"} ${record.routePath || "-"}`
  if (id === "fieldFlags") {
    const flags = [
      record.nullable ? "nullable" : "required",
      record.indexed ? "indexed" : "",
      record.unique ? "unique" : "",
      record.softDelete ? "soft delete" : ""
    ].filter(Boolean)
    return flags.length ? flags.join(", ") : "-"
  }
  const value = record[id as keyof DetailRecord]
  if (Array.isArray(value)) return value.length ? value.join(", ") : "-"
  if (typeof value === "boolean") return value ? "yes" : "no"
  return value ? String(value) : "-"
}

function detailFields(kind: DetailKind): Array<keyof DetailFormState> {
  if (kind === "api") return ["operation", "method", "routePath", "permissionKey", "riskLevel"]
  if (kind === "screen") return ["routePath", "componentPath", "pageType", "testPath"]
  if (kind === "database") return ["tableName", "fieldName", "fieldType", "fieldNature", "relation"]
  if (kind === "planning") return ["planType", "ownerTeam", "riskLevel", "acceptanceCriteria", "blockers", "validationPlan", "testPath"]
  if (kind === "note") return ["ownerTeam"]
  return ["routePath", "permissionKey", "auditEvent"]
}

function DetailField({
  field,
  form,
  setForm,
  setLocalBanner
}: {
  field: keyof DetailFormState
  form: DetailFormState
  setForm: React.Dispatch<React.SetStateAction<DetailFormState>>
  setLocalBanner: (value: string) => void
}) {
  const options = optionsForDetailField(field)
  return (
    <WorkspaceFormField label={detailFieldLabel(field)}>
      {options.length ? (
        <WorkspaceAutocomplete
          createLabel="Use value"
          options={options.map((value) => ({ value, label: value }))}
          placeholder={`Select ${detailFieldLabel(field).toLowerCase()}`}
          value={String(form[field] ?? "")}
          onChange={(value) => updateDetailForm(setForm, { [field]: value ?? "" } as Partial<DetailFormState>, setLocalBanner)}
          onCreate={(query) => updateDetailForm(setForm, { [field]: query } as Partial<DetailFormState>, setLocalBanner)}
        />
      ) : ["acceptanceCriteria", "blockers", "validationPlan"].includes(field) ? (
        <Textarea className="min-h-24 rounded-md" value={String(form[field] ?? "")} onChange={(event) => updateDetailForm(setForm, { [field]: event.target.value } as Partial<DetailFormState>, setLocalBanner)} />
      ) : (
        <Input className="h-11 rounded-md font-mono" value={String(form[field] ?? "")} onChange={(event) => updateDetailForm(setForm, { [field]: event.target.value } as Partial<DetailFormState>, setLocalBanner)} />
      )}
    </WorkspaceFormField>
  )
}

function optionsForDetailField(field: keyof DetailFormState) {
  if (field === "operation") return ["list", "create", "show", "edit", "delete", "suspend", "restore", "export", "import", "bulk action"]
  if (field === "method") return ["GET", "POST", "PUT", "PATCH", "DELETE"]
  if (field === "fieldNature") return ["primary key", "business identity", "routing identity", "foreign key", "lifecycle state", "audit timestamp", "soft delete marker", "configuration", "counter", "computed", "json metadata"]
  if (field === "fieldType") return ["uuid", "text", "varchar", "integer", "decimal", "boolean", "enum", "timestamp", "date", "json", "jsonb"]
  if (field === "riskLevel") return ["low", "medium", "high", "critical"]
  if (field === "scope") return ["super_admin", "admin", "tenant", "public", "api", "system"]
  if (field === "pageType") return ["list", "show", "upsert", "dialog", "activity", "dashboard", "report", "setting"]
  if (field === "tableScope") return ["master", "tenant", "shared", "system"]
  if (field === "planType") return ["feature", "enhancement", "bugfix", "refactor", "coverage", "release", "debug", "migration"]
  return []
}

function detailFieldLabel(field: keyof DetailFormState) {
  const labels: Partial<Record<keyof DetailFormState, string>> = {
    acceptanceCriteria: "Acceptance criteria",
    auditEvent: "Audit event",
    blockers: "Risks / blockers",
    componentPath: "Frontend component path",
    defaultValue: "Default value",
    dependencyKeys: "Dependency modules",
    featureId: "Feature",
    fieldName: "Field name",
    fieldNature: "Field nature",
    fieldType: "Field type",
    indexed: "Indexed",
    lifecycleAction: "Lifecycle action",
    migrationId: "Migration id",
    nullable: "Nullable",
    operation: "Operation",
    ownerTeam: "Owner/team",
    pageType: "Page type",
    permissionKey: "Permission key",
    planType: "Plan type",
    relation: "Relation",
    richNotes: "Rich notes",
    riskLevel: "Risk level",
    routePath: "Route/path",
    scope: "Scope",
    softDelete: "Soft delete",
    sortOrder: "Order",
    subscriptionFlagKey: "Subscription/feature flag key",
    tableName: "Table name",
    tableScope: "Table scope",
    tenantRequired: "Tenant required",
    testPath: "Test path",
    validationPlan: "Validation plan",
    unique: "Unique"
  }
  return labels[field] ?? field
}

function booleanLabel(field: string) {
  if (field === "tenantRequired") return "Tenant required"
  if (field === "lifecycleAction") return "Lifecycle action"
  if (field === "softDelete") return "Soft delete"
  if (field === "nullable") return "Nullable"
  if (field === "indexed") return "Indexed"
  if (field === "unique") return "Unique"
  return "Active"
}

function booleanFieldsForKind(kind: DetailKind) {
  if (kind === "database") return ["active", "nullable", "indexed", "unique", "softDelete"]
  if (kind === "api") return ["active", "tenantRequired", "lifecycleAction"]
  return ["active"]
}

function detailUsesFeature(kind: DetailKind) {
  return kind === "action" || kind === "api" || kind === "screen"
}

function detailFormFromRecord(record: DetailRecord | null, kind: DetailKind): DetailFormState {
  return {
    acceptanceCriteria: record?.acceptanceCriteria ?? "",
    active: record?.active ?? true,
    auditEvent: record?.auditEvent ?? "",
    blockers: record?.blockers ?? "",
    componentPath: record?.componentPath ?? "",
    defaultValue: record?.defaultValue ?? "",
    dependencyKeys: record?.dependencyKeys?.join(", ") ?? "",
    description: record?.description ?? "",
    featureId: record?.featureId ?? "",
    fieldName: record?.fieldName ?? "",
    fieldNature: record?.fieldNature ?? "",
    fieldType: record?.fieldType ?? "",
    ...(record ? { id: record.id } : {}),
    indexed: record?.indexed ?? false,
    key: record?.key ?? "",
    lifecycleAction: record?.lifecycleAction ?? false,
    method: record?.method ?? (kind === "api" ? "GET" : ""),
    migrationId: record?.migrationId ?? "",
    name: record?.name ?? "",
    nullable: record?.nullable ?? false,
    operation: record?.operation ?? "",
    ownerTeam: record?.ownerTeam ?? "",
    pageType: record?.pageType ?? "",
    permissionKey: record?.permissionKey ?? "",
    planType: record?.planType ?? (kind === "planning" ? "enhancement" : ""),
    relation: record?.relation ?? "",
    richNotes: record?.richNotes ?? "",
    riskLevel: record?.riskLevel ?? "medium",
    routePath: record?.routePath ?? "",
    scope: record?.scope ?? "super_admin",
    softDelete: record?.softDelete ?? false,
    sortOrder: record ? String(record.sortOrder) : "0",
    subscriptionFlagKey: record?.subscriptionFlagKey ?? "",
    tableName: record?.tableName ?? "",
    tableScope: record?.tableScope ?? "",
    tenantRequired: record?.tenantRequired ?? false,
    testPath: record?.testPath ?? "",
    validationPlan: record?.validationPlan ?? "",
    unique: record?.unique ?? false,
    version: record?.version ?? "1.0.0"
  }
}

function magicModuleForm(current: FormState): FormState {
  const key = slugify(current.keyValue || current.name)
  return {
    ...current,
    keyValue: current.keyValue || key,
    routePath: current.routePath || `/sa/${pluralize(key)}`,
    description: current.description || `${current.name || titleFromKey(key)} module reference for planning, build, debug, and release coverage.`
  }
}

function magicFeatureForm(current: FormState): FormState {
  const key = slugify(current.keyValue || current.name)
  const operation = inferOperation(current.name || current.keyValue)
  const baseKey = trimOperationKey(key)
  return {
    ...current,
    keyValue: current.keyValue || key,
    type: current.type || (operation === "list" || operation === "show" ? "page" : "action"),
    routePath: current.routePath || routeForOperation(`/sa/${pluralize(baseKey)}`, operation),
    permissionKey: current.permissionKey || permissionFor(baseKey, operation),
    description: current.description || `${titleFromKey(operation)} ${titleFromKey(baseKey)} reference.`
  }
}

function magicFeatureForms(module: ModuleRegistryRecord): FormState[] {
  const baseRoute = module.routePath || `/sa/${pluralize(module.moduleKey)}`
  const operations = ["list", "create", "show", "update", "delete"] as const
  return operations.map((operation, index) => ({
    active: true,
    description: `${titleFromKey(operation)} ${module.name} reference.`,
    keyValue: `${module.moduleKey}-${operation}`,
    name: `${titleFromKey(operation)} ${module.name}`,
    parentModuleId: "",
    permissionKey: permissionFor(module.moduleKey, operation),
    routePath: routeForOperation(baseRoute, operation),
    sortOrder: String((index + 1) * 10),
    type: operation === "list" || operation === "show" ? "page" : "action"
  }))
}

function magicDetailForm(kind: DetailKind, module: ModuleRegistryRecord, features: FeatureRegistryRecord[], current: DetailFormState): DetailFormState {
  const suggestions = magicDetailForms(kind, module, features)
  const preferred = suggestions.find((item) => item.operation === current.operation || item.fieldName === current.fieldName || item.pageType === current.pageType) ?? suggestions[0]
  if (!preferred) return current
  return {
    ...current,
    ...Object.fromEntries(Object.entries(preferred).filter(([, value]) => value !== "" && value !== false && value !== "0")),
    id: current.id,
    active: current.active,
    sortOrder: current.sortOrder === "0" ? preferred.sortOrder : current.sortOrder
  } as DetailFormState
}

function magicDetailForms(kind: DetailKind, module: ModuleRegistryRecord, features: FeatureRegistryRecord[]): DetailFormState[] {
  if (kind === "api") return magicApiForms(module, features)
  if (kind === "database") return magicDatabaseForms(module)
  if (kind === "screen") return magicScreenForms(module, features)
  if (kind === "action") return magicActionForms(module, features)
  if (kind === "planning") return [magicPlanningForm(module)]
  return [magicNoteForm(module)]
}

function magicApiForms(module: ModuleRegistryRecord, features: FeatureRegistryRecord[]): DetailFormState[] {
  const baseRoute = adminRouteForModule(module)
  const operations = [
    ["list", "GET", baseRoute, "low"],
    ["create", "POST", baseRoute, "high"],
    ["show", "GET", `${baseRoute}/:id`, "low"],
    ["edit", "PUT", `${baseRoute}/:id`, "medium"],
    ["delete", "DELETE", `${baseRoute}/:id`, "critical"]
  ] as const
  return operations.map(([operation, method, routePath, riskLevel], index) => detailState("api", {
    auditEvent: `${module.moduleKey}.${operation}`,
    description: `${titleFromKey(operation)} ${module.name} API contract.`,
    featureId: findFeatureId(features, module.moduleKey, operation),
    key: `${module.moduleKey}.api.${operation}`,
    lifecycleAction: ["create", "edit", "delete"].includes(operation),
    method,
    name: `${titleFromKey(operation)} ${module.name}`,
    operation,
    permissionKey: permissionFor(module.moduleKey, operation),
    riskLevel,
    routePath,
    scope: "super_admin",
    sortOrder: String((index + 1) * 10),
    tenantRequired: false
  }))
}

function magicDatabaseForms(module: ModuleRegistryRecord): DetailFormState[] {
  const tableName = tableNameForModule(module)
  const fields = [
    ["id", "uuid", "primary key", false, true, true, ""],
    ["code", "varchar", "business identity", false, true, true, ""],
    ["name", "text", "business identity", false, true, false, ""],
    ["description", "text", "configuration", true, false, false, ""],
    ["active", "boolean", "lifecycle state", false, true, false, "true"],
    ["status", "enum", "lifecycle state", false, true, false, "active"],
    ["sort_order", "integer", "counter", false, false, false, "0"],
    ["created_at", "timestamp", "audit timestamp", false, false, false, ""],
    ["updated_at", "timestamp", "audit timestamp", false, false, false, ""],
    ["deleted_at", "timestamp", "soft delete marker", true, false, false, ""]
  ] as const
  return fields.map(([fieldName, fieldType, fieldNature, nullable, indexed, unique, defaultValue], index) => detailState("database", {
    defaultValue,
    description: `${titleFromKey(fieldName)} field for ${module.name}.`,
    fieldName,
    fieldNature,
    fieldType,
    indexed,
    key: `${tableName}.${fieldName}`,
    migrationId: `${module.moduleKey}.foundation`,
    name: `${titleFromKey(fieldName)} field`,
    nullable,
    scope: "system",
    softDelete: fieldName === "deleted_at",
    sortOrder: String((index + 1) * 10),
    tableName,
    tableScope: "master",
    unique
  }))
}

function magicScreenForms(module: ModuleRegistryRecord, features: FeatureRegistryRecord[]): DetailFormState[] {
  const baseRoute = module.routePath || `/sa/${pluralize(module.moduleKey)}`
  const componentPath = `apps/platform/web/src/pages/sa/${pascalCase(module.moduleKey)}.tsx`
  const screens = [
    ["list", baseRoute, "list"],
    ["show", `${baseRoute}/:id`, "show"],
    ["upsert", baseRoute, "upsert"],
    ["activity", `${baseRoute}/:id/activity`, "activity"]
  ] as const
  return screens.map(([operation, routePath, pageType], index) => detailState("screen", {
    componentPath,
    description: `${titleFromKey(operation)} screen for ${module.name}.`,
    featureId: findFeatureId(features, module.moduleKey, operation),
    key: `${module.moduleKey}.screen.${operation}`,
    name: `${module.name} ${titleFromKey(operation)}`,
    pageType,
    routePath,
    scope: "super_admin",
    sortOrder: String((index + 1) * 10),
    testPath: `apps/platform/web/e2e/${module.moduleKey}.spec.ts`
  }))
}

function magicActionForms(module: ModuleRegistryRecord, features: FeatureRegistryRecord[]): DetailFormState[] {
  const baseRoute = module.routePath || `/sa/${pluralize(module.moduleKey)}`
  const actions = ["create", "update", "delete", "restore", "export"] as const
  return actions.map((operation, index) => detailState("action", {
    auditEvent: `${module.moduleKey}.${operation}`,
    description: `${titleFromKey(operation)} action for ${module.name}.`,
    featureId: findFeatureId(features, module.moduleKey, operation),
    key: `${module.moduleKey}.action.${operation}`,
    lifecycleAction: ["create", "update", "delete", "restore"].includes(operation),
    name: `${titleFromKey(operation)} ${module.name}`,
    permissionKey: permissionFor(module.moduleKey, operation),
    routePath: routeForOperation(baseRoute, operation === "update" ? "edit" : operation),
    scope: "super_admin",
    sortOrder: String((index + 1) * 10)
  }))
}

function magicPlanningForm(module: ModuleRegistryRecord): DetailFormState {
  return detailState("planning", {
    acceptanceCriteria: [
      `${module.name} registry records are complete for feature, action, API, screen, database, and planning coverage.`,
      "Any missing backend route, UI route, permission, or database ownership is raised as a Work & Automation issue.",
      "Timeline and Gantt can show progress from raised issues and linked tasks."
    ].join("\n"),
    blockers: "Unknown implementation gaps, missing owner, missing permission, or route not yet mapped.",
    dependencyKeys: "",
    description: `Implementation coverage plan for ${module.name}.`,
    key: `${module.moduleKey}.coverage`,
    name: `${module.name} coverage plan`,
    ownerTeam: "Platform",
    planType: "coverage",
    riskLevel: "medium",
    richNotes: `<p>Track registry, permissions, APIs, screens, database ownership, tests, review, release notes, and deployment readiness for ${module.name}.</p>`,
    scope: "super_admin",
    sortOrder: "10",
    subscriptionFlagKey: `${module.moduleKey}.enabled`,
    validationPlan: "Run focused typecheck and related e2e after implementing each raised issue."
  })
}

function magicNoteForm(module: ModuleRegistryRecord): DetailFormState {
  return detailState("note", {
    description: `Working model notes for ${module.name}.`,
    key: `${module.moduleKey}.model`,
    name: `${module.name} model notes`,
    ownerTeam: "Platform",
    richNotes: `<p>${module.name} owns its routes, permissions, APIs, screens, database fields, activity, release references, and debug notes inside Project Manager.</p>`,
    scope: "super_admin",
    sortOrder: "10"
  })
}

function detailState(kind: DetailKind, patch: Partial<DetailFormState>): DetailFormState {
  return { ...detailFormFromRecord(null, kind), ...patch }
}

function detailPayload(form: DetailFormState, moduleId?: string) {
  return {
    ...form,
    dependencyKeys: form.dependencyKeys.split(",").map((item) => item.trim()).filter(Boolean),
    ...(moduleId ? { moduleId } : {}),
    sortOrder: Number(form.sortOrder) || 0
  }
}

function registryIssuePayload(target: RegistryIssueTarget, platform: PlatformRecord | null, group: ModuleGroupRecord | null, module: ModuleRegistryRecord | null) {
  const record = target.record
  const targetKey = registryTargetKey(target)
  const moduleRecord = target.kind === "module" ? target.record as ModuleRegistryRecord : module
  const groupRecord = target.kind === "group" ? target.record as ModuleGroupRecord : group
  const platformRecord = target.kind === "platform" ? target.record as PlatformRecord : platform
  return {
    active: true,
    assignee: "",
    description: record.description || "",
    key: `issue.registry.${target.kind}.${slugify(targetKey)}.${Date.now()}`,
    labels: ["registry", String(target.kind)],
    moduleGroupKey: groupRecord?.groupKey ?? "",
    moduleId: moduleRecord?.id ?? "",
    moduleKey: moduleRecord?.moduleKey ?? "",
    ownerTeam: "Platform",
    platformKey: platformRecord?.platform ?? "",
    priority: "medium",
    referenceId: targetKey,
    referenceType: String(target.kind),
    richNotes: `<p>Raised from Platform Registry ${String(target.kind)} reference: <code>${targetKey}</code>.</p>`,
    status: "open",
    title: `Review ${registryTargetLabel(target)}`,
    type: target.kind === "database" ? "bugfix" : "enhancement"
  }
}

function registryTargetKey(target: RegistryIssueTarget) {
  if (target.kind === "platform") return (target.record as PlatformRecord).platform
  if (target.kind === "group") return (target.record as ModuleGroupRecord).groupKey
  if (target.kind === "module") return (target.record as ModuleRegistryRecord).moduleKey
  if (target.kind === "feature") return (target.record as FeatureRegistryRecord).featureKey
  return (target.record as DetailRecord).key
}

function registryTargetLabel(target: RegistryIssueTarget) {
  return `${String(target.kind)}: ${target.record.name}`
}

function detailRecordsForKind(kind: DetailKind, queries: { actionQuery: ReturnType<typeof useDetailQuery>; apiQuery: ReturnType<typeof useDetailQuery>; databaseQuery: ReturnType<typeof useDetailQuery>; noteQuery: ReturnType<typeof useDetailQuery>; planningQuery: ReturnType<typeof useDetailQuery>; screenQuery: ReturnType<typeof useDetailQuery> }) {
  return detailQueryForKind(kind, queries)
}

async function invalidateDetail(queryClient: ReturnType<typeof useQueryClient>, kind: DetailKind, module: ModuleRegistryRecord | null) {
  await queryClient.invalidateQueries({ queryKey: ["admin", "platform-module-registry", module?.id, detailPath(kind)] })
}

function detailQueryForKind(kind: DetailKind, queries: { actionQuery: ReturnType<typeof useDetailQuery>; apiQuery: ReturnType<typeof useDetailQuery>; databaseQuery: ReturnType<typeof useDetailQuery>; noteQuery: ReturnType<typeof useDetailQuery>; planningQuery: ReturnType<typeof useDetailQuery>; screenQuery: ReturnType<typeof useDetailQuery> }) {
  if (kind === "action") return queries.actionQuery
  if (kind === "api") return queries.apiQuery
  if (kind === "screen") return queries.screenQuery
  if (kind === "database") return queries.databaseQuery
  if (kind === "planning") return queries.planningQuery
  return queries.noteQuery
}

function saveRecord(level: Level, form: FormState, platform: PlatformRecord | null, group: ModuleGroupRecord | null, module: ModuleRegistryRecord | null) {
  if (level === "platform") return apiPost<PlatformRecord>("/admin/platform-registry", platformPayload(form), "sa")
  if (level === "group") {
    if (!platform) throw new Error("Select a platform before saving a module group.")
    return apiPost<ModuleGroupRecord>("/admin/platform-module-groups", groupPayload(form, platform.id), "sa")
  }
  if (level === "module") {
    if (!group) throw new Error("Select a module group before saving a module registry record.")
    return apiPost<ModuleRegistryRecord>("/admin/platform-module-registry", modulePayload(form, group.id), "sa")
  }
  if (!module) throw new Error("Select a module before saving a feature registry record.")
  return apiPost<FeatureRegistryRecord>("/admin/platform-feature-registry", featurePayload(form, module.id), "sa")
}

function updateRecord(level: Level, form: FormState & { id: string }) {
  if (level === "platform") return apiPut<PlatformRecord>(`/admin/platform-registry/${form.id}`, platformPayload(form), "sa")
  if (level === "group") return apiPut<ModuleGroupRecord>(`/admin/platform-module-groups/${form.id}`, groupPayload(form), "sa")
  if (level === "module") return apiPut<ModuleRegistryRecord>(`/admin/platform-module-registry/${form.id}`, modulePayload(form), "sa")
  return apiPut<FeatureRegistryRecord>(`/admin/platform-feature-registry/${form.id}`, featurePayload(form), "sa")
}

function lifecycleRecord(level: Level, id: string, action: "deactivate" | "restore") {
  if (level === "platform") return apiPost<PlatformRecord>(`/admin/platform-registry/${id}/${action}`, {}, "sa")
  if (level === "group") return apiPost<ModuleGroupRecord>(`/admin/platform-module-groups/${id}/${action}`, {}, "sa")
  if (level === "module") return apiPost<ModuleRegistryRecord>(`/admin/platform-module-registry/${id}/${action}`, {}, "sa")
  return apiPost<FeatureRegistryRecord>(`/admin/platform-feature-registry/${id}/${action}`, {}, "sa")
}

function forceDeleteRecord(level: Level, id: string) {
  if (level === "platform") return apiDelete<{ deleted: boolean; id: string; name: string }>(`/admin/platform-registry/${id}`, "sa")
  if (level === "group") return apiDelete<{ deleted: boolean; id: string; name: string }>(`/admin/platform-module-groups/${id}`, "sa")
  if (level === "module") return apiDelete<{ deleted: boolean; id: string; name: string }>(`/admin/platform-module-registry/${id}`, "sa")
  return apiDelete<{ deleted: boolean; id: string; name: string }>(`/admin/platform-feature-registry/${id}`, "sa")
}

function platformPayload(form: FormState) {
  return { active: form.active, description: form.description.trim(), name: form.name.trim(), platform: form.keyValue.trim() }
}

function groupPayload(form: FormState, platformRegistryId?: string) {
  return {
    active: form.active,
    description: form.description.trim(),
    groupKey: form.keyValue.trim(),
    name: form.name.trim(),
    ...(platformRegistryId ? { platformRegistryId } : {}),
    sortOrder: Number(form.sortOrder) || 0
  }
}

function modulePayload(form: FormState, moduleGroupId?: string) {
  return {
    active: form.active,
    description: form.description.trim(),
    moduleKey: form.keyValue.trim(),
    moduleType: form.type || "module",
    name: form.name.trim(),
    ...(moduleGroupId ? { moduleGroupId } : {}),
    parentModuleId: form.parentModuleId.trim(),
    routePath: form.routePath.trim(),
    sortOrder: Number(form.sortOrder) || 0
  }
}

function featurePayload(form: FormState, moduleId?: string) {
  return {
    active: form.active,
    description: form.description.trim(),
    featureKey: form.keyValue.trim(),
    name: form.name.trim(),
    ...(moduleId ? { moduleId } : {}),
    permissionKey: form.permissionKey.trim(),
    routePath: form.routePath.trim(),
    sortOrder: Number(form.sortOrder) || 0,
    type: form.type || "page"
  }
}

async function invalidateLevel(queryClient: ReturnType<typeof useQueryClient>, level: Level, platform: PlatformRecord | null, group: ModuleGroupRecord | null) {
  if (level === "platform") {
    await queryClient.invalidateQueries({ queryKey: ["admin", "platform-registry"] })
    return
  }
  if (level === "group") {
    await queryClient.invalidateQueries({ queryKey: ["admin", "platform-registry", platform?.id, "module-groups"] })
    return
  }
  if (level === "module") {
    await queryClient.invalidateQueries({ queryKey: ["admin", "platform-module-groups", group?.id, "modules"] })
    return
  }
  await queryClient.invalidateQueries({ queryKey: ["admin", "platform-module-registry"] })
}

function updateForm(setForm: React.Dispatch<React.SetStateAction<FormState>>, patch: Partial<FormState>, setLocalBanner: (value: string) => void) {
  setLocalBanner("")
  setForm((current) => ({ ...current, ...patch }))
}

function updateDetailForm(setForm: React.Dispatch<React.SetStateAction<DetailFormState>>, patch: Partial<DetailFormState>, setLocalBanner: (value: string) => void) {
  setLocalBanner("")
  setForm((current) => ({ ...current, ...patch }))
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : ""
}

function RegistryHeader({ children, className }: { children: string; className?: string }) {
  return <WorkspaceTableHeaderCell className={className}>{children}</WorkspaceTableHeaderCell>
}

function slugify(value: string) {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function pascalCase(value: string) {
  return slugify(value)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")
}

function pluralize(value: string) {
  const key = slugify(value)
  if (!key) return "records"
  if (key.endsWith("y")) return `${key.slice(0, -1)}ies`
  if (key.endsWith("s")) return key
  return `${key}s`
}

function titleFromKey(value: string) {
  return slugify(value)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function trimOperationKey(value: string) {
  const key = slugify(value)
  return key.replace(/^(list|create|show|update|edit|delete|restore)-/, "").replace(/-(list|create|show|update|edit|delete|restore)$/, "") || key
}

function inferOperation(value: string) {
  const key = slugify(value)
  if (key.includes("create") || key.includes("new")) return "create"
  if (key.includes("show") || key.includes("view")) return "show"
  if (key.includes("update") || key.includes("edit")) return "edit"
  if (key.includes("delete") || key.includes("remove")) return "delete"
  if (key.includes("restore")) return "restore"
  return "list"
}

function routeForOperation(baseRoute: string, operation: string) {
  const normalized = baseRoute || "/sa/records"
  if (operation === "show" || operation === "edit" || operation === "update" || operation === "delete" || operation === "restore") return `${normalized}/:id`
  return normalized
}

function permissionFor(moduleKey: string, operation: string) {
  const action = operation === "list" || operation === "show" ? "view" : "manage"
  return `platform.${slugify(moduleKey).replace(/-/g, ".")}.profile.${action}`
}

function adminRouteForModule(module: ModuleRegistryRecord) {
  return `/admin/${pluralize(module.moduleKey)}`
}

function tableNameForModule(module: ModuleRegistryRecord) {
  return pluralize(module.moduleKey).replace(/-/g, "_")
}

function findFeatureId(features: FeatureRegistryRecord[], moduleKey: string, operation: string) {
  const operationKey = operation === "edit" ? "update" : operation
  const match = features.find((feature) => feature.featureKey === `${moduleKey}-${operationKey}` || feature.featureKey.endsWith(`-${operationKey}`))
  return match?.id ?? ""
}

function showRegistryError(title: string, error: unknown) {
  toast.error(title, {
    description: error instanceof Error ? error.message : "Please try again."
  })
}
