import type { BillingEntryModuleDefinition } from "../entries/contracts.js";

export const quotationEntryModule: BillingEntryModuleDefinition = {
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
