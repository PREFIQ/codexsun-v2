export type PurchaseEntryKind = "purchase";

export type PurchaseEntryModuleStatus = "active" | "planned" | "disabled";

export type PurchaseEntryModuleDefinition = {
  kind: PurchaseEntryKind;
  routeAliases: readonly string[];
  documentKey: string;
  documentPrefix: string;
  label: string;
  partyLabel: string;
  defaultPartyType: string;
  requiresLines: boolean;
  supportsCompliance: boolean;
  status: PurchaseEntryModuleStatus;
};
