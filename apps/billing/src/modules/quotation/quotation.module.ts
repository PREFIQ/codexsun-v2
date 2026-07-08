import type { QuotationEntryModuleDefinition } from "./quotation.types.js";

export const quotationEntryModule: QuotationEntryModuleDefinition = {
  kind: "quotation",
  routeAliases: ["quotations"],
  documentKey: "quotation",
  documentPrefix: "QT",
  label: "Quotation",
  partyLabel: "Customer",
  defaultPartyType: "customer",
  requiresLines: true,
  supportsCompliance: true,
  status: "active",
};

