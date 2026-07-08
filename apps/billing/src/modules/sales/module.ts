import type { BillingEntryModuleDefinition } from "../entries/contracts.js";

export const salesEntryModule: BillingEntryModuleDefinition = {
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
