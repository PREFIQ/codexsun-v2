import type { BillingEntryModuleDefinition } from "../entries/entries.types.js";

export const paymentEntryModule: BillingEntryModuleDefinition = {
  kind: "payment",
  routeAliases: ["payments"],
  documentKey: "payment",
  documentPrefix: "PAY",
  label: "Payment",
  partyLabel: "Supplier",
  defaultPartyType: "supplier",
  requiresLines: false,
  supportsCompliance: false,
  status: "active",
};
