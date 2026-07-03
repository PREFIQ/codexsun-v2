import type { Dispatch, ReactNode, SetStateAction } from "react"
import { ArrowLeft, CheckCircle2, Plus, RefreshCw, Save, Trash2, X } from "lucide-react"
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@codexsun/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@codexsun/ui/components/dialog"
import { Input } from "@codexsun/ui/components/input"
import { Textarea } from "@codexsun/ui/components/textarea"
import { WorkspaceAnimatedTabs } from "@codexsun/ui/workspace/animated-tabs"
import { WorkspacePage } from "@codexsun/ui/workspace"
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters"
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination"
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions"
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status"
import { WorkspaceShowLayout, WorkspaceShowCard, WorkspaceDetailTable } from "@codexsun/ui/workspace/show"
import {
  WorkspaceFormBanner,
  WorkspaceFormField,
  WorkspaceFormFooter,
  WorkspaceFormGrid,
  WorkspaceFormPanel,
  WorkspaceUpsertPage,
} from "@codexsun/ui/workspace/upsert"
import { buildShowingLabel } from "@codexsun/ui/workspace/utils"
import { cn } from "@codexsun/ui/lib/utils"
import { apiDelete, apiGet, apiPost, apiPut } from "../../api"
import { CommonRecordAutocomplete } from "../../components/CommonRecordAutocomplete"

export type TenantFormField = {
  autocompleteDefinitionKey?: string
  emptyLabel?: string
  key: string
  label: string
  placeholder?: string
  required?: boolean
  type?: "text" | "textarea"
}

type TenantTab = {
  fields: string[]
  label: string
  value: string
}

type FormState = Record<string, string> & { isActive: string }

type TenantRecordWorkspaceProps<TRecord extends Record<string, any>> = {
  archiveEndpoint?: ((record: TRecord) => string) | undefined
  createPayload: (form: FormState) => Record<string, unknown>
  description: string
  endpoint: string
  fields: TenantFormField[]
  forceDeleteEndpoint?: ((record: TRecord) => string) | undefined
  getId: (record: TRecord) => string
  getRowMeta?: ((record: TRecord) => string[]) | undefined
  getStatus?: ((record: TRecord) => "active" | "archived") | undefined
  listEndpoint?: string | undefined
  newLabel: string
  onBack?: (() => void) | undefined
  queryKey: unknown[]
  restoreEndpoint?: ((record: TRecord) => string) | undefined
  searchFields: string[]
  tabs?: TenantTab[]
  title: string
  toForm: (record: TRecord | null) => FormState
  updatePayload: (form: FormState, record: TRecord) => Record<string, unknown>
  upsertDescription?: string
  upsertSurface?: "page" | "dialog"
}

type ViewState<TRecord> =
  | { mode: "list" }
  | { mode: "show"; record: TRecord }
  | { mode: "upsert"; record: TRecord | null }

