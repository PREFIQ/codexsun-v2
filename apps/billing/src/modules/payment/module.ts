import type { BillingEntryModuleDefinition } from "../entries/contracts.js";

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
