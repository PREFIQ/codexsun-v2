import { useMemo, useState, type ReactNode } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Bot, Building2, CheckCircle2, Globe2, Image, Mail, Newspaper, Pencil, Plus, ReceiptText, RefreshCw, Save, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@codexsun/ui/components/button"
import { Input } from "@codexsun/ui/components/input"
import { Switch } from "@codexsun/ui/components/switch"
import { WorkspaceAnimatedTabs, type WorkspaceAnimatedTab } from "@codexsun/ui/workspace/animated-tabs"
import { WorkspacePage } from "@codexsun/ui/workspace/page"
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters"
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination"
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions"
import { WorkspaceShowCard, WorkspaceShowLayout, WorkspaceDetailTable } from "@codexsun/ui/workspace/show"
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status"
import { WorkspaceTableEmptyState, WorkspaceTableHeaderCell, WorkspaceTablePanel, WorkspaceTableSkeletonRows } from "@codexsun/ui/workspace/table"
import { WorkspaceFormBanner, WorkspaceFormField, WorkspaceFormGrid, WorkspaceFormPanel, WorkspaceUpsertPage } from "@codexsun/ui/workspace/upsert"
import { buildShowingLabel } from "@codexsun/ui/workspace/utils"
import { cn } from "@codexsun/ui/lib/utils"
import { apiGet, apiPost, apiPut } from "../../api"

type Tenant = {
  corporateId: string | null
  dbHost: string
  dbName: string
  dbPort: number
  dbSecretRef: string
  dbType: string
  dbUser: string
  enabledModuleKeys: string[]
  id: string
  mobile: string | null
  payloadSettings: Record<string, unknown>
  slug: string
  tenantCode: string
  tenantName: string
  status: "active" | "inactive" | "provisioning" | "suspended" | string
}

type TenantView =
  | { mode: "list" }
  | { mode: "show"; tenant: Tenant }
  | { mode: "upsert"; tenant: Tenant | null; returnTo: "list" | "show" }

type TenantSavePayload = {
  corporateId: string | null
  dbHost: string
  dbName: string
  dbPort: number
  dbSecretRef: string
  dbType: string
  dbUser: string
  enabledModuleKeys: string[]
  mobile: string | null
  payloadSettings: Record<string, unknown>
  slug: string
  status: string
  tenantCode: string
  tenantName: string
}

type AuditEventDTO = {
  actor_email?: string | null
  created_at?: string
  event_name: string
  id: number | string
}

const filterOptions = [
  { id: "all", label: "All tenants" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "provisioning", label: "Provisioning" },
  { id: "suspended", label: "Suspended" }
]

const columnOptions = [
  { id: "tenant", label: "Tenant" },
  { id: "corporateId", label: "Corporate ID" },
  { id: "mobile", label: "Mobile" },
  { id: "slug", label: "Slug" },
  { id: "database", label: "Database" },
  { id: "companies", label: "Companies" },
  { id: "status", label: "Status" }
]

