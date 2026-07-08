import type { BillingEntryModuleDefinition } from "../entries/contracts.js";

export const purchaseEntryModule: BillingEntryModuleDefinition = {
  kind: "purchase",
  routeAliases: ["purchases"],
  documentKey: "purchase",
  documentPrefix: "PUR",
  label: "Purchase",
  partyLabel: "Supplier",
  defaultPartyType: "supplier",
  requiresLines: true,
  supportsCompliance: false,
  status: "active",
};
