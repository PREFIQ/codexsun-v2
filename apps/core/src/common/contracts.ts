export type CoreDefinitionKey =
  | "country" | "state" | "district" | "city" | "pincode"
  | "contact_group" | "contact_type" | "address_type"
  | "bank_name" | "product_group" | "product_category" | "product_type"
  | "unit" | "hsn_code" | "tax_category" | "brand" | "colour" | "size" | "style"
  | "currency" | "priority" | "payment_term" | "accounting_year" | "month"
  | "sales_account_type" | "order_type" | "transport" | "warehouse"
  | "destination" | "stock_rejection_type";

export type CoreDefinitionField = {
  key: string; label: string; type: "string" | "boolean" | "number";
};

export type CoreDefinition = {
  definitionKey: CoreDefinitionKey;
  label: string;
  description: string;
  scope: "system" | "tenant";
  status: "active" | "deprecated";
  requiredPermission?: string;
  requiredFeature?: string;
  fields: CoreDefinitionField[];
  seedable: boolean;
};

export type CoreRecord = {
  recordId: string;
  tenantId: string;
  definitionKey: CoreDefinitionKey;
  code: string;
  name: string;
  status: "active" | "archived";
  payload: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  deletedAt?: string;
};

export type CoreRecordCreate = {
  tenantId: string; definitionKey: CoreDefinitionKey;
  code: string; name: string;
  payload?: Record<string, unknown>; createdBy: string;
};

export type CoreRecordUpdate = {
  tenantId: string; recordId: string;
  name?: string; payload?: Record<string, unknown>; updatedBy: string;
};