export function TenantList({ onBack: _onBack }: { onBack: () => void }) {
  const queryClient = useQueryClient()
  const [view, setView] = useState<TenantView>({ mode: "list" })
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(100)
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    companies: true,
    corporateId: true,
    database: true,
    mobile: false,
    slug: false,
    status: true,
    tenant: true
  })

  const tenantsQuery = useQuery<Tenant[]>({
    queryKey: ["admin", "tenants"],
    queryFn: () => apiGet<Tenant[]>("/admin/tenants", "sa")
  })

  const createMutation = useMutation({
    mutationFn: (tenant: TenantSavePayload) => apiPost<Tenant>("/admin/tenants", toTenantApiPayload(tenant), "sa"),
    onSuccess: async (tenant) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "tenants"] })
      toast.success("Tenant saved", {
        description: `${tenant.tenantName} is ready in the tenant list.`
      })
      setView({ mode: "show", tenant })
    },
    onError: (error) => showTenantError("Tenant save failed", error)
  })

  const updateMutation = useMutation({
    mutationFn: (tenant: TenantSavePayload & { id: string }) =>
      apiPut<Tenant>(
        `/admin/tenants/${tenant.id}`,
        toTenantApiPayload(tenant),
        "sa"
      ),
    onSuccess: async (tenant) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "tenants"] })
      toast.success("Tenant updated", {
        description: `${tenant.tenantName} was updated successfully.`
      })
      setView({ mode: "show", tenant })
    },
    onError: (error) => showTenantError("Tenant update failed", error)
  })

  const suspendMutation = useMutation({
    mutationFn: (id: string) => apiPost<Tenant>(`/admin/tenants/${id}/suspend`, {}, "sa"),
    onSuccess: async (tenant) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "tenants"] })
      toast.warning("Tenant suspended", {
        description: `${tenant.tenantName} is no longer active.`
      })
      setView((current) => (current.mode === "show" ? { mode: "show", tenant } : current))
    },
    onError: (error) => showTenantError("Tenant suspend failed", error)
  })

  const restoreMutation = useMutation({
    mutationFn: (id: string) => apiPost<Tenant>(`/admin/tenants/${id}/restore`, {}, "sa"),
    onSuccess: async (tenant) => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "tenants"] })
      toast.info("Tenant restored", {
        description: `${tenant.tenantName} is active again.`
      })
      setView((current) => (current.mode === "show" ? { mode: "show", tenant } : current))
    },
    onError: (error) => showTenantError("Tenant restore failed", error)
  })
  const tenantActivityQuery = useQuery<AuditEventDTO[]>({
    enabled: view.mode === "show",
    queryKey: ["admin", "activity", "tenant", view.mode === "show" ? view.tenant.id : ""],
    queryFn: () => apiGet<AuditEventDTO[]>(`/admin/activity/tenant/${view.mode === "show" ? view.tenant.id : ""}`, "sa")
  })

  const tenants = tenantsQuery.data ?? []
  const filteredTenants = useMemo(() => {
    const term = searchValue.trim().toLowerCase()
    return tenants.filter((tenant) => {
      const matchesSearch =
        !term ||
        [
          tenant.tenantName,
          tenant.tenantCode,
          tenant.corporateId ?? "",
          tenant.mobile ?? "",
          tenant.slug,
          tenant.dbName,
          tenant.status
        ].some((value) => value.toLowerCase().includes(term))
      const matchesStatus = statusFilter === "all" || tenant.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [searchValue, statusFilter, tenants])

  const totalPages = Math.max(1, Math.ceil(filteredTenants.length / rowsPerPage))
  const pageTenants = filteredTenants.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  function saveTenant(input: TenantFormState) {
    if (input.id) {
      updateMutation.mutate({
        ...toTenantSavePayload(input),
        id: input.id,
      })
      return
    }
    createMutation.mutate(toTenantSavePayload(input))
  }

  function suspendTenant(tenant: Tenant) {
    suspendMutation.mutate(tenant.id)
  }

  function restoreTenant(tenant: Tenant) {
    restoreMutation.mutate(tenant.id)
  }

  function tenantSaveErrorMessage() {
    const error = createMutation.error ?? updateMutation.error
    return error instanceof Error ? error.message : ""
  }

  if (view.mode === "show") {
    return (
      <TenantShowPage
        tenant={view.tenant}
        onBack={() => setView({ mode: "list" })}
        onEdit={() => setView({ mode: "upsert", tenant: view.tenant, returnTo: "show" })}
        onRestore={() => restoreTenant(view.tenant)}
        onSuspend={() => suspendTenant(view.tenant)}
        activity={tenantActivityQuery.data ?? []}
        activityLoading={tenantActivityQuery.isFetching}
      />
    )
  }

  if (view.mode === "upsert") {
    return (
      <TenantUpsertPage
        errorMessage={tenantSaveErrorMessage()}
        loading={createMutation.isPending || updateMutation.isPending}
        tenant={view.tenant}
        onBack={() => setView(view.returnTo === "show" && view.tenant ? { mode: "show", tenant: view.tenant } : { mode: "list" })}
        onSubmit={saveTenant}
      />
    )
  }

  return (
    <WorkspacePage
      title="Tenants"
      description="Create and review tenant records with code, status, database context, and lifecycle controls."
      technicalName="page.tenant.list"
      actions={
        <div className="flex items-center gap-2">
          <Button
            disabled={tenantsQuery.isFetching}
            onClick={() => void tenantsQuery.refetch()}
            type="button"
            variant="outline"
            className="h-9 rounded-md"
          >
            <RefreshCw className={cn("size-4", tenantsQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button type="button" className="h-9 rounded-md" onClick={() => setView({ mode: "upsert", tenant: null, returnTo: "list" })}>
            <Plus className="size-4" />
            New tenant
          </Button>
        </div>
      }
    >
      <WorkspaceFilters
        columnOptions={columnOptions.map((column) => ({
          ...column,
          checked: visibleColumns[column.id] ?? true,
          onCheckedChange: (checked) => setVisibleColumns((current) => ({ ...current, [column.id]: checked }))
        }))}
        filterOptions={filterOptions}
        filterValue={statusFilter}
        onFilterValueChange={(value) => {
          setStatusFilter(value)
          setCurrentPage(1)
        }}
        onSearchValueChange={(value) => {
          setSearchValue(value)
          setCurrentPage(1)
        }}
        onShowAllColumns={() => setVisibleColumns(Object.fromEntries(columnOptions.map((column) => [column.id, true])))}
        searchPlaceholder="Search tenant, corporate ID, mobile, slug, database, or status"
        searchValue={searchValue}
      />
      <WorkspaceTablePanel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead className="bg-muted/50">
              <tr>
                <TenantHeader>#</TenantHeader>
                {visibleColumns.tenant ? <TenantHeader>Tenant <span className="text-muted-foreground">↕</span></TenantHeader> : null}
                {visibleColumns.corporateId ? <TenantHeader>Corporate ID <span className="text-muted-foreground">↕</span></TenantHeader> : null}
                {visibleColumns.mobile ? <TenantHeader>Mobile <span className="text-muted-foreground">↕</span></TenantHeader> : null}
                {visibleColumns.slug ? <TenantHeader>Slug <span className="text-muted-foreground">↕</span></TenantHeader> : null}
                {visibleColumns.database ? <TenantHeader>Database <span className="text-muted-foreground">↕</span></TenantHeader> : null}
                {visibleColumns.companies ? <TenantHeader>Companies <span className="text-muted-foreground">↕</span></TenantHeader> : null}
                {visibleColumns.status ? <TenantHeader>Status <span className="text-muted-foreground">↕</span></TenantHeader> : null}
                <TenantHeader className="text-right">Action</TenantHeader>
              </tr>
            </thead>
            <tbody>
              {pageTenants.map((tenant, index) => {
                const summary = toTenantSummary(tenant)
                const suspended = tenant.status === "suspended" || tenant.status === "inactive"
                return (
                  <tr key={tenant.id} className={cn("border-b border-border/70 last:border-b-0", suspended && "bg-muted/20 text-muted-foreground")}>
                    <td className="px-4 py-2.5 text-muted-foreground">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                    {visibleColumns.tenant ? (
                      <td className="px-4 py-2.5">
                        <button
                          className="max-w-72 truncate font-medium hover:underline"
                          type="button"
                          onClick={() => setView({ mode: "show", tenant })}
                        >
                          {tenant.tenantName}
                        </button>
                      </td>
                    ) : null}
                    {visibleColumns.corporateId ? <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{tenant.corporateId ?? "-"}</td> : null}
                    {visibleColumns.mobile ? <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{tenant.mobile ?? "-"}</td> : null}
                    {visibleColumns.slug ? <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{tenant.slug}</td> : null}
                    {visibleColumns.database ? <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{tenant.dbName}</td> : null}
                    {visibleColumns.companies ? <td className="px-4 py-2.5 tabular-nums">{summary.companyCount}</td> : null}
                    {visibleColumns.status ? (
                      <td className="px-4 py-2.5">
                        <WorkspaceStatusBadge label={tenant.status} tone={statusTone(tenant.status)} />
                      </td>
                    ) : null}
                    <td className="px-4 py-1.5 text-right">
                      <WorkspaceRowActions
                        title={tenant.tenantName}
                        deleteLabel="Suspend"
                        isSuspended={suspended}
                        restoreLabel="Restore"
                        onDelete={() => suspendTenant(tenant)}
                        onEdit={() => setView({ mode: "upsert", tenant, returnTo: "list" })}
                        onRestore={() => restoreTenant(tenant)}
                        onView={() => setView({ mode: "show", tenant })}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {pageTenants.length === 0 && tenantsQuery.isFetching ? <WorkspaceTableSkeletonRows columns={8} /> : null}
        {pageTenants.length === 0 && !tenantsQuery.isFetching ? <WorkspaceTableEmptyState>No tenants found.</WorkspaceTableEmptyState> : null}
      </WorkspaceTablePanel>
      <WorkspacePagination
        page={currentPage}
        rowsPerPage={rowsPerPage}
        showingLabel={buildShowingLabel(currentPage, rowsPerPage, filteredTenants.length)}
        singularLabel="tenants"
        totalCount={filteredTenants.length}
        totalPages={totalPages}
        onNextPage={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
        onPageChange={setCurrentPage}
        onPreviousPage={() => setCurrentPage((page) => Math.max(1, page - 1))}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value)
          setCurrentPage(1)
        }}
      />
    </WorkspacePage>
  )
}

function TenantShowPage({
  activity,
  activityLoading,
  tenant,
  onBack,
  onEdit,
  onRestore,
  onSuspend
}: {
  activity: AuditEventDTO[]
  activityLoading: boolean
  tenant: Tenant
  onBack: () => void
  onEdit: () => void
  onRestore: () => void
  onSuspend: () => void
}) {
  const summary = toTenantSummary(tenant)
  const suspended = tenant.status === "suspended" || tenant.status === "inactive"

  return (
    <WorkspacePage
      title={tenant.tenantName}
      description="Review tenant identity, database, and lifecycle details."
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
          <Button type="button" variant="outline" className="h-9 rounded-md" onClick={suspended ? onRestore : onSuspend}>
            {suspended ? "Restore" : "Suspend"}
          </Button>
        </div>
      }
    >
      <WorkspaceShowLayout>
        <div className="space-y-4">
          <WorkspaceShowCard title="Tenant profile">
            <WorkspaceDetailTable
              rows={[
                ["Tenant", tenant.tenantName],
                ["Code", <span key="code" className="font-mono text-xs">{tenant.tenantCode}</span>],
                ["Corporate ID", <span key="corp" className="font-mono text-xs">{tenant.corporateId ?? "-"}</span>],
                ["Mobile", <span key="mobile" className="font-mono text-xs">{tenant.mobile ?? "-"}</span>],
                ["Slug", <span key="slug" className="font-mono text-xs">{tenant.slug}</span>],
                ["Status", <WorkspaceStatusBadge key="status" label={tenant.status} tone={statusTone(tenant.status)} />]
              ]}
            />
          </WorkspaceShowCard>
        </div>
        <div className="space-y-4">
          <WorkspaceShowCard title="Database context">
            <WorkspaceDetailTable
              rows={[
                ["Type", tenant.dbType],
                ["Host", tenant.dbHost],
                ["Port", tenant.dbPort],
                ["Database", <span key="db" className="font-mono text-xs">{tenant.dbName}</span>],
                ["User", tenant.dbUser],
                ["Secret", <span key="secret" className="font-mono text-xs">{tenant.dbSecretRef}</span>],
                ["Companies", summary.companyCount],
                ["Active", summary.activeCompanyCount]
              ]}
            />
          </WorkspaceShowCard>
          <TenantActivityCard events={activity} loading={activityLoading} />
        </div>
      </WorkspaceShowLayout>
    </WorkspacePage>
  )
}

function TenantActivityCard({ events, loading }: { events: AuditEventDTO[]; loading: boolean }) {
  return (
    <WorkspaceShowCard title="Activity">
      <div className="divide-y divide-border/60">
        {loading ? <p className="px-4 py-3 text-sm text-muted-foreground">Loading activity...</p> : null}
        {!loading && events.length === 0 ? <p className="px-4 py-3 text-sm text-muted-foreground">No activity yet.</p> : null}
        {events.slice(0, 6).map((event) => (
          <div key={String(event.id)} className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground">{event.event_name.replace(/[._-]+/g, " ")}</p>
              <span className="text-xs text-muted-foreground">{formatDate(event.created_at)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{event.actor_email || "system"}</p>
          </div>
        ))}
      </div>
    </WorkspaceShowCard>
  )
}

type TenantFormState = {
  corporateId: string
  dbHost: string
  dbName: string
  dbPort: string
  dbSecretRef: string
  dbType: string
  dbUser: string
  enabledModuleKeys: string[]
  id?: string
  mobile: string
  slug: string
  tenantCode: string
  tenantName: string
  status: string
  mediaDefaultCategory: string
  mediaDefaultFolder: string
  mediaDefaultVisibility: string
  mediaMaxUploadMb: string
  mediaPublicAssetsEnabled: boolean
}

type TenantAppAccess = {
  color: string
  description: string
  enabled: boolean
  icon: ReactNode
  moduleKey: string
  name: string
}

const tenantAppAccess: TenantAppAccess[] = [
  {
    color: "bg-slate-950",
    description: "Shared workspace, company setup, roles, subscription, and cross-app launch desk.",
    enabled: true,
    icon: <Building2 className="size-5" />,
    moduleKey: "core",
    name: "Application"
  },
  {
    color: "bg-neutral-900",
    description: "Business assistance chat for tenant guidance, safe summaries, provider setup, and knowledge lookup.",
    enabled: false,
    icon: <Bot className="size-5" />,
    moduleKey: "app.zetro",
    name: "ZETRO"
  },
  {
    color: "bg-emerald-600",
    description: "Sales, purchase, receipt, payment, accounts, reports, masters, common data, and billing settings.",
    enabled: true,
    icon: <ReceiptText className="size-5" />,
    moduleKey: "business.billing",
    name: "Billing"
  },
  {
    color: "bg-sky-600",
    description: "Reusable workspace mail service with inbox, outbox, drafts, sent history, contacts, and SMTP settings.",
    enabled: true,
    icon: <Mail className="size-5" />,
    moduleKey: "app.mail",
    name: "Mail"
  },
  {
    color: "bg-orange-600",
    description: "Tenant-scoped posts, categories, tags, comments, images, and SEO metadata.",
    enabled: false,
    icon: <Newspaper className="size-5" />,
    moduleKey: "app.blog",
    name: "Blog"
  },
  {
    color: "bg-violet-600",
    description: "Public tenant site content and slider management.",
    enabled: true,
    icon: <Globe2 className="size-5" />,
    moduleKey: "app.sites",
    name: "Sites"
  },
  {
    color: "bg-cyan-700",
    description: "Tenant media asset storage for images, documents, public files, and reusable uploads.",
    enabled: true,
    icon: <Image className="size-5" />,
    moduleKey: "app.media",
    name: "Media"
  }
]

function TenantUpsertPage({
  errorMessage,
  loading,
  tenant,
  onBack,
  onSubmit
}: {
  errorMessage?: string
  loading: boolean
  tenant: Tenant | null
  onBack: () => void
  onSubmit: (tenant: TenantFormState) => void
}) {
  const isEdit = tenant !== null
  const mediaSettings = readTenantMediaSettings(tenant?.payloadSettings)
  const [form, setForm] = useState<TenantFormState>({
    corporateId: tenant?.corporateId ?? toCorporateId(tenant?.tenantCode ?? ""),
    dbHost: tenant?.dbHost ?? "localhost",
    dbName: tenant?.dbName ?? toDatabaseName(tenant?.tenantCode ?? ""),
    dbPort: String(tenant?.dbPort ?? 3306),
    dbSecretRef: tenant?.dbSecretRef ?? "DB_PASSWORD",
    dbType: tenant?.dbType ?? "mariadb",
    dbUser: tenant?.dbUser ?? "root",
    enabledModuleKeys: tenant?.enabledModuleKeys ?? tenantAppAccess.filter((app) => app.enabled).map((app) => app.moduleKey),
    ...(tenant ? { id: tenant.id } : {}),
    mobile: tenant?.mobile ?? "",
    slug: tenant?.slug ?? toSlug(tenant?.tenantCode ?? ""),
    status: tenant?.status ?? "active",
    tenantCode: tenant?.tenantCode ?? "",
    tenantName: tenant?.tenantName ?? "",
    mediaDefaultCategory: mediaSettings.defaultCategory,
    mediaDefaultFolder: mediaSettings.defaultFolder,
    mediaDefaultVisibility: mediaSettings.defaultVisibility,
    mediaMaxUploadMb: String(mediaSettings.maxUploadMb),
    mediaPublicAssetsEnabled: mediaSettings.publicAssetsEnabled
  })
  const [activeTab, setActiveTab] = useState("details")
  const [localBanner, setLocalBanner] = useState("")
  const [appAccess, setAppAccess] = useState(() =>
    tenantAppAccess.map((app) => ({
      ...app,
      enabled: app.moduleKey === "core" || (tenant ? tenant.enabledModuleKeys.includes(app.moduleKey) : app.enabled)
    }))
  )
  const [corporateIdTouched, setCorporateIdTouched] = useState(false)
  const enabledAppCount = appAccess.filter((app) => app.enabled).length

  const tabs: WorkspaceAnimatedTab[] = [
    {
      label: "Details",
      value: "details",
      content: (
        <WorkspaceFormPanel
          footer={
            <>
              <Button type="button" className="rounded-md bg-foreground text-background hover:bg-foreground/90" onClick={() => setActiveTab("database")}>
                Next
              </Button>
              <Button type="button" variant="outline" className="rounded-md" onClick={onBack}>
                <X className="size-4" />
                Cancel
              </Button>
            </>
          }
        >
          <WorkspaceFormGrid columns={2}>
            <WorkspaceFormField label="Tenant name" required>
              <Input
                className="h-11 rounded-md"
                value={form.tenantName}
                onChange={(event) => {
                  setLocalBanner("")
                  setForm((current) => ({ ...current, tenantName: event.target.value }))
                }}
                required
              />
            </WorkspaceFormField>
            <WorkspaceFormField label="Tenant code" required>
              <div className="flex gap-2">
                <Input
                  className="h-11 rounded-md font-mono uppercase"
                  value={form.tenantCode}
                  onChange={(event) => {
                    setLocalBanner("")
                    const tenantCode = event.target.value
                    setForm((current) => ({
                      ...current,
                      corporateId: corporateIdTouched ? current.corporateId : toCorporateId(tenantCode),
                      dbName: toDatabaseName(tenantCode),
                      slug: toSlug(tenantCode),
                      tenantCode
                    }))
                  }}
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-md px-4"
                  onClick={() => {
                    const tenantCode = toSlug(form.tenantName || form.tenantCode)
                    setCorporateIdTouched(false)
                    setForm((current) => ({
                      ...current,
                      corporateId: toCorporateId(tenantCode),
                      dbName: toDatabaseName(tenantCode),
                      slug: toSlug(tenantCode),
                      tenantCode
                    }))
                  }}
                >
                  Auto
                </Button>
              </div>
            </WorkspaceFormField>
            <WorkspaceFormField label="Corporate ID">
              <Input
                className="h-11 rounded-md font-mono uppercase"
                value={form.corporateId}
                onChange={(event) => {
                  setCorporateIdTouched(true)
                  setForm((current) => ({ ...current, corporateId: event.target.value }))
                }}
              />
            </WorkspaceFormField>
            <WorkspaceFormField label="Mobile">
              <Input
                className="h-11 rounded-md"
                value={form.mobile}
                onChange={(event) => setForm((current) => ({ ...current, mobile: event.target.value }))}
              />
            </WorkspaceFormField>
            <WorkspaceFormField label="Slug">
              <Input
                className="h-11 rounded-md"
                value={form.slug}
                onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
              />
            </WorkspaceFormField>
            <div className="flex items-end">
              <div className="flex h-[4.5rem] w-full items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-4 text-emerald-800">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <CheckCircle2 className="size-4" />
                    Active
                  </div>
                  <p className="mt-1 text-sm">Active tenants can be selected for workspace access.</p>
                </div>
                <Switch
                  checked={form.status === "active"}
                  onCheckedChange={(checked) => setForm((current) => ({ ...current, status: checked ? "active" : "inactive" }))}
                />
              </div>
            </div>
          </WorkspaceFormGrid>
        </WorkspaceFormPanel>
      )
    },
    {
      label: "Database",
      value: "database",
      content: (
        <WorkspaceFormPanel
          footer={
            <>
              <Button type="button" className="rounded-md bg-foreground text-background hover:bg-foreground/90" onClick={() => setActiveTab("media")}>
                Next
              </Button>
              <Button type="button" variant="outline" className="rounded-md" onClick={onBack}>
                <X className="size-4" />
                Cancel
              </Button>
            </>
          }
        >
          <WorkspaceFormGrid columns={2}>
            <WorkspaceFormField label="Database type">
              <Input
                className="h-11 rounded-md"
                value={form.dbType}
                onChange={(event) => setForm((current) => ({ ...current, dbType: event.target.value }))}
              />
            </WorkspaceFormField>
            <WorkspaceFormField label="Host">
              <Input
                className="h-11 rounded-md"
                value={form.dbHost}
                onChange={(event) => setForm((current) => ({ ...current, dbHost: event.target.value }))}
              />
            </WorkspaceFormField>
            <WorkspaceFormField label="Port">
              <Input
                className="h-11 rounded-md"
                value={form.dbPort}
                onChange={(event) => setForm((current) => ({ ...current, dbPort: event.target.value }))}
              />
            </WorkspaceFormField>
            <WorkspaceFormField label="Database name">
              <Input
                className="h-11 rounded-md font-mono"
                value={form.dbName}
                onChange={(event) => setForm((current) => ({ ...current, dbName: event.target.value }))}
              />
            </WorkspaceFormField>
            <WorkspaceFormField label="User">
              <Input
                className="h-11 rounded-md"
                value={form.dbUser}
                onChange={(event) => setForm((current) => ({ ...current, dbUser: event.target.value }))}
              />
            </WorkspaceFormField>
            <WorkspaceFormField label="Secret reference">
              <Input
                className="h-11 rounded-md font-mono"
                value={form.dbSecretRef}
                onChange={(event) => setForm((current) => ({ ...current, dbSecretRef: event.target.value }))}
              />
            </WorkspaceFormField>
          </WorkspaceFormGrid>
        </WorkspaceFormPanel>
      )
    },
    {
      label: "Media Assets",
      value: "media",
      content: (
        <WorkspaceFormPanel
          footer={
            <>
              <Button type="button" className="rounded-md bg-foreground text-background hover:bg-foreground/90" onClick={() => setActiveTab("settings")}>
                Next
              </Button>
              <Button type="button" variant="outline" className="rounded-md" onClick={onBack}>
                <X className="size-4" />
                Cancel
              </Button>
            </>
          }
        >
          <div className="rounded-md border border-border/70 p-4">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-md bg-cyan-700 text-white">
                <Image className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Media asset settings</h2>
                <p className="text-sm text-muted-foreground">Control the tenant default folder, category, visibility, and upload limit used by Media Assets.</p>
              </div>
            </div>
          </div>
          <WorkspaceFormGrid columns={2} className="mt-4">
            <WorkspaceFormField label="Default category">
              <Input
                className="h-11 rounded-md"
                value={form.mediaDefaultCategory}
                onChange={(event) => setForm((current) => ({ ...current, mediaDefaultCategory: event.target.value }))}
              />
            </WorkspaceFormField>
            <WorkspaceFormField label="Default folder">
              <Input
                className="h-11 rounded-md"
                value={form.mediaDefaultFolder}
                onChange={(event) => setForm((current) => ({ ...current, mediaDefaultFolder: event.target.value }))}
              />
            </WorkspaceFormField>
            <WorkspaceFormField label="Default visibility">
              <Input
                className="h-11 rounded-md"
                value={form.mediaDefaultVisibility}
                onChange={(event) => setForm((current) => ({ ...current, mediaDefaultVisibility: event.target.value }))}
              />
            </WorkspaceFormField>
            <WorkspaceFormField label="Upload limit MB">
              <Input
                className="h-11 rounded-md"
                value={form.mediaMaxUploadMb}
                onChange={(event) => setForm((current) => ({ ...current, mediaMaxUploadMb: event.target.value }))}
              />
            </WorkspaceFormField>
            <div className="flex items-end md:col-span-2">
              <div className="flex h-[4.5rem] w-full items-center justify-between rounded-md border border-border/70 bg-muted/35 px-4">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground">Public media assets</div>
                  <p className="mt-1 text-sm text-muted-foreground">Allow this tenant to mark uploaded media as public.</p>
                </div>
                <Switch
                  checked={form.mediaPublicAssetsEnabled}
                  onCheckedChange={(mediaPublicAssetsEnabled) => setForm((current) => ({ ...current, mediaPublicAssetsEnabled }))}
                />
              </div>
            </div>
          </WorkspaceFormGrid>
        </WorkspaceFormPanel>
      )
    },
    {
      label: "Settings",
      value: "settings",
      content: (
        <WorkspaceFormPanel
          footer={
            <>
              <Button type="submit" disabled={loading} className="rounded-md bg-foreground text-background hover:bg-foreground/90">
                <Save className="size-4" />
                {loading ? "Saving..." : isEdit ? "Update tenant" : "Save"}
              </Button>
              <Button type="button" variant="outline" className="rounded-md" onClick={onBack}>
                <X className="size-4" />
                Cancel
              </Button>
            </>
          }
        >
          <div className="rounded-md border border-border/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">Tenant app access</h2>
                <p className="text-sm text-muted-foreground">Choose the app areas available to this tenant workspace.</p>
              </div>
              <span className="rounded-md border border-border/70 bg-background px-3 py-1 text-xs font-semibold">{enabledAppCount} enabled</span>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {appAccess.map((app, index) => (
              <TenantAppCard
                key={app.name}
                app={app}
                onToggle={(enabled) =>
                  setAppAccess((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, enabled } : item)))
                }
              />
            ))}
          </div>
        </WorkspaceFormPanel>
      )
    }
  ]

  return (
    <WorkspaceUpsertPage
      title={isEdit ? "Edit tenant" : "New tenant"}
      description="Update tenant identity, database context, and lifecycle status."
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
          if (activeTab === "details") {
            if (!form.tenantName.trim()) {
              setLocalBanner("Tenant name is required.")
              return
            }
            if (!form.tenantCode.trim()) {
              setLocalBanner("Tenant code is required.")
              return
            }
            setLocalBanner("")
            setActiveTab("database")
            return
          }
          if (activeTab === "database") {
            setActiveTab("media")
            return
          }
          if (activeTab === "media") {
            setActiveTab("settings")
            return
          }
          if (!form.tenantName.trim()) {
            setActiveTab("details")
            setLocalBanner("Tenant name is required.")
            return
          }
          if (!form.tenantCode.trim()) {
            setActiveTab("details")
            setLocalBanner("Tenant code is required.")
            return
          }
          setLocalBanner("")
          onSubmit({
            ...form,
            enabledModuleKeys: appAccess.filter((app) => app.enabled).map((app) => app.moduleKey)
          })
        }}
      >
        <div className="rounded-md border border-border/70 bg-card/95 p-5 shadow-sm">
          {localBanner || errorMessage ? (
            <WorkspaceFormBanner title={localBanner ? "Missing required field" : "Could not save"}>
              {localBanner || errorMessage}
            </WorkspaceFormBanner>
          ) : null}
          <WorkspaceAnimatedTabs tabs={tabs} value={activeTab} onValueChange={setActiveTab} />
        </div>
      </form>
    </WorkspaceUpsertPage>
  )
}

function TenantAppCard({ app, onToggle }: { app: TenantAppAccess; onToggle: (enabled: boolean) => void }) {
  const locked = app.moduleKey === "core"
  return (
    <div className={cn("flex min-h-32 gap-3 rounded-md border border-border/70 p-4", app.enabled ? "bg-muted/40" : "bg-background")}>
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-md text-white", app.color)}>{app.icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">{app.name}</h3>
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-[11px]",
              app.enabled ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground",
            )}
          >
            {app.enabled ? "Enabled" : "Disabled"}
          </span>
        </div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{app.description}</p>
      </div>
      <Switch checked={app.enabled} disabled={locked} onCheckedChange={onToggle} className="mt-1" />
    </div>
  )
}

