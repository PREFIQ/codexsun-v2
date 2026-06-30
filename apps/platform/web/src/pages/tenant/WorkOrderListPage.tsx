import { ArrowLeft, Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { Button } from "@codexsun/ui/components/button"
import { Input } from "@codexsun/ui/components/input"
import { Textarea } from "@codexsun/ui/components/textarea"
import { Switch } from "@codexsun/ui/components/switch"
import { WorkspacePage } from "@codexsun/ui/workspace"
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters"
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination"
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions"
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status"
import { WorkspaceShowLayout, WorkspaceShowCard, WorkspaceDetailTable } from "@codexsun/ui/workspace/show"
import { WorkspaceUpsertPage, WorkspaceFormPanel, WorkspaceFormGrid } from "@codexsun/ui/workspace/upsert"
import { buildShowingLabel } from "@codexsun/ui/workspace/utils"
import { cn } from "@codexsun/ui/lib/utils"

type WorkOrderView =
  | { mode: "list" }
  | { mode: "show"; id: string; code: string; name: string; description: string; status: string }
  | { mode: "upsert"; record: {
      id: string; code: string; name: string; description: string; status: string
    } | null }

const sampleOrders = [
  { id: "ord_1", code: "WO-2024-001", name: "Annual Maintenance", description: "AMC for building equipment", status: "active" },
  { id: "ord_2", code: "WO-2024-002", name: "Electrical Repair", description: "Fix wiring on floor 3", status: "active" },
  { id: "ord_3", code: "WO-2024-003", name: "Painting Work", description: "Repaint office lobby", status: "archived" },
]

export function WorkOrderListPage({ onBack }: { onBack?: () => void }) {
  const [view, setView] = useState<WorkOrderView>({ mode: "list" })
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(100)

  const filtered = useMemo(() => {
    let items = [...sampleOrders]
    if (searchValue.trim()) {
      const term = searchValue.toLowerCase()
      items = items.filter((o) =>
        [o.code, o.name, o.description].some((v) => v.toLowerCase().includes(term))
      )
    }
    if (statusFilter !== "all") items = items.filter((o) => o.status === statusFilter)
    return items
  }, [searchValue, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const pageItems = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  if (view.mode === "show") {
    return (
      <WorkspacePage
        title={view.name}
        description={`${view.code}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="h-9 rounded-md" onClick={() => setView({ mode: "list" })}>
              <ArrowLeft className="size-4" />Back
            </Button>
          </div>
        }
      >
        <WorkspaceShowLayout>
          <WorkspaceShowCard title="Work Order">
            <WorkspaceDetailTable
              rows={[
                ["Code", view.code],
                ["Name", view.name],
                ["Description", view.description],
                ["Status", <WorkspaceStatusBadge key="s" label={view.status} tone={view.status === "active" ? "success" : "danger"} />],
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
      description: view.record?.description ?? "",
      status: view.record?.status ?? "active",
    })

    return (
      <WorkspaceUpsertPage
        title={isEdit ? "Edit Work Order" : "New Work Order"}
        description="Manage work order details."
        onBack={() => setView(view.record ? {
          mode: "show",
          id: view.record.id,
          code: view.record.code,
          name: view.record.name,
          description: view.record.description,
          status: view.record.status,
        } : { mode: "list" })}
      >
        <WorkspaceFormPanel title="Work order details">
          <WorkspaceFormGrid columns={2}>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Code</label>
              <Input className="h-11 rounded-md" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: (e.target as HTMLInputElement).value }))} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <Input className="h-11 rounded-md" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: (e.target as HTMLInputElement).value }))} />
            </div>
            <div className="col-span-full grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <Textarea className="min-h-[80px] w-full rounded-md" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: (e.target as HTMLTextAreaElement).value }))} />
            </div>
          </WorkspaceFormGrid>
          <div className="mt-4 flex items-center justify-between rounded-lg border border-border/70 px-4 py-3">
            <span className="text-sm font-medium text-muted-foreground">Active</span>
            <Switch checked={form.status === "active"} onCheckedChange={(checked: boolean) => setForm((f) => ({ ...f, status: checked ? "active" : "suspended" }))} />
          </div>
        </WorkspaceFormPanel>
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border/70 pt-5">
          <Button
            type="button"
            className="rounded-md"
            onClick={() => {
              setView({
                mode: "show",
                id: view.record?.id ?? `ord_${Date.now()}`,
                code: form.code,
                name: form.name,
                description: form.description,
                status: form.status,
              })
            }}
          >
            Save work order
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-md"
            onClick={() => setView(view.record ? {
              mode: "show",
              id: view.record.id,
              code: view.record.code,
              name: view.record.name,
              description: view.record.description,
              status: view.record.status,
            } : { mode: "list" })}
          >
            Cancel
          </Button>
        </div>
      </WorkspaceUpsertPage>
    )
  }

  return (
    <WorkspacePage
      title="Work Orders"
      description="Manage work orders and service requests."
      actions={
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className="h-9 rounded-md" onClick={onBack}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <Button type="button" className="h-9 rounded-md" onClick={() => setView({ mode: "upsert", record: null })}>
            <Plus className="size-4" />
            New work order
          </Button>
        </div>
      }
    >
      <WorkspaceFilters
        filterOptions={[
          { id: "all", label: "All orders" },
          { id: "active", label: "Active" },
          { id: "archived", label: "Archived" },
        ]}
        filterValue={statusFilter}
        onFilterValueChange={(value: string) => { setStatusFilter(value); setCurrentPage(1) }}
        onSearchValueChange={(value: string) => { setSearchValue(value); setCurrentPage(1) }}
        searchPlaceholder="Search work orders..."
        searchValue={searchValue}
      />
      <div className="overflow-hidden rounded-md border border-border/70 bg-card/95 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Code</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item) => (
                <tr key={item.id} className={cn("border-b border-border/70", item.status === "archived" && "bg-muted/20 text-muted-foreground")}>
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{item.code}</td>
                  <td className="px-4 py-2">
                    <button className="font-semibold hover:underline" type="button" onClick={() => setView({
                      mode: "show", id: item.id, code: item.code, name: item.name,
                      description: item.description, status: item.status
                    })}>
                      {item.name}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{item.description}</td>
                  <td className="px-4 py-2">
                    <WorkspaceStatusBadge label={item.status} tone={item.status === "active" ? "success" : "danger"} />
                  </td>
                  <td className="px-4 py-1.5 text-right">
                    <WorkspaceRowActions
                      title={item.name}
                      isSuspended={item.status === "archived"}
                      onView={() => setView({
                        mode: "show", id: item.id, code: item.code, name: item.name,
                        description: item.description, status: item.status
                      })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pageItems.length === 0 ? (
          <div className="px-6 py-14 text-center text-sm text-muted-foreground">No work orders found.</div>
        ) : null}
      </div>
      <WorkspacePagination
        page={currentPage}
        rowsPerPage={rowsPerPage}
        showingLabel={buildShowingLabel(currentPage, rowsPerPage, filtered.length)}
        singularLabel="work orders"
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
