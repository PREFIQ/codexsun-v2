import type { PaymentEntryModuleDefinition } from "./payment.types.js";

export const paymentEntryModule: PaymentEntryModuleDefinition = {
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

