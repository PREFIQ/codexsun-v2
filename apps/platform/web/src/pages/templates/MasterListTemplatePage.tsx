import { ArrowLeft, Pencil, Plus, RefreshCw } from "lucide-react"
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
import { cn } from "@codexsun/ui/lib/utils"
import type { ContactRecord } from "./template-data"
import { contactData } from "./template-data"

type ContactView =
  | { mode: "list" }
  | { mode: "show"; record: ContactRecord }
  | { mode: "upsert"; record: ContactRecord | null }

export function MasterListTemplatePage() {
  const [view, setView] = useState<ContactView>({ mode: "list" })
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(100)

  const filtered = useMemo(() => {
    let items = [...contactData]
    if (searchValue.trim()) {
      const term = searchValue.toLowerCase()
      items = items.filter((c) =>
        [c.name, c.type, c.phone, c.city, c.gstin].some((v) => v.toLowerCase().includes(term)),
      )
    }
    if (statusFilter !== "all") items = items.filter((c) => c.status === statusFilter)
    return items
  }, [searchValue, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const pageItems = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  if (view.mode === "show") {
    return (
      <WorkspacePage
        title={view.record.name}
        description={`${view.record.type} \u00B7 ${view.record.city}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="h-9 rounded-md" onClick={() => setView({ mode: "list" })}>
              <ArrowLeft className="size-4" />Back
            </Button>
            <Button type="button" className="h-9 rounded-md" onClick={() => setView({ mode: "upsert", record: view.record })}>
              <Pencil className="size-4" />Edit
            </Button>
          </div>
        }
      >
        <WorkspaceShowLayout>
          <div className="space-y-4">
            <WorkspaceShowCard title="Profile">
              <WorkspaceDetailTable
                rows={[
                  ["Name", view.record.name],
                  ["Type", view.record.type],
                  ["Status", <WorkspaceStatusBadge key="s" label={view.record.status} tone={view.record.status === "active" ? "success" : "danger"} />],
                ]}
              />
            </WorkspaceShowCard>
          </div>
          <div className="space-y-4">
            <WorkspaceShowCard title="Contact methods">
              <WorkspaceDetailTable
                rows={[
                  ["Phone", view.record.phone],
                  ["City", view.record.city],
                  ["GSTIN", view.record.gstin || "Not set"],
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
      name: view.record?.name ?? "",
      type: view.record?.type ?? "Customer",
      phone: view.record?.phone ?? "",
      city: view.record?.city ?? "",
      gstin: view.record?.gstin ?? "",
      status: view.record?.status ?? "active",
    })

    return (
      <WorkspaceUpsertPage
        title={isEdit ? "Edit Contact" : "New Contact"}
        description="Update contact identity, tax, and communication details."
        onBack={() => setView(view.record ? { mode: "show", record: view.record } : { mode: "list" })}
      >
        <WorkspaceFormPanel title="Profile" description="Basic contact information.">
          <WorkspaceFormGrid columns={2}>
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-muted-foreground">Name</Label>
              <Input className="h-11 rounded-xl" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: (e.target as HTMLInputElement).value }))} />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-muted-foreground">Type</Label>
              <Input className="h-11 rounded-xl" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: (e.target as HTMLInputElement).value }))} />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
              <Input className="h-11 rounded-xl font-mono" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: (e.target as HTMLInputElement).value }))} />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-muted-foreground">City</Label>
              <Input className="h-11 rounded-xl" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: (e.target as HTMLInputElement).value }))} />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-muted-foreground">GSTIN</Label>
              <Input className="h-11 rounded-xl font-mono uppercase" value={form.gstin} onChange={(e) => setForm((f) => ({ ...f, gstin: (e.target as HTMLInputElement).value }))} />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-muted-foreground">Status</Label>
              <Input className="h-11 rounded-xl" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: (e.target as HTMLInputElement).value }))} />
            </div>
          </WorkspaceFormGrid>
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border/70 pt-5">
            <Button
              type="button"
              className="rounded-md"
              onClick={() => {
                const updated: ContactRecord = {
                  id: view.record?.id ?? `con_${Date.now()}`,
                  ...form,
                }
                setView({ mode: "show", record: updated })
              }}
            >
              Save contact
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-md"
              onClick={() => setView(view.record ? { mode: "show", record: view.record } : { mode: "list" })}
            >
              Cancel
            </Button>
          </div>
        </WorkspaceFormPanel>
      </WorkspaceUpsertPage>
    )
  }

  return (
    <WorkspacePage
      title="Contact List"
      description="Manage customers, suppliers, and other business contacts."
      actions={
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className="h-9 rounded-md">
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button type="button" className="h-9 rounded-md" onClick={() => setView({ mode: "upsert", record: null })}>
            <Plus className="size-4" />
            New contact
          </Button>
        </div>
      }
    >
      <WorkspaceFilters
        filterOptions={[
          { id: "all", label: "All contacts" },
          { id: "active", label: "Active" },
          { id: "inactive", label: "Inactive" },
        ]}
        filterValue={statusFilter}
        onFilterValueChange={(value: string) => { setStatusFilter(value); setCurrentPage(1) }}
        onSearchValueChange={(value: string) => { setSearchValue(value); setCurrentPage(1) }}
        searchPlaceholder="Search contacts..."
        searchValue={searchValue}
      />
      <div className="overflow-hidden rounded-md border border-border/70 bg-card/95 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Phone</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">City</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">GSTIN</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item) => (
                <tr key={item.id} className={cn("border-b border-border/70", item.status === "inactive" && "bg-muted/20 text-muted-foreground")}>
                  <td className="px-4 py-2">
                    <button className="font-semibold hover:underline" type="button" onClick={() => setView({ mode: "show", record: item })}>
                      {item.name}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{item.type}</td>
                  <td className="px-4 py-2 text-muted-foreground">{item.phone}</td>
                  <td className="px-4 py-2 text-muted-foreground">{item.city}</td>
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{item.gstin || "\u2014"}</td>
                  <td className="px-4 py-2">
                    <WorkspaceStatusBadge label={item.status} tone={item.status === "active" ? "success" : "danger"} />
                  </td>
                  <td className="px-4 py-1.5 text-right">
                    <WorkspaceRowActions
                      title={item.name}
                      isSuspended={item.status === "inactive"}
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
          <div className="px-6 py-14 text-center text-sm text-muted-foreground">No contacts found.</div>
        ) : null}
      </div>
      <WorkspacePagination
        page={currentPage}
        rowsPerPage={rowsPerPage}
        showingLabel={buildShowingLabel(currentPage, rowsPerPage, filtered.length)}
        singularLabel="contacts"
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
