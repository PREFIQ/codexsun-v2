import type { BillingEntryModuleDefinition } from "../entries/contracts.js";

export const cashBookEntryModule: BillingEntryModuleDefinition = {
  kind: "cashBook",
  routeAliases: ["cash-book", "cash_book", "cashbook"],
  documentKey: "cashBook",
  documentPrefix: "CB",
  label: "Cash Book",
  partyLabel: "Party",
  defaultPartyType: "party",
  requiresLines: false,
  supportsCompliance: false,
  status: "planned",
};
