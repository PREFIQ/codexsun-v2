export type QuotationEntryKind = "quotation";

export type QuotationEntryModuleStatus = "active" | "planned" | "disabled";

export type QuotationEntryModuleDefinition = {
  kind: QuotationEntryKind;
  routeAliases: readonly string[];
  documentKey: string;
  documentPrefix: string;
  label: string;
  partyLabel: string;
  defaultPartyType: string;
  requiresLines: boolean;
  supportsCompliance: boolean;
  status: QuotationEntryModuleStatus;
};
