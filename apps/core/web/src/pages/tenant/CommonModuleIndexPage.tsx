import { WorkspacePage } from "@codexsun/ui/workspace"

export const commonModuleGroups: Array<{
  label: string
  modules: Array<{ key: string; label: string; description: string }>
}> = [
  {
    label: "Location",
    modules: [
      { key: "countries", label: "Countries", description: "Country lookup data" },
      { key: "states", label: "States", description: "State/region lookup" },
      { key: "districts", label: "Districts", description: "District lookup" },
      { key: "cities", label: "Cities", description: "City/town lookup" },
      { key: "pincodes", label: "Pincodes", description: "Postal code lookup" },
    ],
  },
  {
    label: "Contacts",
    modules: [
      { key: "contact-types", label: "Contact Types", description: "Customer, supplier, transporter, etc." },
      { key: "address-types", label: "Address Types", description: "Billing, shipping, office, warehouse" },
      { key: "bank-names", label: "Bank Names", description: "Bank name lookup" },
      { key: "bank-account-types", label: "Bank Account Types", description: "Current, CC, OD, savings, and other bank account types" },
    ],
  },
  {
    label: "Product",
    modules: [
      { key: "product-groups", label: "Product Groups", description: "Product group definitions" },
      { key: "product-categories", label: "Product Categories", description: "Product category definitions" },
      { key: "product-types", label: "Product Types", description: "Product type definitions" },
      { key: "units", label: "Units", description: "Pieces, kg, meter, box" },
      { key: "hsn-codes", label: "HSN Codes", description: "HSN code lookup" },
      { key: "taxes", label: "Taxes", description: "Tax rate definitions" },
      { key: "brands", label: "Brands", description: "Brand name lookup" },
      { key: "colours", label: "Colours", description: "Colour lookup" },
      { key: "sizes", label: "Sizes", description: "Size lookup" },
      { key: "styles", label: "Styles", description: "Style lookup" },
    ],
  },
  {
    label: "Orders",
    modules: [
      { key: "order-types", label: "Order Types", description: "Order type definitions" },
      { key: "transports", label: "Transports", description: "Transport mode lookup" },
      { key: "warehouses", label: "Warehouses", description: "Warehouse definitions" },
      { key: "destinations", label: "Destinations", description: "Destination lookup" },
      { key: "stock-rejection-types", label: "Stock Rejection Types", description: "Rejection reason codes" },
    ],
  },
  {
    label: "Others",
    modules: [
      { key: "currencies", label: "Currencies", description: "Currency codes" },
      { key: "priorities", label: "Priorities", description: "Priority levels" },
      { key: "payment-terms", label: "Payment Terms", description: "Payment term definitions" },
      { key: "accounting-year", label: "Accounting Year", description: "Financial year periods" },
      { key: "months", label: "Months", description: "Month definitions" },
      { key: "sales-account-types", label: "Sales Account Types", description: "Sales account categories" },
    ],
  },
]

type Props = {
  onNavigate: (key: string, label: string) => void
}

export function CommonModuleIndexPage({ onNavigate }: Props) {
  return (
    <WorkspacePage
      title="Common Module Index"
      description="Browse and manage common master data definitions grouped by category."
    >
      <div className="space-y-6">
        {commonModuleGroups.map((group) => (
          <div key={group.label} className="rounded-md border border-border/70 bg-card/95 shadow-sm">
            <div className="border-b border-border/70 px-5 py-3">
              <h2 className="text-base font-semibold text-foreground">{group.label}</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {group.modules.map((mod) => (
                <button
                  key={mod.key}
                  type="button"
                  className="flex flex-col items-start rounded-lg border border-border/70 bg-background/50 px-4 py-3 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={() => onNavigate(mod.key, mod.label)}
                >
                  <span className="text-sm font-medium">{mod.label}</span>
                  <span className="mt-0.5 text-xs text-muted-foreground">{mod.description}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </WorkspacePage>
  )
}
