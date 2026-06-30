import { ArrowLeft, Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { Button } from "@codexsun/ui/components/button"
import { Input } from "@codexsun/ui/components/input"
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

type ProductView =
  | { mode: "list" }
  | { mode: "show"; id: string; code: string; name: string; productType: string; hsnCode: string; unit: string; tax: string; status: string }
  | { mode: "upsert"; record: {
      id: string; code: string; name: string; productType: string; hsnCode: string; unit: string; tax: string; status: string
    } | null }

const sampleProducts = [
  { id: "prd_1", code: "SRV-001", name: "Consulting Service", productType: "service", hsnCode: "9983", unit: "hours", tax: "18%", status: "active" },
  { id: "prd_2", code: "PRD-001", name: "Widget Alpha", productType: "goods", hsnCode: "8471", unit: "pcs", tax: "12%", status: "active" },
  { id: "prd_3", code: "PRD-002", name: "Widget Beta", productType: "goods", hsnCode: "8471", unit: "pcs", tax: "12%", status: "archived" },
]

export function ProductListPage({ onBack }: { onBack?: () => void }) {
  const [view, setView] = useState<ProductView>({ mode: "list" })
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(100)

  const filtered = useMemo(() => {
    let items = [...sampleProducts]
    if (searchValue.trim()) {
      const term = searchValue.toLowerCase()
      items = items.filter((p) =>
        [p.code, p.name, p.productType, p.hsnCode, p.unit].some((v) => v.toLowerCase().includes(term))
      )
    }
    if (statusFilter !== "all") items = items.filter((p) => p.status === statusFilter)
    return items
  }, [searchValue, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const pageItems = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  if (view.mode === "show") {
    return (
      <WorkspacePage
        title={view.name}
        description={`${view.code} \u00B7 ${view.productType}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="h-9 rounded-md" onClick={() => setView({ mode: "list" })}>
              <ArrowLeft className="size-4" />Back
            </Button>
          </div>
        }
      >
        <WorkspaceShowLayout>
          <div className="space-y-4">
            <WorkspaceShowCard title="Product">
              <WorkspaceDetailTable
                rows={[
                  ["Code", view.code],
                  ["Name", view.name],
                  ["Status", <WorkspaceStatusBadge key="s" label={view.status} tone={view.status === "active" ? "success" : "danger"} />],
                ]}
              />
            </WorkspaceShowCard>
          </div>
          <div className="space-y-4">
            <WorkspaceShowCard title="Details">
              <WorkspaceDetailTable
                rows={[
                  ["Product Type", view.productType],
                  ["HSN Code", view.hsnCode],
                  ["Unit", view.unit],
                  ["Tax", view.tax],
                ]}
              />
            </WorkspaceShowCard>
          </div>
        </WorkspaceShowLayout>
      </WorkspacePage>
    )
  }

  if (view.mode === "upsert") {
    const isEdit = view.record !== null
    const [form, setForm] = useState({
      code: view.record?.code ?? "",
      name: view.record?.name ?? "",
      productType: view.record?.productType ?? "goods",
      hsnCode: view.record?.hsnCode ?? "",
      unit: view.record?.unit ?? "pcs",
      tax: view.record?.tax ?? "0%",
      status: view.record?.status ?? "active",
    })

    return (
      <WorkspaceUpsertPage
        title={isEdit ? "Edit Product" : "New Product"}
        description="Manage product or service definition."
        onBack={() => setView(view.record ? {
          mode: "show",
          id: view.record.id,
          code: view.record.code,
          name: view.record.name,
          productType: view.record.productType,
          hsnCode: view.record.hsnCode,
          unit: view.record.unit,
          tax: view.record.tax,
          status: view.record.status,
        } : { mode: "list" })}
      >
        <WorkspaceFormPanel title="Product details">
          <WorkspaceFormGrid columns={2}>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Code</label>
              <Input className="h-11 rounded-md" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: (e.target as HTMLInputElement).value }))} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <Input className="h-11 rounded-md" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: (e.target as HTMLInputElement).value }))} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Product Type</label>
              <Input className="h-11 rounded-md" value={form.productType} onChange={(e) => setForm((f) => ({ ...f, productType: (e.target as HTMLInputElement).value }))} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">HSN Code</label>
              <Input className="h-11 rounded-md font-mono" value={form.hsnCode} onChange={(e) => setForm((f) => ({ ...f, hsnCode: (e.target as HTMLInputElement).value }))} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Unit</label>
              <Input className="h-11 rounded-md" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: (e.target as HTMLInputElement).value }))} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Tax</label>
              <Input className="h-11 rounded-md" value={form.tax} onChange={(e) => setForm((f) => ({ ...f, tax: (e.target as HTMLInputElement).value }))} />
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
                id: view.record?.id ?? `prd_${Date.now()}`,
                code: form.code,
                name: form.name,
                productType: form.productType,
                hsnCode: form.hsnCode,
                unit: form.unit,
                tax: form.tax,
                status: form.status,
              })
            }}
          >
            Save product
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
              productType: view.record.productType,
              hsnCode: view.record.hsnCode,
              unit: view.record.unit,
              tax: view.record.tax,
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
      title="Products"
      description="Manage products and services."
      actions={
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className="h-9 rounded-md" onClick={onBack}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <Button type="button" className="h-9 rounded-md" onClick={() => setView({ mode: "upsert", record: null })}>
            <Plus className="size-4" />
            New product
          </Button>
        </div>
      }
    >
      <WorkspaceFilters
        filterOptions={[
          { id: "all", label: "All products" },
          { id: "active", label: "Active" },
          { id: "archived", label: "Archived" },
        ]}
        filterValue={statusFilter}
        onFilterValueChange={(value: string) => { setStatusFilter(value); setCurrentPage(1) }}
        onSearchValueChange={(value: string) => { setSearchValue(value); setCurrentPage(1) }}
        searchPlaceholder="Search products..."
        searchValue={searchValue}
      />
      <div className="overflow-hidden rounded-md border border-border/70 bg-card/95 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Code</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">HSN</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unit</th>
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
                      productType: item.productType, hsnCode: item.hsnCode, unit: item.unit, tax: item.tax, status: item.status
                    })}>
                      {item.name}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{item.productType}</td>
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{item.hsnCode}</td>
                  <td className="px-4 py-2 text-muted-foreground">{item.unit}</td>
                  <td className="px-4 py-2">
                    <WorkspaceStatusBadge label={item.status} tone={item.status === "active" ? "success" : "danger"} />
                  </td>
                  <td className="px-4 py-1.5 text-right">
                    <WorkspaceRowActions
                      title={item.name}
                      isSuspended={item.status === "archived"}
                      onView={() => setView({
                        mode: "show", id: item.id, code: item.code, name: item.name,
                        productType: item.productType, hsnCode: item.hsnCode, unit: item.unit, tax: item.tax, status: item.status
                      })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pageItems.length === 0 ? (
          <div className="px-6 py-14 text-center text-sm text-muted-foreground">No products found.</div>
        ) : null}
      </div>
      <WorkspacePagination
        page={currentPage}
        rowsPerPage={rowsPerPage}
        showingLabel={buildShowingLabel(currentPage, rowsPerPage, filtered.length)}
        singularLabel="products"
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
