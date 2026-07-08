import type { SalesEntryModuleDefinition } from "./sales.types.js";

export const salesEntryModule: SalesEntryModuleDefinition = {
  kind: "sales",
  routeAliases: ["sale", "sales-invoice", "sales_invoice"],
  documentKey: "sales",
  documentPrefix: "SAL",
  label: "Sales",
  partyLabel: "Customer",
  defaultPartyType: "customer",
  requiresLines: true,
  supportsCompliance: true,
  status: "active",
};

