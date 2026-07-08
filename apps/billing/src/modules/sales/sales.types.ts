export type SalesEntryKind = "sales";

export type SalesEntryModuleStatus = "active" | "planned" | "disabled";

export type SalesEntryModuleDefinition = {
  kind: SalesEntryKind;
  routeAliases: readonly string[];
  documentKey: string;
  documentPrefix: string;
  label: string;
  partyLabel: string;
  defaultPartyType: string;
  requiresLines: boolean;
  supportsCompliance: boolean;
  status: SalesEntryModuleStatus;
};
