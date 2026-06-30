import { ArrowLeft, Pencil, Plus, Printer, RefreshCw } from "lucide-react"
import { useMemo, useState } from "react"
import { Button } from "@codexsun/ui/components/button"
import { Input } from "@codexsun/ui/components/input"
import { Label } from "@codexsun/ui/components/label"
import { WorkspacePage } from "@codexsun/ui/workspace"
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters"
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination"
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions"
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status"
import { WorkspaceShowCard, WorkspaceDetailTable } from "@codexsun/ui/workspace/show"
import { WorkspaceUpsertPage, WorkspaceFormPanel, WorkspaceFormGrid } from "@codexsun/ui/workspace/upsert"
import { WorkspaceLineTable, WorkspaceLineTableHeader } from "@codexsun/ui/workspace/line-table"
import { WorkspaceTotalsPanel } from "@codexsun/ui/workspace/totals"
import { WorkspacePrintPreview, WorkspacePrintSheet } from "@codexsun/ui/workspace/print"
import { buildShowingLabel, formatMoney, formatDate } from "@codexsun/ui/workspace/utils"
import type { InvoiceRecord, InvoiceLine } from "./template-data"
import { invoiceData } from "./template-data"

type EntryView =
  | { mode: "list" }
  | { mode: "show"; record: InvoiceRecord }
  | { mode: "upsert"; record: InvoiceRecord | null }

