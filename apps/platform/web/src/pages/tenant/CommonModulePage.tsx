import { ArrowLeft, Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@codexsun/ui/components/button"
import { Input } from "@codexsun/ui/components/input"
import { Switch } from "@codexsun/ui/components/switch"
import { WorkspacePage } from "@codexsun/ui/workspace"
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters"
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination"
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions"
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status"
import { WorkspaceShowLayout, WorkspaceShowCard, WorkspaceDetailTable } from "@codexsun/ui/workspace/show"
import { WorkspaceFormPanel, WorkspaceFormGrid, WorkspaceUpsertDialog } from "@codexsun/ui/workspace/upsert"
import { buildShowingLabel } from "@codexsun/ui/workspace/utils"
import { apiGet, apiPost, apiPut } from "../../api"

type CommonRecord = {
  id: string
  uuid?: string
  tenantId?: string
  isActive: boolean
  name: string
  code?: string
  createdAt?: string
  updatedAt?: string
}

type Props = {
  definitionKey: string
  definitionLabel: string
  onBack: () => void
}

export function CommonModulePage({ definitionKey, definitionLabel, onBack }: Props) {
  const queryClient = useQueryClient()
  const [showRecord, setShowRecord] = useState<CommonRecord | null>(null)
  const [upsertRecord, setUpsertRecord] = useState<CommonRecord | null>(null)
  const [upsertOpen, setUpsertOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(100)

  const recordsQuery = useQuery<CommonRecord[]>({
    queryKey: ["core", "common-modules", definitionKey],
    queryFn: () => apiGet<CommonRecord[]>(`/core/common/records?definitionKey=${definitionKey}`, "tenant"),
  })

  const createMutation = useMutation({
    mutationFn: (data: { code?: string; name: string }) =>
      apiPost<CommonRecord>("/core/common/records", { definitionKey, ...data }, "tenant"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["core", "common-modules", definitionKey] })
      toast.success("Record created")
      setUpsertOpen(false)
      setUpsertRecord(null)
    },
    onError: (err) => toast.error("Failed to create record", { description: String(err) }),
  })

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; code?: string; name?: string }) =>
      apiPut<CommonRecord>(`/core/common/records/${data.id}`, { definitionKey, ...data }, "tenant"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["core", "common-modules", definitionKey] })
      toast.success("Record updated")
      setUpsertOpen(false)
      setUpsertRecord(null)
    },
    onError: (err) => toast.error("Failed to update record", { description: String(err) }),
  })

  const archiveMutation = useMutation({
    mutationFn: (id: string) =>
      apiPost<{ archived: boolean }>(`/core/common/records/${id}/archive?definitionKey=${definitionKey}`, {}, "tenant"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["core", "common-modules", definitionKey] })
      toast.info("Record suspended")
    },
    onError: (err) => toast.error("Failed to suspend record", { description: String(err) }),
  })

  const restoreMutation = useMutation({
    mutationFn: (id: string) =>
      apiPost<{ restored: boolean }>(`/core/common/records/${id}/restore?definitionKey=${definitionKey}`, {}, "tenant"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["core", "common-modules", definitionKey] })
      toast.success("Record restored")
    },
    onError: (err) => toast.error("Failed to restore record", { description: String(err) }),
  })

  const records = recordsQuery.data ?? []

  const filtered = useMemo(() => {
    let items = [...records]
    if (searchValue.trim()) {
      const term = searchValue.toLowerCase()
      items = items.filter((r) => [r.code ?? "", r.name].some((v) => v.toLowerCase().includes(term)))
    }
    if (statusFilter === "active") items = items.filter((r) => r.isActive)
    else if (statusFilter === "suspended") items = items.filter((r) => !r.isActive)
    return items
  }, [searchValue, statusFilter, records])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const pageItems = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  function openUpsert(record: CommonRecord | null) {
    setUpsertRecord(record)
    setUpsertOpen(true)
  }

  function handleSave(form: { code: string; name: string; status: string }) {
    if (upsertRecord) {
      updateMutation.mutate({ id: upsertRecord.id, code: form.code || undefined, name: form.name } as any)
    } else {
      createMutation.mutate({ code: form.code || undefined, name: form.name } as any)
    }
  }

  function toggleStatus(record: CommonRecord) {
    if (record.isActive) {
      archiveMutation.mutate(record.id)
    } else {
      restoreMutation.mutate(record.id)
    }
  }

  if (showRecord) {
    return (
      <WorkspacePage
        title={showRecord.name}
        description={`Code: ${showRecord.code ?? "—"}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="h-9 rounded-md" onClick={() => setShowRecord(null)}>
              <ArrowLeft className="size-4" />Back
            </Button>
          </div>
        }
      >
        <WorkspaceShowLayout>
          <WorkspaceShowCard title="Record">
            <WorkspaceDetailTable
              rows={[
                ...(showRecord.code ? [["Code" as const, showRecord.code]] : []),
                ["Name" as const, showRecord.name],
                ["Status" as const, <WorkspaceStatusBadge key="s" label={showRecord.isActive ? "active" : "suspended"} tone={showRecord.isActive ? "success" : "danger"} />],
              ] as [string, React.ReactNode][]}
            />
          </WorkspaceShowCard>
        </WorkspaceShowLayout>
      </WorkspacePage>
    )
  }

  return (
    <>
      <WorkspacePage
        title={definitionLabel}
        description={`Manage ${definitionLabel.toLowerCase()} records.`}
        actions={
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" className="h-9 rounded-md" onClick={onBack}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <Button type="button" className="h-9 rounded-md" onClick={() => openUpsert(null)}>
              <Plus className="size-4" />
              New
            </Button>
          </div>
        }
      >
        <WorkspaceFilters
          filterOptions={[
            { id: "all", label: "All" },
            { id: "active", label: "Active" },
            { id: "suspended", label: "Suspended" },
          ]}
          filterValue={statusFilter}
          onFilterValueChange={(value: string) => { setStatusFilter(value); setCurrentPage(1) }}
          onSearchValueChange={(value: string) => { setSearchValue(value); setCurrentPage(1) }}
          searchPlaceholder="Search records..."
          searchValue={searchValue}
        />
        <div className="overflow-hidden rounded-md border border-border/70 bg-card/95 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Code</th>
                  <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</th>
                  <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                  <th className="border-b border-border/70 px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item) => (
                  <tr key={item.id} className="border-b border-border/70 last:border-b-0">
                    <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{item.code ?? "—"}</td>
                    <td className="px-4 py-2">
                      <button className="font-medium hover:underline" type="button" onClick={() => setShowRecord(item)}>
                        {item.name}
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      <WorkspaceStatusBadge label={item.isActive ? "active" : "suspended"} tone={item.isActive ? "success" : "danger"} />
                    </td>
                    <td className="px-4 py-1.5 text-right">
                      <WorkspaceRowActions
                        title={item.name}
                        isSuspended={!item.isActive}
                        onView={() => setShowRecord(item)}
                        onEdit={() => openUpsert(item)}
                        onRestore={() => toggleStatus(item)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pageItems.length === 0 ? (
            <div className="px-6 py-14 text-center text-sm text-muted-foreground">No records found.</div>
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
      </WorkspacePage>

      <UpsertDialog
        record={upsertRecord}
        open={upsertOpen}
        definitionLabel={definitionLabel}
        onSave={handleSave}
        onClose={() => { setUpsertOpen(false); setUpsertRecord(null) }}
      />
    </>
  )
}

function UpsertDialog({
  record,
  open,
  definitionLabel,
  onSave,
  onClose,
}: {
  record: CommonRecord | null
  open: boolean
  definitionLabel: string
  onSave: (form: { code: string; name: string; status: string }) => void
  onClose: () => void
}) {
  const [code, setCode] = useState(record?.code ?? "")
  const [name, setName] = useState(record?.name ?? "")
  const [status, setStatus] = useState(record?.isActive !== false ? "active" : "suspended")

  return (
    <WorkspaceUpsertDialog
      open={open}
      onClose={onClose}
      title={record ? `Edit ${definitionLabel}` : `New ${definitionLabel}`}
      description={`${record ? "Update" : "Create"} a ${definitionLabel.toLowerCase()} record.`}
    >
      <WorkspaceFormPanel>
        <WorkspaceFormGrid columns={2}>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-muted-foreground">Code</label>
            <Input className="h-11 rounded-md" value={code} onChange={(e) => setCode((e.target as HTMLInputElement).value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-muted-foreground">Name</label>
            <Input className="h-11 rounded-md" value={name} onChange={(e) => setName((e.target as HTMLInputElement).value)} />
          </div>
        </WorkspaceFormGrid>
        <div className="mt-4 flex items-center justify-between rounded-lg border border-border/70 px-4 py-3">
          <span className="text-sm font-medium text-muted-foreground">Active</span>
          <Switch checked={status === "active"} onCheckedChange={(checked: boolean) => setStatus(checked ? "active" : "suspended")} />
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border/70 pt-5">
          <Button type="button" className="rounded-md" onClick={() => onSave({ code, name, status })}>
            Save
          </Button>
          <Button type="button" variant="outline" className="rounded-md" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </WorkspaceFormPanel>
    </WorkspaceUpsertDialog>
  )
}
