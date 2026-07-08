export type ReceiptEntryKind = "receipt";

export type ReceiptEntryModuleStatus = "active" | "planned" | "disabled";

export type ReceiptEntryModuleDefinition = {
  kind: ReceiptEntryKind;
  routeAliases: readonly string[];
  documentKey: string;
  documentPrefix: string;
  label: string;
  partyLabel: string;
  defaultPartyType: string;
  requiresLines: boolean;
  supportsCompliance: boolean;
  status: ReceiptEntryModuleStatus;
};
