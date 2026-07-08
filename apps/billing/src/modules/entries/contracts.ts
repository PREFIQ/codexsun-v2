export type BillingEntryKind =
  | "quotation"
  | "sales"
  | "exportSales"
  | "purchase"
  | "receipt"
  | "payment"
  | "cashBook"
  | "bankBook";

export type BillingEntryModuleStatus = "active" | "planned";

export type BillingEntryModuleDefinition = {
  kind: BillingEntryKind;
  routeAliases: string[];
  documentKey: string;
  documentPrefix: string;
  label: string;
  partyLabel: string;
  defaultPartyType: "customer" | "supplier" | "party";
  requiresLines: boolean;
  supportsCompliance: boolean;
  status: BillingEntryModuleStatus;
};
