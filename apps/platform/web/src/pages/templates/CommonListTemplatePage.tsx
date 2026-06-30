import { Pencil, Plus, RefreshCw } from "lucide-react"
import { useMemo, useState } from "react"
import { Badge } from "@codexsun/ui/components/badge"
import { Button } from "@codexsun/ui/components/button"
import { Input } from "@codexsun/ui/components/input"
import { Label } from "@codexsun/ui/components/label"
import { Switch } from "@codexsun/ui/components/switch"
import { WorkspacePage } from "@codexsun/ui/workspace"
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters"
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination"
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions"
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status"
import { WorkspaceShowLayout, WorkspaceShowCard, WorkspaceDetailTable } from "@codexsun/ui/workspace/show"
import { WorkspaceUpsertPage, WorkspaceFormPanel, WorkspaceFormGrid } from "@codexsun/ui/workspace/upsert"
import { buildShowingLabel } from "@codexsun/ui/workspace/utils"
import type { TenantDomainRecord } from "./template-data"
import { tenantDomainData } from "./template-data"

type CommonListView =
  | { mode: "list" }
  | { mode: "show"; record: TenantDomainRecord }
  | { mode: "upsert"; record: TenantDomainRecord | null }

export function CommonListTemplatePage() {
  const [view, setView] = useState<CommonListView>({ mode: "list" })
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(100)

  const filtered = useMemo(() => {
    let items = [...tenantDomainData]
    if (searchValue.trim()) {
      const term = searchValue.toLowerCase()
      items = items.filter((d) =>
        [d.domain, d.label, d.tenant, d.status].some((v) => v.toLowerCase().includes(term)),
      )
    }
    if (statusFilter !== "all") items = items.filter((d) => d.status === statusFilter)
    return items
  }, [searchValue, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const pageItems = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  if (view.mode === "show") {
    return (
      <WorkspacePage
        title={view.record.domain}
        description="Tenant domain profile and mapping details."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="h-9 rounded-md" onClick={() => setView({ mode: "list" })}>
              Back
            </Button>
            <Button type="button" className="h-9 rounded-md" onClick={() => setView({ mode: "upsert", record: view.record })}>
              <Pencil className="size-4" />Edit
            </Button>
          </div>
        }
      >
        <WorkspaceShowLayout>
          <div className="space-y-4">
            <WorkspaceShowCard title="Domain profile">
              <WorkspaceDetailTable
                rows={[
                  ["Domain", view.record.domain],
                  ["Label", view.record.label],
                  ["Status", <WorkspaceStatusBadge key="s" label={view.record.status} tone={view.record.status === "active" ? "success" : "warning"} />],
                  ["Primary", view.record.primary ? "Yes" : "No"],
                ]}
              />
            </WorkspaceShowCard>
          </div>
          <div className="space-y-4">
            <WorkspaceShowCard title="Mapping">
              <WorkspaceDetailTable
                rows={[
                  ["Tenant", view.record.tenant],
                  ["Updated", view.record.updatedAt],
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
      domain: view.record?.domain ?? "",
      tenant: view.record?.tenant ?? "",
      label: view.record?.label ?? "",
      status: view.record?.status ?? "active",
      primary: view.record?.primary ?? false,
    })

    return (
      <WorkspaceUpsertPage
        title={isEdit ? "Edit Tenant Domain" : "New Tenant Domain"}
        description={isEdit ? "Update the domain mapping configuration." : "Map a new public domain to a platform tenant."}
        onBack={() => setView(view.record ? { mode: "show", record: view.record } : { mode: "list" })}
      >
        <WorkspaceFormPanel
          title="Domain mapping"
          description="Configure the tenant-domain binding and landing options."
          footer={
            <>
              <Button
                type="button"
                className="rounded-md"
                onClick={() => {
                  const updated: TenantDomainRecord = {
                    id: view.record?.id ?? `dom_${Date.now()}`,
                    domain: form.domain,
                    tenant: form.tenant,
                    label: form.label,
                    primary: form.primary,
                    status: form.status,
                    updatedAt: new Date().toISOString().split("T")[0] as string,
                  }
                  setView({ mode: "show", record: updated })
                }}
              >
                Save domain
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-md"
                onClick={() => setView(view.record ? { mode: "show", record: view.record } : { mode: "list" })}
              >
                Cancel
              </Button>
            </>
          }
        >
          <WorkspaceFormGrid columns={2}>
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-muted-foreground">Tenant</Label>
              <Input className="h-11 rounded-md" value={form.tenant} onChange={(e) => setForm((f) => ({ ...f, tenant: (e.target as HTMLInputElement).value }))} />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-muted-foreground">Domain</Label>
              <Input className="h-11 rounded-md font-mono" value={form.domain} onChange={(e) => setForm((f) => ({ ...f, domain: (e.target as HTMLInputElement).value }))} />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-muted-foreground">Label</Label>
              <Input className="h-11 rounded-md" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: (e.target as HTMLInputElement).value }))} />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-muted-foreground">Status</Label>
              <Input className="h-11 rounded-md" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: (e.target as HTMLInputElement).value }))} />
            </div>
            <div className="col-span-full flex items-center justify-between gap-4 rounded-md border border-border/70 px-4 py-3">
              <span>
                <span className="flex items-center gap-1.5 text-sm font-medium">Primary domain</span>
                <span className="block text-xs text-muted-foreground">Set as the primary entry point for this tenant.</span>
              </span>
              <Switch checked={form.primary} onCheckedChange={(checked: boolean) => setForm((f) => ({ ...f, primary: checked }))} />
            </div>
          </WorkspaceFormGrid>
        </WorkspaceFormPanel>
      </WorkspaceUpsertPage>
    )
  }

  return (
    <WorkspacePage
      title="Tenant Domains"
      description="Master list for public domains and local hosts mapped to platform tenants."
      actions={
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className="h-9 rounded-md" onClick={() => setCurrentPage(1)}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button type="button" className="h-9 rounded-md" onClick={() => setView({ mode: "upsert", record: null })}>
            <Plus className="size-4" />
            New domain
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
        searchPlaceholder="Search domain, label, tenant, or status"
        searchValue={searchValue}
      />
      <div className="overflow-hidden rounded-md border border-border/70 bg-card/95 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">#</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Domain</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tenant</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Label</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Primary</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item, index) => (
                <tr key={item.id} className="border-b border-border/70 last:border-b-0">
                  <td className="px-4 py-2 text-muted-foreground">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                  <td className="px-4 py-2">
                    <button className="font-medium hover:underline" type="button" onClick={() => setView({ mode: "show", record: item })}>
                      {item.domain}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{item.tenant}</td>
                  <td className="px-4 py-2 text-muted-foreground">{item.label}</td>
                  <td className="px-4 py-2">{item.primary ? <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Yes</Badge> : "\u2014"}</td>
                  <td className="px-4 py-2">
                    <WorkspaceStatusBadge label={item.status} tone={item.status === "active" ? "success" : "warning"} />
                  </td>
                  <td className="px-4 py-1.5 text-right">
                    <WorkspaceRowActions
                      title={item.domain}
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
          <div className="px-6 py-14 text-center text-sm text-muted-foreground">No domains found.</div>
        ) : null}
      </div>
      <WorkspacePagination
        page={currentPage}
        rowsPerPage={rowsPerPage}
        showingLabel={buildShowingLabel(currentPage, rowsPerPage, filtered.length)}
        singularLabel="domains"
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
