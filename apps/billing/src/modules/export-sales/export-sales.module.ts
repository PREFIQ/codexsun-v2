import type { ExportSalesEntryModuleDefinition } from "./export-sales.types.js";

export const exportSalesEntryModule: ExportSalesEntryModuleDefinition = {
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

