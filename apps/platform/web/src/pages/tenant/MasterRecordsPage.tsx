import { ArrowLeft, Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { Button } from "@codexsun/ui/components/button"
import { Input } from "@codexsun/ui/components/input"
import { Label } from "@codexsun/ui/components/label"
import { WorkspacePage } from "@codexsun/ui/workspace"
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters"
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination"
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions"
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status"
import { WorkspaceShowLayout, WorkspaceShowCard, WorkspaceDetailTable } from "@codexsun/ui/workspace/show"
import { WorkspaceUpsertPage, WorkspaceFormPanel, WorkspaceFormGrid } from "@codexsun/ui/workspace/upsert"
import { buildShowingLabel } from "@codexsun/ui/workspace/utils"

const sampleRecords: Record<string, Array<{ id: string; code: string; name: string; status: string }>> = {
  contact_type: [
    { id: "ct_1", code: "customer", name: "Customer", status: "active" },
    { id: "ct_2", code: "supplier", name: "Supplier", status: "active" },
    { id: "ct_3", code: "transporter", name: "Transporter", status: "active" },
    { id: "ct_4", code: "employee", name: "Employee", status: "active" },
    { id: "ct_5", code: "other", name: "Other", status: "active" },
  ],
  address_type: [
    { id: "at_1", code: "billing", name: "Billing", status: "active" },
    { id: "at_2", code: "shipping", name: "Shipping", status: "active" },
  ],
  unit: [
    { id: "un_1", code: "pcs", name: "Pieces", status: "active" },
    { id: "un_2", code: "kg", name: "Kilogram", status: "active" },
  ],
}

const definitionLabels: Record<string, string> = {
  contact_type: "Contact Types",
  address_type: "Address Types",
  country: "Countries",
  unit: "Units",
}

type RecordView = { mode: "list" } | { mode: "show"; record: { id: string; code: string; name: string; status: string } } | { mode: "upsert"; record: { id: string; code: string; name: string; status: string } | null }

type Props = { definitionKey: string; onBack?: () => void }

export function MasterRecordsPage({ definitionKey }: Props) {
  const [view, setView] = useState<RecordView>({ mode: "list" })
  const [searchValue, setSearchValue] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(100)

  const records = sampleRecords[definitionKey] ?? []

  const filtered = useMemo(() => {
    if (!searchValue.trim()) return records
    const term = searchValue.toLowerCase()
    return records.filter((r) => [r.code, r.name].some((v) => v.toLowerCase().includes(term)))
  }, [searchValue, records])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const pageItems = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  const label = definitionLabels[definitionKey] ?? definitionKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())

  if (view.mode === "show") {
    return (
      <WorkspacePage
        title={view.record.name}
        description={`Code: ${view.record.code}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="h-9 rounded-md" onClick={() => setView({ mode: "list" })}>
              <ArrowLeft className="size-4" />Back
            </Button>
          </div>
        }
      >
        <WorkspaceShowLayout>
          <WorkspaceShowCard title="Record">
            <WorkspaceDetailTable
              rows={[
                ["Code", view.record.code],
                ["Name", view.record.name],
                ["Status", <WorkspaceStatusBadge key="s" label={view.record.status} tone={view.record.status === "active" ? "success" : "danger"} />],
              ]}
            />
          </WorkspaceShowCard>
        </WorkspaceShowLayout>
      </WorkspacePage>
    )
  }

  if (view.mode === "upsert") {
    const isEdit = view.record !== null
    const [form, setForm] = useState({
      code: view.record?.code ?? "",
      name: view.record?.name ?? "",
      status: view.record?.status ?? "active",
    })

    return (
      <WorkspaceUpsertPage
        title={isEdit ? `Edit ${label}` : `New ${label}`}
        description={`${isEdit ? "Update" : "Create"} a ${label.toLowerCase()} record.`}
        onBack={() => setView(view.record ? { mode: "show", record: view.record } : { mode: "list" })}
      >
        <WorkspaceFormPanel title="Record details">
          <WorkspaceFormGrid columns={2}>
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-muted-foreground">Code</Label>
              <Input className="h-11 rounded-md" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: (e.target as HTMLInputElement).value }))} />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-muted-foreground">Name</Label>
              <Input className="h-11 rounded-md" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: (e.target as HTMLInputElement).value }))} />
            </div>
          </WorkspaceFormGrid>
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border/70 pt-5">
            <Button type="button" className="rounded-md" onClick={() => setView({ mode: "show", record: { id: view.record?.id ?? `rec_${Date.now()}`, ...form } })}>
              Save
            </Button>
            <Button type="button" variant="outline" className="rounded-md" onClick={() => setView(view.record ? { mode: "show", record: view.record } : { mode: "list" })}>
              Cancel
            </Button>
          </div>
        </WorkspaceFormPanel>
      </WorkspaceUpsertPage>
    )
  }

  return (
    <WorkspacePage
      title={label}
      description={`Master records for ${label.toLowerCase()}.`}
      actions={
        <div className="flex items-center gap-2">
          <Button type="button" className="h-9 rounded-md" onClick={() => setView({ mode: "upsert", record: null })}>
            <Plus className="size-4" />
            New
          </Button>
        </div>
      }
    >
      <WorkspaceFilters
        filterOptions={[]}
        filterValue="all"
        onFilterValueChange={() => setCurrentPage(1)}
        onSearchValueChange={(value: string) => { setSearchValue(value); setCurrentPage(1) }}
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
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{item.code}</td>
                  <td className="px-4 py-2">
                    <button className="font-medium hover:underline" type="button" onClick={() => setView({ mode: "show", record: item })}>
                      {item.name}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <WorkspaceStatusBadge label={item.status} tone={item.status === "active" ? "success" : "danger"} />
                  </td>
                  <td className="px-4 py-1.5 text-right">
                    <WorkspaceRowActions
                      title={item.name}
                      onView={() => setView({ mode: "show", record: item })}
                      onEdit={() => setView({ mode: "upsert", record: item })}
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
  )
}
