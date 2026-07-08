import type { ReceiptEntryModuleDefinition } from "./receipt.types.js";

export const receiptEntryModule: ReceiptEntryModuleDefinition = {
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

