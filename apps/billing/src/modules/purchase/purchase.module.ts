import type { PurchaseEntryModuleDefinition } from "./purchase.types.js";

export const purchaseEntryModule: PurchaseEntryModuleDefinition = {
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

