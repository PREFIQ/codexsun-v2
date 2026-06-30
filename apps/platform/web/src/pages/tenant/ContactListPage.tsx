import { ArrowLeft, Plus } from "lucide-react"
import { useMemo, useState } from "react"
import { Button } from "@codexsun/ui/components/button"
import { WorkspacePage } from "@codexsun/ui/workspace"
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters"
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination"
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions"
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status"
import { WorkspaceShowLayout, WorkspaceShowCard, WorkspaceDetailTable } from "@codexsun/ui/workspace/show"
import { WorkspaceUpsertPage, WorkspaceFormPanel, WorkspaceFormGrid } from "@codexsun/ui/workspace/upsert"
import { buildShowingLabel } from "@codexsun/ui/workspace/utils"
import { cn } from "@codexsun/ui/lib/utils"
import { AddressSubForm, type AddressFormData } from "./AddressSubForm"

type ContactView =
  | { mode: "list" }
  | { mode: "show"; id: string; displayName: string; contactType: string; phone: string; email: string; status: string }
  | { mode: "upsert"; record: {
      id: string; displayName: string; contactType: string; phone: string; email: string;
      companyName: string; gstin: string; notes: string; status: string; addresses: AddressFormData[]
    } | null }

const sampleContacts = [
  { id: "con_1", displayName: "ABC Traders", contactType: "customer", phone: "+91-9876543210", email: "info@abctraders.in", status: "active" },
  { id: "con_2", displayName: "XYZ Suppliers", contactType: "supplier", phone: "+91-8765432109", email: "orders@xyzsupply.com", status: "active" },
]

export function ContactListPage({ onBack }: { onBack?: () => void }) {
  const [view, setView] = useState<ContactView>({ mode: "list" })
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(100)

  const filtered = useMemo(() => {
    let items = [...sampleContacts]
    if (searchValue.trim()) {
      const term = searchValue.toLowerCase()
      items = items.filter((c) =>
        [c.displayName, c.contactType, c.phone, c.email].some((v) => v.toLowerCase().includes(term))
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
        title={view.displayName}
        description={`${view.contactType} \u00B7 ${view.phone}`}
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
            <WorkspaceShowCard title="Profile">
              <WorkspaceDetailTable
                rows={[
                  ["Name", view.displayName],
                  ["Type", view.contactType],
                  ["Status", <WorkspaceStatusBadge key="s" label={view.status} tone={view.status === "active" ? "success" : "danger"} />],
                ]}
              />
            </WorkspaceShowCard>
          </div>
          <div className="space-y-4">
            <WorkspaceShowCard title="Contact methods">
              <WorkspaceDetailTable
                rows={[
                  ["Phone", view.phone],
                  ["Email", view.email],
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
      displayName: view.record?.displayName ?? "",
      contactType: view.record?.contactType ?? "customer",
      phone: view.record?.phone ?? "",
      email: view.record?.email ?? "",
      companyName: view.record?.companyName ?? "",
      gstin: view.record?.gstin ?? "",
      notes: view.record?.notes ?? "",
      status: view.record?.status ?? "active",
      addresses: view.record?.addresses ?? [],
    })

    return (
      <WorkspaceUpsertPage
        title={isEdit ? "Edit Contact" : "New Contact"}
        description="Manage contact profile, communication, and address details."
        onBack={() => setView(view.record ? {
          mode: "show",
          id: view.record.id,
          displayName: view.record.displayName,
          contactType: view.record.contactType,
          phone: view.record.phone,
          email: view.record.email,
          status: view.record.status,
        } : { mode: "list" })}
      >
        <WorkspaceFormPanel title="Profile" description="Basic contact information.">
          <WorkspaceFormGrid columns={2}>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Display Name</label>
              <input
                className="flex h-11 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: (e.target as HTMLInputElement).value }))}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Type</label>
              <input
                className="flex h-11 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
                value={form.contactType}
                onChange={(e) => setForm((f) => ({ ...f, contactType: (e.target as HTMLInputElement).value }))}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Company</label>
              <input
                className="flex h-11 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
                value={form.companyName}
                onChange={(e) => setForm((f) => ({ ...f, companyName: (e.target as HTMLInputElement).value }))}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">GSTIN</label>
              <input
                className="flex h-11 w-full rounded-md border border-border/70 bg-background px-3 font-mono text-sm uppercase"
                value={form.gstin}
                onChange={(e) => setForm((f) => ({ ...f, gstin: (e.target as HTMLInputElement).value }))}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Phone</label>
              <input
                className="flex h-11 w-full rounded-md border border-border/70 bg-background px-3 font-mono text-sm"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: (e.target as HTMLInputElement).value }))}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <input
                className="flex h-11 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: (e.target as HTMLInputElement).value }))}
              />
            </div>
            <div className="col-span-full grid gap-2">
              <label className="text-sm font-medium text-muted-foreground">Notes</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-border/70 bg-background px-3 py-2 text-sm"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: (e.target as HTMLTextAreaElement).value }))}
              />
            </div>
          </WorkspaceFormGrid>
        </WorkspaceFormPanel>
        <WorkspaceFormPanel title="Addresses" description="Contact addresses.">
          <AddressSubForm
            addresses={form.addresses}
            onChange={(addresses) => setForm((f) => ({ ...f, addresses }))}
          />
        </WorkspaceFormPanel>
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border/70 pt-5">
          <Button
            type="button"
            className="rounded-md"
            onClick={() => {
              setView({
                mode: "show",
                id: view.record?.id ?? `con_${Date.now()}`,
                displayName: form.displayName,
                contactType: form.contactType,
                phone: form.phone,
                email: form.email,
                status: form.status,
              })
            }}
          >
            Save contact
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-md"
            onClick={() => setView(view.record ? {
              mode: "show",
              id: view.record.id,
              displayName: view.record.displayName,
              contactType: view.record.contactType,
              phone: view.record.phone,
              email: view.record.email,
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
      title="Contacts"
      description="Manage customers, suppliers, and other business contacts."
      actions={
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className="h-9 rounded-md" onClick={onBack}>
            <ArrowLeft className="size-4" />
            Back
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
          { id: "archived", label: "Archived" },
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
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item) => (
                <tr key={item.id} className={cn("border-b border-border/70", item.status === "archived" && "bg-muted/20 text-muted-foreground")}>
                  <td className="px-4 py-2">
                    <button className="font-semibold hover:underline" type="button" onClick={() => setView({
                      mode: "show", id: item.id, displayName: item.displayName,
                      contactType: item.contactType, phone: item.phone, email: item.email, status: item.status
                    })}>
                      {item.displayName}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{item.contactType}</td>
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{item.phone}</td>
                  <td className="px-4 py-2 text-muted-foreground">{item.email}</td>
                  <td className="px-4 py-2">
                    <WorkspaceStatusBadge label={item.status} tone={item.status === "active" ? "success" : "danger"} />
                  </td>
                  <td className="px-4 py-1.5 text-right">
                    <WorkspaceRowActions
                      title={item.displayName}
                      isSuspended={item.status === "archived"}
                      onView={() => setView({
                        mode: "show", id: item.id, displayName: item.displayName,
                        contactType: item.contactType, phone: item.phone, email: item.email, status: item.status
                      })}
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