function TenantHeader({ children, className }: { children: ReactNode; className?: string }) {
  const label = Array.isArray(children) ? children[0] : children

  return (
    <WorkspaceTableHeaderCell className={className}>
      {label}
    </WorkspaceTableHeaderCell>
  )
}

function toTenantSavePayload(form: TenantFormState): TenantSavePayload {
  const enabledModuleKeys = Array.from(new Set(["core", ...form.enabledModuleKeys]))

  return {
    corporateId: form.corporateId.trim() || null,
    dbHost: form.dbHost.trim() || "localhost",
    dbName: form.dbName.trim() || toDatabaseName(form.tenantCode),
    dbPort: Number(form.dbPort) || 3306,
    dbSecretRef: form.dbSecretRef.trim() || "DB_PASSWORD",
    dbType: form.dbType.trim() || "mariadb",
    dbUser: form.dbUser.trim() || "root",
    enabledModuleKeys,
    mobile: form.mobile.replace(/\D/g, "") || null,
    payloadSettings: {
      apps: { enabled: enabledModuleKeys },
      media: {
        defaultCategory: form.mediaDefaultCategory.trim() || "files",
        defaultFolder: form.mediaDefaultFolder.trim() || "media",
        defaultVisibility: form.mediaDefaultVisibility.trim() || "private",
        maxUploadMb: Number(form.mediaMaxUploadMb) || 10,
        publicAssetsEnabled: form.mediaPublicAssetsEnabled
      }
    },
    slug: form.slug.trim() || toSlug(form.tenantCode),
    status: form.status,
    tenantCode: form.tenantCode.trim(),
    tenantName: form.tenantName.trim()
  }
}

