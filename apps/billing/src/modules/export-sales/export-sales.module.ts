import type { BillingEntryModuleDefinition } from "../entries/entries.types.js";

export const exportSalesEntryModule: BillingEntryModuleDefinition = {
  kind: "exportSales",
  routeAliases: ["export-sales", "export_sales", "exportsales"],
  documentKey: "exportSales",
  documentPrefix: "EXP",
  label: "Export Sales",
  partyLabel: "Customer",
  defaultPartyType: "customer",
  requiresLines: true,
  supportsCompliance: true,
  status: "active",
};
