export interface TenantDomainRecord {
  id: string
  domain: string
  tenant: string
  label: string
  primary: boolean
  status: string
  updatedAt: string
}

export const tenantDomainData: TenantDomainRecord[] = [
  { id: "dom_001", domain: "billing.aaran.test", tenant: "Aaran Textiles", label: "Primary storefront", primary: true, status: "active", updatedAt: "2026-06-29" },
  { id: "dom_002", domain: "retail.bluepeak.test", tenant: "Blue Peak Retail", label: "Retail desk", primary: false, status: "active", updatedAt: "2026-06-28" },
  { id: "dom_003", domain: "prints.kovai.test", tenant: "Kovai Prints", label: "Local billing", primary: false, status: "suspended", updatedAt: "2026-06-27" },
]

export interface ContactRecord {
  id: string
  name: string
  type: string
  phone: string
  city: string
  gstin: string
  status: string
}

export const contactData: ContactRecord[] = [
  { id: "con_001", name: "Kumar Fabrics", type: "Customer", phone: "9876543210", city: "Coimbatore", gstin: "33AAACK1234A1Z5", status: "active" },
  { id: "con_002", name: "Sri Devi Suppliers", type: "Supplier", phone: "9840011122", city: "Tiruppur", gstin: "33AAACS2222B1Z8", status: "active" },
  { id: "con_003", name: "Metro Logistics", type: "Transport", phone: "9000012345", city: "Chennai", gstin: "", status: "inactive" },
]

export interface InvoiceLine {
  item: string
  qty: number
  rate: number
  amount: number
}

export interface InvoiceRecord {
  id: string
  number: string
  date: string
  party: string
  status: string
  total: number
  lines: InvoiceLine[]
}

export const invoiceData: InvoiceRecord[] = [
  {
    id: "inv_001",
    number: "INV-2026-001",
    date: "2026-06-29",
    party: "Kumar Fabrics",
    status: "posted",
    total: 18500,
    lines: [
      { item: "Cotton Fabric", qty: 25, rate: 500, amount: 12500 },
      { item: "Packing Charge", qty: 1, rate: 6000, amount: 6000 },
    ],
  },
  {
    id: "inv_002",
    number: "INV-2026-002",
    date: "2026-06-28",
    party: "Blue Peak Retail",
    status: "draft",
    total: 9200,
    lines: [
      { item: "Printed Roll", qty: 8, rate: 1150, amount: 9200 },
    ],
  },
]
