import { useMemo, useState } from "react"
import { WorkspacePage } from "@codexsun/ui/workspace"
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters"
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination"
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status"
import { buildShowingLabel } from "@codexsun/ui/workspace/utils"
import type { MasterDataPageProps } from "./types"

const definitions = [
  { key: "contact_type", label: "Contact Types", description: "Customer, supplier, transporter, etc.", scope: "system", fields: 2 },
  { key: "contact_group", label: "Contact Groups", description: "Grouping labels for contacts", scope: "tenant", fields: 2 },
  { key: "address_type", label: "Address Types", description: "Billing, shipping, office, warehouse", scope: "system", fields: 2 },
  { key: "country", label: "Countries", description: "Country lookup data", scope: "system", fields: 3 },
  { key: "state", label: "States", description: "State/region lookup", scope: "system", fields: 4 },
  { key: "district", label: "Districts", description: "District lookup", scope: "system", fields: 3 },
  { key: "city", label: "Cities", description: "City/town lookup", scope: "system", fields: 3 },
  { key: "pincode", label: "Pincodes", description: "Postal code lookup", scope: "system", fields: 4 },
  { key: "item_category", label: "Item Categories", description: "Product/service categories", scope: "tenant", fields: 2 },
  { key: "unit", label: "Units", description: "Pieces, kg, meter, box", scope: "system", fields: 3 },
  { key: "tax_category", label: "Tax Categories", description: "GST rate categories", scope: "tenant", fields: 3 },
]

export function MasterDataPage({ onNavigate }: MasterDataPageProps) {
  const [searchValue, setSearchValue] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(100)

  const filtered = useMemo(() => {
    if (!searchValue.trim()) return definitions
    const term = searchValue.toLowerCase()
    return definitions.filter((d) =>
      [d.key, d.label, d.description, d.scope].some((v) => v.toLowerCase().includes(term))
    )
  }, [searchValue])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const pageItems = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  return (
    <WorkspacePage
      title="Master Data"
      description="Common master data definitions used across business modules."
    >
      <WorkspaceFilters
        filterOptions={[
          { id: "all", label: "All" },
          { id: "system", label: "System" },
          { id: "tenant", label: "Tenant" },
        ]}
        filterValue="all"
        onFilterValueChange={() => { setCurrentPage(1) }}
        onSearchValueChange={(value: string) => { setSearchValue(value); setCurrentPage(1) }}
        searchValue={searchValue}
      />
      <div className="overflow-hidden rounded-md border border-border/70 bg-card/95 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Definition</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Scope</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fields</th>
                <th className="border-b border-border/70 px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item) => (
                <tr key={item.key} className="border-b border-border/70 last:border-b-0">
                  <td className="px-4 py-2">
                    <button
                      className="font-semibold hover:underline"
                      type="button"
                      onClick={() => onNavigate?.("records", item.key)}
                    >
                      {item.label}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{item.description}</td>
                  <td className="px-4 py-2">
                    <WorkspaceStatusBadge
                      label={item.scope}
                      tone={item.scope === "system" ? "info" : "warning"}
                    />
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{item.fields} fields</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => onNavigate?.("records", item.key)}
                    >
                      View records
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pageItems.length === 0 ? (
          <div className="px-6 py-14 text-center text-sm text-muted-foreground">No definitions found.</div>
        ) : null}
      </div>
      <WorkspacePagination
        page={currentPage}
        rowsPerPage={rowsPerPage}
        showingLabel={buildShowingLabel(currentPage, rowsPerPage, filtered.length)}
        singularLabel="definitions"
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
