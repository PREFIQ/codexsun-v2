import type { BillingEntryModuleDefinition } from "../entries/contracts.js";

export const receiptEntryModule: BillingEntryModuleDefinition = {
  kind: "receipt",
  routeAliases: ["receipts"],
  documentKey: "receipt",
  documentPrefix: "REC",
  label: "Receipt",
  partyLabel: "Party",
  defaultPartyType: "party",
  requiresLines: false,
  supportsCompliance: false,
  status: "active",
};