export function TenantRecordWorkspace<TRecord extends Record<string, any>>({
  archiveEndpoint,
  createPayload,
  description,
  endpoint,
  fields,
  forceDeleteEndpoint,
  getId,
  getStatus = (record) => record.status ?? (record.isActive === false ? "archived" : "active"),
  listEndpoint,
  newLabel,
  onBack,
  queryKey,
  restoreEndpoint,
  searchFields,
  tabs,
  title,
  toForm,
  updatePayload,
  upsertDescription,
  upsertSurface = "page",
}: TenantRecordWorkspaceProps<TRecord>) {
  const queryClient = useQueryClient()
  const [view, setView] = useState<ViewState<TRecord>>({ mode: "list" })
  const [forceDeleteRecord, setForceDeleteRecord] = useState<TRecord | null>(null)
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(100)

  const recordsQuery = useQuery<TRecord[]>({
    queryKey,
    queryFn: () => apiGet<TRecord[]>(listEndpoint ?? endpoint, "tenant"),
  })
  const lookupDefinitionKeys = useMemo(
    () => Array.from(new Set(fields.map((field) => field.autocompleteDefinitionKey).filter((key): key is string => Boolean(key)))),
    [fields],
  )
  const lookupLabelsQuery = useQuery({
    enabled: lookupDefinitionKeys.length > 0,
    queryKey: ["tenant", "workspace-lookup-labels", lookupDefinitionKeys],
    queryFn: async () => {
      const entries = await Promise.all(
        lookupDefinitionKeys.map(async (definitionKey) => {
          const records = await apiGet<Array<{ id: string | number; code?: string; description?: string; name?: string; ratePercent?: number }>>(
            `/core/common/records?definitionKey=${definitionKey}`,
            "tenant",
          )
          return [definitionKey, new Map(records.map((record) => [String(record.id), commonLookupLabel(record)]))] as const
        }),
      )
      return Object.fromEntries(entries) as Record<string, Map<string, string>>
    },
  })

  const closeUpsert = () => setView({ mode: "list" })

  const createMutation = useMutation({
    mutationFn: async (form: FormState) => {
      const record = await apiPost<TRecord>(endpoint, createPayload(form), "tenant")
      if (form.isActive === "false" && archiveEndpoint) {
        await apiPost(archiveEndpoint(record), {}, "tenant")
      }
      return { form, record }
    },
    onSuccess: async ({ form, record }) => {
      await queryClient.invalidateQueries({ queryKey })
      toast.success(`${title} saved`)
      setView(upsertSurface === "dialog" || form.isActive === "false" ? { mode: "list" } : { mode: "show", record })
    },
    onError: (error) => toast.error(`Failed to save ${title.toLowerCase()}`, { description: String(error) }),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ form, record }: { form: FormState; record: TRecord }) => {
      const updated = await apiPut<TRecord>(`${endpoint}/${getId(record)}`, updatePayload(form, record), "tenant")
      const currentActive = getStatus(record) === "active"
      const nextActive = form.isActive !== "false"
      if (currentActive && !nextActive && archiveEndpoint) {
        await apiPost(archiveEndpoint(updated), {}, "tenant")
      } else if (!currentActive && nextActive && restoreEndpoint) {
        await apiPost(restoreEndpoint(updated), {}, "tenant")
      }
      return { form, record: updated }
    },
    onSuccess: async ({ form, record }) => {
      await queryClient.invalidateQueries({ queryKey })
      toast.success(`${title} updated`)
      setView(upsertSurface === "dialog" || form.isActive === "false" ? { mode: "list" } : { mode: "show", record })
    },
    onError: (error) => toast.error(`Failed to update ${title.toLowerCase()}`, { description: String(error) }),
  })

  const toggleStatusMutation = useMutation({
    mutationFn: (record: TRecord) => {
      const isActive = getStatus(record) === "active"
      const path = isActive ? archiveEndpoint?.(record) : restoreEndpoint?.(record)
      if (!path) return Promise.resolve({} as unknown)
      return apiPost(path, {}, "tenant")
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey })
      setView({ mode: "list" })
    },
    onError: (error) => toast.error("Failed to update status", { description: String(error) }),
  })

  const forceDeleteMutation = useMutation({
    mutationFn: (record: TRecord) => {
      const path = forceDeleteEndpoint?.(record)
      if (!path) return Promise.resolve({} as unknown)
      return apiDelete(path, "tenant")
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey })
      setForceDeleteRecord(null)
      toast.success(`${title} removed`)
    },
    onError: (error) => toast.error("Failed to force delete", { description: String(error) }),
  })

  const records = recordsQuery.data ?? []
  const filtered = useMemo(() => {
    const term = searchValue.trim().toLowerCase()
    return records.filter((record) => {
      if (statusFilter !== "all" && getStatus(record) !== statusFilter) return false
      if (!term) return true
      return searchFields.some((field) => String(record[field] ?? "").toLowerCase().includes(term))
    })
  }, [getStatus, records, searchFields, searchValue, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const pageItems = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
  const displayKey = fields.find((field) => field.key === "name")?.key
    ?? fields.find((field) => field.key === "description")?.key
    ?? fields[0]?.key
    ?? "name"
  const tableFields = fields.filter((field) => field.key !== displayKey && field.key !== "isActive")
  const useDialog = upsertSurface === "dialog"

  if (view.mode === "show" && !useDialog) {
    const status = getStatus(view.record)
    const rows: Array<[string, ReactNode]> = fields
      .map((field) => [field.label, formatFieldValue(field, view.record[field.key], lookupLabelsQuery.data)] as [string, ReactNode])
      .filter(([, value]) => String(value).trim())

    return (
      <WorkspacePage
        title={String(view.record.name ?? view.record.description ?? view.record.code ?? title)}
        description={String(view.record.code ?? "")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="h-9 rounded-md" onClick={() => setView({ mode: "list" })}>
              <ArrowLeft className="size-4" />Back
            </Button>
            <Button type="button" className="h-9 rounded-md" onClick={() => setView({ mode: "upsert", record: view.record })}>
              Edit
            </Button>
          </div>
        }
      >
        <WorkspaceShowLayout>
          <WorkspaceShowCard title={title}>
            <WorkspaceDetailTable
              rows={[
                ...rows,
                ["Status", <WorkspaceStatusBadge key="status" label={status} tone={status === "active" ? "success" : "danger"} />],
              ]}
            />
          </WorkspaceShowCard>
        </WorkspaceShowLayout>
      </WorkspacePage>
    )
  }

  if (view.mode === "upsert" && !useDialog) {
    return (
      <TenantRecordForm
        createLoading={createMutation.isPending || updateMutation.isPending}
        fields={fields}
        initialForm={toForm(view.record)}
        isEdit={Boolean(view.record)}
        title={title}
        {...(tabs ? { tabs } : {})}
        {...(upsertDescription ? { upsertDescription } : {})}
        onBack={() => setView(view.record ? { mode: "show", record: view.record } : { mode: "list" })}
        onSave={(form) => saveForm(form, view.record, fields, createMutation.mutate, updateMutation.mutate)}
      />
    )
  }

  const dialogRecord = view.mode === "upsert" ? view.record : null
  const displayName = (record: TRecord) => String(record[displayKey] ?? record.name ?? record.description ?? record.code ?? title)

  return (
    <WorkspacePage
      title={title}
      description={description}
      actions={
        <div className="flex items-center gap-2">
          {onBack ? (
            <Button type="button" variant="outline" className="h-9 rounded-md" onClick={onBack}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-md"
            disabled={recordsQuery.isFetching}
            onClick={() => recordsQuery.refetch()}
          >
            <RefreshCw className={recordsQuery.isFetching ? "size-4 animate-spin" : "size-4"} />
            Refresh
          </Button>
          <Button type="button" className="h-9 rounded-md" onClick={() => setView({ mode: "upsert", record: null })}>
            <Plus className="size-4" />
            {newLabel}
          </Button>
        </div>
      }
    >
      <WorkspaceFilters
        filterOptions={[
          { id: "all", label: "All" },
          { id: "active", label: "Active" },
          { id: "archived", label: "Archived" },
        ]}
        filterValue={statusFilter}
        onFilterValueChange={(value: string) => { setStatusFilter(value); setCurrentPage(1) }}
        onSearchValueChange={(value: string) => { setSearchValue(value); setCurrentPage(1) }}
        searchValue={searchValue}
      />
      <div className="overflow-hidden rounded-md border border-border/70 bg-card/95 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="w-16 border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase text-muted-foreground">#</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase text-muted-foreground">Name</th>
                {tableFields.map((field) => (
                  <th key={field.key} className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase text-muted-foreground">
                    {field.label}
                  </th>
                ))}
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase text-muted-foreground">Status</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase text-muted-foreground">Updated</th>
                <th className="w-20 border-b border-border/70 px-4 py-3.5 text-right text-xs font-semibold uppercase text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((record, index) => {
                const status = getStatus(record)
                const serial = (currentPage - 1) * rowsPerPage + index + 1
                return (
                  <tr key={getId(record)} className="border-b border-border/70 last:border-b-0">
                    <td className="px-4 py-2 text-muted-foreground">{serial}</td>
                    <td className="px-4 py-2">
                      <button
                        className="text-left font-medium hover:underline"
                        type="button"
                        onClick={() => setView(useDialog ? { mode: "upsert", record } : { mode: "show", record })}
                      >
                        {displayName(record)}
                      </button>
                    </td>
                    {tableFields.map((field) => (
                      <td key={field.key} className="px-4 py-2 text-muted-foreground">
                        {formatFieldValue(field, record[field.key], lookupLabelsQuery.data)}
                      </td>
                    ))}
                    <td className="px-4 py-2">
                      <WorkspaceStatusBadge label={status} tone={status === "active" ? "success" : "danger"} />
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{formatDate(record.updatedAt ?? record.createdAt)}</td>
                    <td className="px-4 py-1.5 text-right">
                      <WorkspaceRowActions
                        title={displayName(record)}
                        deleteLabel="Suspend"
                        isSuspended={status !== "active"}
                        onEdit={() => setView({ mode: "upsert", record })}
                        {...(archiveEndpoint && status === "active" ? { onDelete: () => toggleStatusMutation.mutate(record) } : {})}
                        {...(restoreEndpoint && status !== "active" ? { onRestore: () => toggleStatusMutation.mutate(record) } : {})}
                        {...(!useDialog ? { onView: () => setView({ mode: "show", record }) } : {})}
                        {...(forceDeleteEndpoint ? { actions: [{
                          id: "force-delete",
                          label: "Force delete",
                          tone: "destructive",
                          icon: <Trash2 className="size-4" />,
                          onSelect: () => setForceDeleteRecord(record),
                        }] } : {})}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {pageItems.length === 0 ? (
          <div className="px-6 py-14 text-center text-sm text-muted-foreground">
            {recordsQuery.isLoading ? "Loading records..." : "No records found."}
          </div>
        ) : null}
      </div>
      <WorkspacePagination
        page={currentPage}
        rowsPerPage={rowsPerPage}
        showingLabel={buildShowingLabel(currentPage, rowsPerPage, filtered.length)}
        singularLabel="records"
        totalCount={filtered.length}
        totalPages={totalPages}
        onNextPage={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        onPageChange={setCurrentPage}
        onPreviousPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
        onRowsPerPageChange={(v: number) => { setRowsPerPage(v); setCurrentPage(1) }}
      />
      {useDialog ? (
        <TenantRecordDialog
          key={view.mode === "upsert" ? (view.record ? getId(view.record) : "new") : "closed"}
          fields={fields}
          initialForm={toForm(dialogRecord)}
          isEdit={Boolean(dialogRecord)}
          loading={createMutation.isPending || updateMutation.isPending}
          open={view.mode === "upsert"}
          title={title}
          onOpenChange={(open) => { if (!open) closeUpsert() }}
          onSave={(form) => saveForm(form, dialogRecord, fields, createMutation.mutate, updateMutation.mutate)}
        />
      ) : null}
      <ForceDeleteDialog
        loading={forceDeleteMutation.isPending}
        name={forceDeleteRecord ? displayName(forceDeleteRecord) : ""}
        open={Boolean(forceDeleteRecord)}
        title={title}
        onCancel={() => setForceDeleteRecord(null)}
        onConfirm={() => { if (forceDeleteRecord) forceDeleteMutation.mutate(forceDeleteRecord) }}
      />
    </WorkspacePage>
  )
}

function saveForm<TRecord extends Record<string, any>>(
  form: FormState,
  record: TRecord | null,
  fields: TenantFormField[],
  createRecord: (form: FormState) => void,
  updateRecord: (input: { form: FormState; record: TRecord }) => void,
) {
  if (hasValidationErrors(fields, form)) return
  if (record) updateRecord({ form, record })
  else createRecord(form)
}

function validateForm(fields: TenantFormField[], form: FormState) {
  const errors: Record<string, string> = {}
  for (const field of fields) {
    if (field.required && !String(form[field.key] ?? "").trim()) {
      errors[field.key] = `${field.label} is required`
    }
  }
  return errors
}

function hasValidationErrors(fields: TenantFormField[], form: FormState) {
  return Object.keys(validateForm(fields, form)).length > 0
}

function formatCellValue(value: unknown) {
  if (value === undefined || value === null || value === "") return "-"
  if (typeof value === "boolean") return value ? "Yes" : "No"
  return String(value)
}

function formatFieldValue(
  field: TenantFormField,
  value: unknown,
  lookupLabels: Record<string, Map<string, string>> | undefined,
) {
  const rawValue = formatCellValue(value)
  if (!field.autocompleteDefinitionKey || rawValue === "-") return rawValue
  return lookupLabels?.[field.autocompleteDefinitionKey]?.get(String(value)) ?? rawValue
}

function commonLookupLabel(record: { code?: string; description?: string; id: string | number; name?: string; ratePercent?: number }) {
  if (record.ratePercent !== undefined && record.ratePercent !== null) return `${record.ratePercent}%`
  if (record.code && record.description) return `${record.code} - ${record.description}`
  if (record.code && record.name) return `${record.code} - ${record.name}`
  return String(record.name ?? record.description ?? record.code ?? record.id)
}

function formatDate(value: unknown) {
  if (!value) return "-"
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })
}

function TenantRecordDialog({
  fields,
  initialForm,
  isEdit,
  loading,
  onOpenChange,
  onSave,
  open,
  title,
}: {
  fields: TenantFormField[]
  initialForm: FormState
  isEdit: boolean
  loading: boolean
  onOpenChange: (open: boolean) => void
  onSave: (form: FormState) => void
  open: boolean
  title: string
}) {
  const [form, setForm] = useState<FormState>(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const hasErrors = Object.keys(errors).length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-border/70 px-5 py-4">
          <DialogTitle>{isEdit ? `Edit ${title}` : `New ${title}`}</DialogTitle>
          <DialogDescription className="sr-only">Add or update common module values.</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            const nextErrors = validateForm(fields, form)
            setErrors(nextErrors)
            if (Object.keys(nextErrors).length > 0) return
            onSave(form)
          }}
        >
          <div className="max-h-[64vh] space-y-4 overflow-y-auto px-5 py-5">
            {hasErrors ? (
              <WorkspaceFormBanner title="Required fields" tone="error">
                Fill the required fields before saving.
              </WorkspaceFormBanner>
            ) : null}
            {fields.map((field) => (
              <DialogFormField key={field.key} errors={errors} field={field} form={form} setErrors={setErrors} setForm={setForm} />
            ))}
            <TenantStatusCard
              checked={form.isActive !== "false"}
              onChange={(checked) => setForm((current) => ({ ...current, isActive: checked ? "true" : "false" }))}
            />
          </div>
          <DialogFooter className="border-t border-border/70 px-5 py-4 sm:justify-start">
            <Button type="submit" className="h-9 rounded-md" disabled={loading}>
              <Save className="size-4" />
              {loading ? "Saving..." : "Save"}
            </Button>
            <Button type="button" variant="outline" className="h-9 rounded-md" onClick={() => onOpenChange(false)}>
              <X className="size-4" />
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DialogFormField({
  field,
  form,
  errors,
  setErrors,
  setForm,
}: {
  errors: Record<string, string>
  field: TenantFormField
  form: FormState
  setErrors: Dispatch<SetStateAction<Record<string, string>>>
  setForm: Dispatch<SetStateAction<FormState>>
}) {
  const value = String(form[field.key] ?? "")
  const error = errors[field.key]
  const updateValue = (nextValue: string) => {
    setForm((current) => ({ ...current, [field.key]: nextValue }))
    if (error) {
      setErrors((current) => {
        const next = { ...current }
        delete next[field.key]
        return next
      })
    }
  }
  return (
    <label className="block space-y-2 text-sm font-medium text-foreground">
      <span>{field.label}{field.required ? <span className="text-destructive"> *</span> : null}</span>
      {field.type === "textarea" ? (
        <Textarea
          aria-invalid={Boolean(error)}
          className={error ? "min-h-[96px] rounded-md border-destructive" : "min-h-[96px] rounded-md"}
          value={value}
          onChange={(event) => updateValue(event.target.value)}
        />
      ) : field.autocompleteDefinitionKey ? (
        <CommonRecordAutocomplete
          definitionKey={field.autocompleteDefinitionKey}
          invalid={Boolean(error)}
          value={value}
          onChange={(nextValue) => updateValue(nextValue ?? "")}
          {...(field.emptyLabel ? { emptyLabel: field.emptyLabel } : {})}
        />
      ) : (
        <Input
          aria-invalid={Boolean(error)}
          className={error ? "h-11 rounded-md border-destructive" : "h-11 rounded-md"}
          value={value}
          onChange={(event) => updateValue(event.target.value)}
        />
      )}
      {error ? <span className="text-xs font-medium text-destructive">{error}</span> : null}
    </label>
  )
}

function TenantStatusCard({
  checked,
  help,
  onChange,
}: {
  checked: boolean
  help?: string | undefined
  onChange: (checked: boolean) => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "flex h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-md border px-3 text-left transition-colors",
        checked
          ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-100/70"
          : "border-border bg-muted/55 hover:bg-muted/75",
      )}
      onClick={() => onChange(!checked)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onChange(!checked)
        }
      }}
    >
      <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
        <CheckCircle2 className={cn("size-4 shrink-0", checked ? "text-emerald-600" : "text-muted-foreground")} />
        <span className="min-w-0">
          <span className="block leading-none">Active</span>
          {help ? <span className="mt-1 block text-xs font-normal leading-none text-muted-foreground">{help}</span> : null}
        </span>
      </span>
      <VisualSwitch checked={checked} />
    </div>
  )
}