export const coreDefinitions: CoreDefinition[] = [
  {
    definitionKey: "country",
    label: "Country",
    description: "Countries for geographic references",
    scope: "system",
    status: "active",
    fields: [
      { key: "code", label: "Code", type: "string" },
      { key: "name", label: "Name", type: "string" },
      { key: "phonePrefix", label: "Phone Prefix", type: "string" },
    ],
    seedable: true,
  },
  {
    definitionKey: "state",
    label: "State",
    description: "States or provinces within a country",
    scope: "system",
    status: "active",
    fields: [
      { key: "code", label: "Code", type: "string" },
      { key: "name", label: "Name", type: "string" },
      { key: "countryCode", label: "Country Code", type: "string" },
      { key: "gstStateCode", label: "GST State Code", type: "string" },
    ],
    seedable: false,
  },
  {
    definitionKey: "district",
    label: "District",
    description: "Districts within a state",
    scope: "system",
    status: "active",
    fields: [
      { key: "code", label: "Code", type: "string" },
      { key: "name", label: "Name", type: "string" },
      { key: "stateCode", label: "State Code", type: "string" },
    ],
    seedable: false,
  },
  {
    definitionKey: "city",
    label: "City",
    description: "Cities or towns within a state",
    scope: "system",
    status: "active",
    fields: [
      { key: "code", label: "Code", type: "string" },
      { key: "name", label: "Name", type: "string" },
      { key: "stateCode", label: "State Code", type: "string" },
    ],
    seedable: false,
  },
  {
    definitionKey: "pincode",
    label: "Pincode",
    description: "Postal codes for geographic locations",
    scope: "system",
    status: "active",
    fields: [
      { key: "code", label: "Code", type: "string" },
      { key: "city", label: "City", type: "string" },
      { key: "district", label: "District", type: "string" },
      { key: "stateCode", label: "State Code", type: "string" },
    ],
    seedable: false,
  },
  {
    definitionKey: "contact_group",
    label: "Contact Group",
    description: "Groups for organizing contacts",
    scope: "tenant",
    status: "active",
    fields: [
      { key: "code", label: "Code", type: "string" },
      { key: "name", label: "Name", type: "string" },
    ],
    seedable: false,
  },
  {
    definitionKey: "contact_type",
    label: "Contact Type",
    description: "Types of contacts (customer, supplier, etc.)",
    scope: "system",
    status: "active",
    fields: [
      { key: "code", label: "Code", type: "string" },
      { key: "name", label: "Name", type: "string" },
    ],
    seedable: true,
  },
  {
    definitionKey: "address_type",
    label: "Address Type",
    description: "Types of addresses (billing, shipping, etc.)",
    scope: "system",
    status: "active",
    fields: [
      { key: "code", label: "Code", type: "string" },
      { key: "name", label: "Name", type: "string" },
    ],
    seedable: true,
  },
  {
    definitionKey: "bank_name",
    label: "Bank Name",
    description: "List of bank names for financial records",
    scope: "system",
    status: "active",
    fields: [
      { key: "code", label: "Code", type: "string" },
      { key: "name", label: "Name", type: "string" },
    ],
    seedable: true,
  },
  {
    definitionKey: "product_group",
    label: "Product Group",
    description: "Groups for categorizing products",
    scope: "tenant",
    status: "active",
    fields: [
      { key: "code", label: "Code", type: "string" },
      { key: "name", label: "Name", type: "string" },
      { key: "description", label: "Description", type: "string" },
    ],
    seedable: false,
  },
  {
    definitionKey: "product_category",
    label: "Product Category",
    description: "Categories within product groups",
    scope: "tenant",
    status: "active",
    fields: [
      { key: "code", label: "Code", type: "string" },
      { key: "name", label: "Name", type: "string" },
      { key: "groupCode", label: "Group Code", type: "string" },
    ],
    seedable: false,
  },
  {
    definitionKey: "product_type",
    label: "Product Type",
    description: "Types of products (finished, raw material, etc.)",
    scope: "tenant",
    status: "active",
    fields: [
      { key: "code", label: "Code", type: "string" },
      { key: "name", label: "Name", type: "string" },
    ],
    seedable: false,
  },
  {
    definitionKey: "unit",
    label: "Unit",
    description: "Measurement units for products and quantities",
    scope: "system",
    status: "active",
    fields: [
      { key: "code", label: "Code", type: "string" },
      { key: "name", label: "Name", type: "string" },
      { key: "category", label: "Category", type: "string" },
    ],
    seedable: true,
  },
  {
    definitionKey: "hsn_code",
    label: "HSN Code",
    description: "Harmonized System of Nomenclature codes",
    scope: "tenant",
    status: "active",
    fields: [
      { key: "code", label: "Code", type: "string" },
      { key: "description", label: "Description", type: "string" },
      { key: "rate", label: "Rate", type: "number" },
    ],
    seedable: false,
  },
  {
    definitionKey: "tax_category",
    label: "Tax Category",
    description: "Tax categories for products and services",
    scope: "tenant",
    status: "active",
    fields: [
      { key: "code", label: "Code", type: "string" },
      { key: "name", label: "Name", type: "string" },
      { key: "rate", label: "Rate", type: "number" },
    ],
    seedable: false,
  },
  {
    definitionKey: "brand",
    label: "Brand",
    description: "Product brand names",
    scope: "tenant",
    status: "active",
    fields: [
      { key: "code", label: "Code", type: "string" },
      { key: "name", label: "Name", type: "string" },
    ],
    seedable: false,
  },
  {
    definitionKey: "colour",
    label: "Colour",
    description: "Product colour options",
    scope: "tenant",
    status: "active",
    fields: [
      { key: "code", label: "Code", type: "string" },
      { key: "name", label: "Name", type: "string" },
    ],
    seedable: false,
  },
  {
    definitionKey: "size",
    label: "Size",
    description: "Product size options",
    scope: "tenant",
    status: "active",
    fields: [
      { key: "code", label: "Code", type: "string" },
      { key: "name", label: "Name", type: "string" },
    ],
    seedable: false,
  },
  {
    definitionKey: "style",
    label: "Style",
    description: "Product style options",
    scope: "tenant",
    status: "active",
    fields: [
      { key: "code", label: "Code", type: "string" },
      { key: "name", label: "Name", type: "string" },
    ],
    seedable: false,
  },
  {
    definitionKey: "currency",
    label: "Currency",
    description: "Currencies for financial transactions",
    scope: "system",
    status: "active",
    fields: [
      { key: "code", label: "Code", type: "string" },
      { key: "name", label: "Name", type: "string" },
      { key: "symbol", label: "Symbol", type: "string" },
    ],
    seedable: true,
  },
  {
    definitionKey: "priority",
    label: "Priority",
    description: "Priority levels for tasks and records",
    scope: "system",
    status: "active",
    fields: [
      { key: "code", label: "Code", type: "string" },
      { key: "name", label: "Name", type: "string" },
      { key: "level", label: "Level", type: "number" },
    ],
    seedable: true,
  },
  {
    definitionKey: "payment_term",
    label: "Payment Term",
    description: "Payment terms for invoices and transactions",
    scope: "system",
    status: "active",
    fields: [
      { key: "code", label: "Code", type: "string" },
      { key: "name", label: "Name", type: "string" },
      { key: "days", label: "Days", type: "number" },
    ],
    seedable: true,
  },
  {
    definitionKey: "accounting_year",
    label: "Accounting Year",
    description: "Fiscal and accounting year definitions",
    scope: "system",
    status: "active",
    fields: [
      { key: "code", label: "Code", type: "string" },
      { key: "name", label: "Name", type: "string" },
      { key: "startMonth", label: "Start Month", type: "number" },
    ],
    seedable: false,
  },
  {
    definitionKey: "month",
    label: "Month",
    description: "Calendar months for date references",
    scope: "system",
    status: "active",
    fields: [
      { key: "code", label: "Code", type: "string" },
      { key: "name", label: "Name", type: "string" },
      { key: "number", label: "Number", type: "number" },
    ],
    seedable: true,
  },
  {
    definitionKey: "sales_account_type",
    label: "Sales Account Type",
    description: "Types of sales accounts",
    scope: "system",
    status: "active",
    fields: [
      { key: "code", label: "Code", type: "string" },
      { key: "name", label: "Name", type: "string" },
    ],
    seedable: true,
  },
  {
    definitionKey: "order_type",
    label: "Order Type",
    description: "Types of orders (sales, purchase, etc.)",
    scope: "tenant",
    status: "active",
    fields: [
      { key: "code", label: "Code", type: "string" },
      { key: "name", label: "Name", type: "string" },
    ],
    seedable: false,
  },
  {
    definitionKey: "transport",
    label: "Transport",
    description: "Transport providers and carriers",
    scope: "tenant",
    status: "active",
    fields: [
      { key: "code", label: "Code", type: "string" },
      { key: "name", label: "Name", type: "string" },
      { key: "contactPerson", label: "Contact Person", type: "string" },
    ],
    seedable: false,
  },
  {
    definitionKey: "warehouse",
    label: "Warehouse",
    description: "Warehouse and storage locations",
    scope: "tenant",
    status: "active",
    fields: [
      { key: "code", label: "Code", type: "string" },
      { key: "name", label: "Name", type: "string" },
      { key: "location", label: "Location", type: "string" },
    ],
    seedable: false,
  },
  {
    definitionKey: "destination",
    label: "Destination",
    description: "Shipping and delivery destinations",
    scope: "tenant",
    status: "active",
    fields: [
      { key: "code", label: "Code", type: "string" },
      { key: "name", label: "Name", type: "string" },
    ],
    seedable: false,
  },
  {
    definitionKey: "stock_rejection_type",
    label: "Stock Rejection Type",
    description: "Types of stock rejection reasons",
    scope: "tenant",
    status: "active",
    fields: [
      { key: "code", label: "Code", type: "string" },
      { key: "name", label: "Name", type: "string" },
    ],
    seedable: false,
  },
];

