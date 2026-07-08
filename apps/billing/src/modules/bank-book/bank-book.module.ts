import type { BillingEntryModuleDefinition } from "../entries/entries.types.js";

export const bankBookEntryModule: BillingEntryModuleDefinition = {
  kind: "bankBook",
  routeAliases: ["bank-book", "bank_book", "bankbook"],
  documentKey: "bankBook",
  documentPrefix: "BB",
  label: "Bank Book",
  partyLabel: "Party",
  defaultPartyType: "party",
  requiresLines: false,
  supportsCompliance: false,
  status: "planned",
};