function readTenantMediaSettings(payloadSettings: Record<string, unknown> | undefined) {
  const media = payloadSettings?.media && typeof payloadSettings.media === "object" && !Array.isArray(payloadSettings.media)
    ? payloadSettings.media as Record<string, unknown>
    : {}
  return {
    defaultCategory: typeof media.defaultCategory === "string" ? media.defaultCategory : "files",
    defaultFolder: typeof media.defaultFolder === "string" ? media.defaultFolder : "media",
    defaultVisibility: typeof media.defaultVisibility === "string" ? media.defaultVisibility : "private",
    maxUploadMb: Number(media.maxUploadMb ?? 10) || 10,
    publicAssetsEnabled: Boolean(media.publicAssetsEnabled)
  }
}

function toTenantApiPayload(tenant: TenantSavePayload) {
  return tenant
}

function toTenantSummary(tenant: Tenant) {
  const active = tenant.status === "active"
  return {
    activeCompanyCount: active ? 1 : 0,
    companyCount: 1,
    corporateId: tenant.corporateId ?? toCorporateId(tenant.tenantCode),
    database: tenant.dbName
  }
}

function toCorporateId(value: string) {
  return value.trim().toUpperCase()
}

function toDatabaseName(value: string) {
  const code = value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "")
  return code ? `${code}_db` : ""
}

function toSlug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

function statusTone(status: string) {
  if (status === "active") return "success"
  if (status === "provisioning") return "info"
  if (status === "suspended" || status === "inactive") return "danger"
  return "neutral"
}

function formatDate(value: string | undefined) {
  if (!value) return "Today"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "Today" : date.toLocaleDateString()
}

function showTenantError(title: string, error: unknown) {
  toast.error(title, {
    description: error instanceof Error ? error.message : "Please try again."
  })
}