type SeedRecord = {
  definitionKey: CoreDefinitionKey;
  code: string;
  name: string;
  payload?: Record<string, unknown>;
};

export const defaultSeedRecords: SeedRecord[] = [
  { definitionKey: "country", code: "IN", name: "India", payload: { phonePrefix: "+91" } },
  { definitionKey: "contact_type", code: "customer", name: "Customer" },
  { definitionKey: "contact_type", code: "supplier", name: "Supplier" },
  { definitionKey: "contact_type", code: "transporter", name: "Transporter" },
  { definitionKey: "contact_type", code: "employee", name: "Employee" },
  { definitionKey: "contact_type", code: "other", name: "Other" },
  { definitionKey: "address_type", code: "billing", name: "Billing" },
  { definitionKey: "address_type", code: "shipping", name: "Shipping" },
  { definitionKey: "address_type", code: "office", name: "Office" },
  { definitionKey: "address_type", code: "warehouse", name: "Warehouse" },
  { definitionKey: "unit", code: "pcs", name: "Pieces", payload: { category: "quantity" } },
  { definitionKey: "unit", code: "kg", name: "Kilograms", payload: { category: "weight" } },
  { definitionKey: "unit", code: "meter", name: "Meters", payload: { category: "length" } },
  { definitionKey: "unit", code: "box", name: "Box", payload: { category: "quantity" } },
  { definitionKey: "bank_name", code: "sbi", name: "State Bank of India" },
  { definitionKey: "bank_name", code: "hdfc", name: "HDFC Bank" },
  { definitionKey: "bank_name", code: "icici", name: "ICICI Bank" },
  { definitionKey: "bank_name", code: "axis", name: "Axis Bank" },
  { definitionKey: "bank_name", code: "pnb", name: "Punjab National Bank" },
  { definitionKey: "bank_name", code: "bob", name: "Bank of Baroda" },
  { definitionKey: "bank_name", code: "canara", name: "Canara Bank" },
  { definitionKey: "bank_name", code: "kotak", name: "Kotak Mahindra Bank" },
  { definitionKey: "bank_name", code: "yes", name: "Yes Bank" },
  { definitionKey: "bank_name", code: "idbi", name: "IDBI Bank" },
  { definitionKey: "currency", code: "INR", name: "Indian Rupee", payload: { symbol: "₹" } },
  { definitionKey: "payment_term", code: "immediate", name: "Immediate", payload: { days: 0 } },
  { definitionKey: "payment_term", code: "7days", name: "7 Days", payload: { days: 7 } },
  { definitionKey: "payment_term", code: "15days", name: "15 Days", payload: { days: 15 } },
  { definitionKey: "payment_term", code: "30days", name: "30 Days", payload: { days: 30 } },
  { definitionKey: "month", code: "jan", name: "January", payload: { number: 1 } },
  { definitionKey: "month", code: "feb", name: "February", payload: { number: 2 } },
  { definitionKey: "month", code: "mar", name: "March", payload: { number: 3 } },
  { definitionKey: "month", code: "apr", name: "April", payload: { number: 4 } },
  { definitionKey: "month", code: "may", name: "May", payload: { number: 5 } },
  { definitionKey: "month", code: "jun", name: "June", payload: { number: 6 } },
  { definitionKey: "month", code: "jul", name: "July", payload: { number: 7 } },
  { definitionKey: "month", code: "aug", name: "August", payload: { number: 8 } },
  { definitionKey: "month", code: "sep", name: "September", payload: { number: 9 } },
  { definitionKey: "month", code: "oct", name: "October", payload: { number: 10 } },
  { definitionKey: "month", code: "nov", name: "November", payload: { number: 11 } },
  { definitionKey: "month", code: "dec", name: "December", payload: { number: 12 } },
  { definitionKey: "priority", code: "low", name: "Low", payload: { level: 1 } },
  { definitionKey: "priority", code: "medium", name: "Medium", payload: { level: 2 } },
  { definitionKey: "priority", code: "high", name: "High", payload: { level: 3 } },
  { definitionKey: "priority", code: "critical", name: "Critical", payload: { level: 4 } },
  { definitionKey: "accounting_year", code: "calendar", name: "Calendar Year (Jan-Dec)", payload: { startMonth: 1 } },
  { definitionKey: "accounting_year", code: "april-march", name: "April-March", payload: { startMonth: 4 } },
  { definitionKey: "sales_account_type", code: "domestic", name: "Domestic Sales" },
  { definitionKey: "sales_account_type", code: "export", name: "Export Sales" },
  { definitionKey: "sales_account_type", code: "deemed-export", name: "Deemed Export" },
  { definitionKey: "order_type", code: "sales-order", name: "Sales Order" },
  { definitionKey: "order_type", code: "purchase-order", name: "Purchase Order" },
  { definitionKey: "order_type", code: "job-order", name: "Job Order" },
  { definitionKey: "transport", code: "road", name: "Road Transport" },
  { definitionKey: "transport", code: "rail", name: "Rail Transport" },
  { definitionKey: "transport", code: "air", name: "Air Transport" },
  { definitionKey: "warehouse", code: "main", name: "Main Warehouse" },
  { definitionKey: "destination", code: "factory", name: "Factory" },
  { definitionKey: "destination", code: "office", name: "Office" },
  { definitionKey: "destination", code: "site", name: "Site" },
  { definitionKey: "stock_rejection_type", code: "damaged", name: "Damaged" },
  { definitionKey: "stock_rejection_type", code: "expired", name: "Expired" },
  { definitionKey: "stock_rejection_type", code: "defective", name: "Defective" },
  { definitionKey: "contact_group", code: "general", name: "General" },
  { definitionKey: "contact_group", code: "vip", name: "VIP" },
  { definitionKey: "product_group", code: "finished", name: "Finished Goods" },
  { definitionKey: "product_group", code: "raw-material", name: "Raw Material" },
  { definitionKey: "product_category", code: "goods", name: "Goods" },
  { definitionKey: "product_category", code: "services", name: "Services" },
  { definitionKey: "product_type", code: "tangible", name: "Tangible" },
  { definitionKey: "product_type", code: "intangible", name: "Intangible" },
  { definitionKey: "brand", code: "generic", name: "Generic" },
  { definitionKey: "colour", code: "white", name: "White" },
  { definitionKey: "colour", code: "black", name: "Black" },
  { definitionKey: "colour", code: "red", name: "Red" },
  { definitionKey: "colour", code: "blue", name: "Blue" },
  { definitionKey: "colour", code: "green", name: "Green" },
  { definitionKey: "size", code: "small", name: "Small" },
  { definitionKey: "size", code: "medium", name: "Medium" },
  { definitionKey: "size", code: "large", name: "Large" },
  { definitionKey: "size", code: "xl", name: "Extra Large" },
  { definitionKey: "style", code: "standard", name: "Standard" },
  { definitionKey: "style", code: "premium", name: "Premium" },
];

export const coreCommonPermissions: readonly string[] = [
  "core.common.view",
  "core.common.manage",
];

export function getCoreDefinition(key: CoreDefinitionKey): CoreDefinition | undefined {
  return coreDefinitions.find((d) => d.definitionKey === key);
}

export function listCoreDefinitions(): CoreDefinition[] {
  return coreDefinitions;
}
