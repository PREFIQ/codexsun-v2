import type { BillingEntryModuleDefinition } from "../entries/entries.types.js";

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