export function EntryListTemplatePage() {
  const [view, setView] = useState<EntryView>({ mode: "list" })
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(100)

  const filtered = useMemo(() => {
    let items = [...invoiceData]
    if (searchValue.trim()) {
      const term = searchValue.toLowerCase()
      items = items.filter((inv) =>
        [inv.number, inv.party, inv.status].some((v) => v.toLowerCase().includes(term)),
      )
    }
    if (statusFilter !== "all") items = items.filter((inv) => inv.status === statusFilter)
    return items
  }, [searchValue, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const pageItems = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  if (view.mode === "show") {
    const inv = view.record
    const subtotal = inv.lines.reduce((sum, line) => sum + line.amount, 0)

    return (
      <>
        <WorkspacePage
          title={`${inv.number} - ${inv.party}`}
          description={`Date: ${formatDate(inv.date)} \u00B7 Status: ${inv.status}`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" className="h-9 rounded-md" onClick={() => setView({ mode: "list" })}>
                <ArrowLeft className="size-4" />Back
              </Button>
              <Button type="button" variant="outline" className="h-9 rounded-md" onClick={() => window.print()}>
                <Printer className="size-4" />Print
              </Button>
              <Button type="button" className="h-9 rounded-md" onClick={() => setView({ mode: "upsert", record: inv })}>
                <Pencil className="size-4" />Edit
              </Button>
            </div>
          }
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-4">
              <WorkspaceShowCard title="Details">
                <WorkspaceDetailTable
                  rows={[
                    ["Invoice", inv.number],
                    ["Date", formatDate(inv.date)],
                    ["Party", inv.party],
                    ["Status", <WorkspaceStatusBadge key="s" label={inv.status} tone={inv.status === "posted" ? "success" : "warning"} />],
                    ["Total", formatMoney(inv.total)],
                  ]}
                />
              </WorkspaceShowCard>
              <WorkspacePrintPreview>
                <WorkspacePrintSheet>
                  <div className="p-4 text-xs">
                    <div className="mb-4 flex items-start justify-between border-b border-gray-300 pb-3">
                      <div>
                        <h2 className="text-base font-bold">{inv.number}</h2>
                        <p className="mt-0.5 text-gray-600">{formatDate(inv.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{inv.party}</p>
                      </div>
                    </div>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-300 bg-gray-50">
                          <th className="px-2 py-1.5 text-left font-semibold">Item</th>
                          <th className="px-2 py-1.5 text-right font-semibold">Qty</th>
                          <th className="px-2 py-1.5 text-right font-semibold">Rate</th>
                          <th className="px-2 py-1.5 text-right font-semibold">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inv.lines.map((line, i) => (
                          <tr key={i} className="border-b border-gray-200">
                            <td className="px-2 py-1.5">{line.item}</td>
                            <td className="px-2 py-1.5 text-right">{line.qty}</td>
                            <td className="px-2 py-1.5 text-right">{formatMoney(line.rate)}</td>
                            <td className="px-2 py-1.5 text-right">{formatMoney(line.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-3 flex justify-end border-t border-gray-300 pt-2">
                      <div className="grid min-w-40 grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 text-xs">
                        <span>Subtotal</span>
                        <span className="text-right">{formatMoney(subtotal)}</span>
                        <span className="font-semibold">Total</span>
                        <span className="text-right font-semibold">{formatMoney(inv.total)}</span>
                      </div>
                    </div>
                  </div>
                </WorkspacePrintSheet>
              </WorkspacePrintPreview>
            </div>
            <div className="hidden lg:block">
              <WorkspaceShowCard title="Tools">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Email, WhatsApp, and other tools are available here.</p>
                </div>
              </WorkspaceShowCard>
            </div>
          </div>
        </WorkspacePage>
      </>
    )
  }

  if (view.mode === "upsert") {
    const isEdit = view.record !== null
    const [form, setForm] = useState({
      number: view.record?.number ?? "",
      date: view.record?.date ?? new Date().toISOString().split("T")[0] as string,
      party: view.record?.party ?? "",
      status: view.record?.status ?? "draft",
      lines: view.record?.lines ?? ([] as InvoiceLine[]),
    })

    const subtotal = form.lines.reduce((sum, line) => sum + line.amount, 0)

    function addLine() {
      setForm((f) => ({
        ...f,
        lines: [...f.lines, { item: "", qty: 1, rate: 0, amount: 0 }],
      }))
    }

    function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
      setForm((f) => ({ ...f, [key]: value }))
    }

    return (
      <WorkspaceUpsertPage
        title={isEdit ? `Edit ${view.record!.number}` : "New Invoice"}
        description="Create or update an invoice entry with line items."
        onBack={() => setView(view.record ? { mode: "show", record: view.record } : { mode: "list" })}
      >
        <WorkspaceFormPanel
          footer={
            <>
              <Button type="button" className="rounded-md" onClick={() => {
                const total = form.lines.reduce((s, l) => s + l.amount, 0)
                const record: InvoiceRecord = {
                  id: view.record?.id ?? `inv_${Date.now()}`,
                  number: form.number,
                  date: form.date,
                  party: form.party,
                  status: form.status,
                  total,
                  lines: form.lines,
                }
                setView({ mode: "show", record })
              }}>
                Save draft
              </Button>
              <Button type="button" variant="outline" className="rounded-md" onClick={() => setView(view.record ? { mode: "show", record: view.record } : { mode: "list" })}>
                Cancel
              </Button>
            </>
          }
        >
          <WorkspaceFormGrid columns={2}>
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-muted-foreground">Party</Label>
              <Input className="h-11 rounded-md" value={form.party} onChange={(e) => updateField("party", (e.target as HTMLInputElement).value)} />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-muted-foreground">Invoice no</Label>
              <Input className="h-11 rounded-md font-mono" value={form.number} onChange={(e) => updateField("number", (e.target as HTMLInputElement).value)} />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-muted-foreground">Date</Label>
              <Input className="h-11 rounded-md" type="date" value={form.date} onChange={(e) => updateField("date", (e.target as HTMLInputElement).value)} />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-muted-foreground">Status</Label>
              <Input className="h-11 rounded-md" value={form.status} onChange={(e) => updateField("status", (e.target as HTMLInputElement).value)} />
            </div>
          </WorkspaceFormGrid>

          <div className="mt-6 space-y-3">
            <WorkspaceLineTableHeader label="Invoice Items" />
            <WorkspaceLineTable<InvoiceLine>
              columns={[
                { header: "Item", width: "40%", render: (row, i) => (
                  <Input className="h-9 rounded-md text-xs" value={row.item} onChange={(e) => {
                    const lines: InvoiceLine[] = form.lines.map((line, idx) => idx === i ? { ...line, item: (e.target as HTMLInputElement).value } : line)
                    updateField("lines", lines)
                  }} />
                )},
                { header: "Qty", width: "15%", render: (row, i) => (
                  <Input className="h-9 rounded-md text-xs text-right" type="number" value={row.qty} onChange={(e) => {
                    const qty = Number((e.target as HTMLInputElement).value) || 0
                    const lines: InvoiceLine[] = form.lines.map((line, idx) => idx === i ? { ...line, qty, amount: qty * line.rate } : line)
                    updateField("lines", lines)
                  }} />
                )},
                { header: "Rate", width: "15%", render: (row, i) => (
                  <Input className="h-9 rounded-md text-xs text-right" type="number" value={row.rate} onChange={(e) => {
                    const rate = Number((e.target as HTMLInputElement).value) || 0
                    const lines: InvoiceLine[] = form.lines.map((line, idx) => idx === i ? { ...line, rate, amount: line.qty * rate } : line)
                    updateField("lines", lines)
                  }} />
                )},
                { header: "Amount", width: "15%", render: (row) => (
                  <span className="block text-right text-xs font-medium">{formatMoney(row.amount)}</span>
                )},
              ]}
              data={form.lines}
              rowKey={(_, i) => String(i)}
              onAdd={addLine}
              onDelete={(_, i) => {
                const lines = form.lines.filter((__, idx) => idx !== i)
                updateField("lines", lines)
              }}
              emptyLabel="No items added."
            />
            <WorkspaceTotalsPanel
              rows={[
                { label: "Subtotal", value: formatMoney(subtotal) },
                { label: "Total", value: formatMoney(subtotal), highlight: true },
              ]}
            />
          </div>
        </WorkspaceFormPanel>
      </WorkspaceUpsertPage>
    )
  }

  return (
    <WorkspacePage
      title="Invoice List"
      description="Create and review invoice entries."
      actions={
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className="h-9 rounded-md">
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button type="button" className="h-9 rounded-md" onClick={() => setView({ mode: "upsert", record: null })}>
            <Plus className="size-4" />
            New invoice
          </Button>
        </div>
      }
    >
      <WorkspaceFilters
        filterOptions={[
          { id: "all", label: "All invoices" },
          { id: "draft", label: "Draft" },
          { id: "posted", label: "Posted" },
        ]}
        filterValue={statusFilter}
        onFilterValueChange={(value: string) => { setStatusFilter(value); setCurrentPage(1) }}
        onSearchValueChange={(value: string) => { setSearchValue(value); setCurrentPage(1) }}
        searchPlaceholder="Search invoices..."
        searchValue={searchValue}
      />
      <div className="overflow-hidden rounded-md border border-border/70 bg-card/95 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Invoice</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Party</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((inv) => (
                <tr key={inv.id} className="border-b border-border/70 last:border-b-0">
                  <td className="px-4 py-2">
                    <button className="font-semibold hover:underline" type="button" onClick={() => setView({ mode: "show", record: inv })}>
                      {inv.number}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{formatDate(inv.date)}</td>
                  <td className="px-4 py-2 text-muted-foreground">{inv.party}</td>
                  <td className="px-4 py-2">
                    <WorkspaceStatusBadge label={inv.status} tone={inv.status === "posted" ? "success" : "warning"} />
                  </td>
                  <td className="px-4 py-2 text-right font-medium">{formatMoney(inv.total)}</td>
                  <td className="px-4 py-1.5 text-right">
                    <WorkspaceRowActions
                      title={inv.number}
                      onView={() => setView({ mode: "show", record: inv })}
                      onEdit={() => setView({ mode: "upsert", record: inv })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pageItems.length === 0 ? (
          <div className="px-6 py-14 text-center text-sm text-muted-foreground">No invoices found.</div>
        ) : null}
      </div>
      <WorkspacePagination
        page={currentPage}
        rowsPerPage={rowsPerPage}
        showingLabel={buildShowingLabel(currentPage, rowsPerPage, filtered.length)}
        singularLabel="invoices"
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