function VisualSwitch({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-emerald-600" : "bg-muted-foreground/35",
      )}
    >
      <span
        className={cn(
          "block size-4 rounded-full bg-background shadow-sm transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </span>
  )
}

function ForceDeleteDialog({
  loading,
  name,
  onCancel,
  onConfirm,
  open,
  title,
}: {
  loading: boolean
  name: string
  onCancel: () => void
  onConfirm: () => void
  open: boolean
  title: string
}) {
  const [confirmText, setConfirmText] = useState("")
  const canDelete = confirmText.trim() === name

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) { setConfirmText(""); onCancel() } }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Force delete {title}</DialogTitle>
          <DialogDescription>
            Remove this record only when it is not mapped to any master, entry, or transaction data.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Type <span className="font-semibold text-foreground">{name}</span> to confirm.</p>
          <Input className="h-10 rounded-md" value={confirmText} onChange={(event) => setConfirmText(event.target.value)} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" className="h-9 rounded-md" onClick={onCancel}>Cancel</Button>
          <Button type="button" variant="destructive" className="h-9 rounded-md" disabled={!canDelete || loading} onClick={onConfirm}>
            <Trash2 className="size-4" />
            {loading ? "Deleting..." : "Force delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TenantRecordForm({
  createLoading,
  fields,
  initialForm,
  isEdit,
  onBack,
  onSave,
  tabs,
  title,
  upsertDescription,
}: {
  createLoading?: boolean
  fields: TenantFormField[]
  initialForm: FormState
  isEdit: boolean
  onBack: () => void
  onSave: (form: FormState) => void
  tabs?: TenantTab[]
  title: string
  upsertDescription?: string
}) {
  const [activeTab, setActiveTab] = useState(tabs?.[0]?.value ?? "details")
  const [form, setForm] = useState<FormState>(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const hasErrors = Object.keys(errors).length > 0
  const tabList = tabs?.length ? tabs : [{ value: "details", label: "Details", fields: fields.map((field) => field.key) }]

  function renderField(field: TenantFormField) {
    const value = String(form[field.key] ?? "")
    const error = errors[field.key]
    const updateValue = (nextValue: string) => {
      setForm((current) => ({ ...current, [field.key]: nextValue }))
      if (error) {
        setErrors((current) => {
          const next = { ...current }
          delete next[field.key]
          return next
        })
      }
    }
    const input = field.type === "textarea" ? (
      <Textarea
        aria-invalid={Boolean(error)}
        className={error ? "min-h-[88px] rounded-md border-destructive" : "min-h-[88px] rounded-md"}
        value={value}
        onChange={(event) => updateValue((event.target as HTMLTextAreaElement).value)}
      />
    ) : field.autocompleteDefinitionKey ? (
        <CommonRecordAutocomplete
          definitionKey={field.autocompleteDefinitionKey}
          invalid={Boolean(error)}
          value={value}
          onChange={(nextValue) => updateValue(nextValue ?? "")}
        {...(field.emptyLabel ? { emptyLabel: field.emptyLabel } : {})}
      />
    ) : (
      <Input
        aria-invalid={Boolean(error)}
        className={error ? "h-11 rounded-md border-destructive" : "h-11 rounded-md"}
        value={value}
        onChange={(event) => updateValue((event.target as HTMLInputElement).value)}
      />
    )

    return (
      <WorkspaceFormField
        key={field.key}
        label={field.label}
        {...(field.required ? { required: true } : {})}
        {...(field.type === "textarea" ? { className: "md:col-span-2" } : {})}
      >
        <div className="space-y-1.5">
          {input}
          {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
        </div>
      </WorkspaceFormField>
    )
  }

  return (
    <WorkspaceUpsertPage
      title={isEdit ? `Edit ${title}` : `New ${title}`}
      description={upsertDescription ?? "Use the same compact two-column entry pattern across tenant master and common data."}
      onBack={onBack}
    >
      <form
        className="space-y-4"
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          const nextErrors = validateForm(fields, form)
          setErrors(nextErrors)
          if (Object.keys(nextErrors).length > 0) return
          onSave(form)
        }}
      >
        {hasErrors ? (
          <WorkspaceFormBanner title="Required fields" tone="error">
            Fill the required fields before saving.
          </WorkspaceFormBanner>
        ) : null}
        <WorkspaceFormPanel>
          <WorkspaceAnimatedTabs
            value={activeTab}
            onValueChange={setActiveTab}
            tabs={tabList.map((tab) => ({
              value: tab.value,
              label: tab.label,
              content: (
                <WorkspaceFormGrid columns={2}>
                  {tab.fields
                    .map((key) => fields.find((field) => field.key === key))
                    .filter((field): field is TenantFormField => Boolean(field))
                    .map(renderField)}
                  {tab.value === "details" ? (
                    <div className="md:col-span-2">
                      <TenantStatusCard
                        checked={form.isActive !== "false"}
                        help="Keep this record available for tenant lookup and transaction entry."
                        onChange={(checked) => setForm((current) => ({ ...current, isActive: checked ? "true" : "false" }))}
                      />
                    </div>
                  ) : null}
                </WorkspaceFormGrid>
              ),
            }))}
          />
        </WorkspaceFormPanel>
        <WorkspaceFormPanel>
          <WorkspaceFormFooter
            primaryLabel={createLoading ? "Saving..." : "Save"}
            primaryLoading={Boolean(createLoading)}
            onCancel={onBack}
          />
        </WorkspaceFormPanel>
      </form>
    </WorkspaceUpsertPage>
  )
}
