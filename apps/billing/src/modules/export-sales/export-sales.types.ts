export type ExportSalesEntryKind = "exportSales";

export type ExportSalesEntryModuleStatus = "active" | "planned" | "disabled";

export type ExportSalesEntryModuleDefinition = {
  kind: ExportSalesEntryKind;
  routeAliases: readonly string[];
  documentKey: string;
  documentPrefix: string;
  label: string;
  partyLabel: string;
  defaultPartyType: string;
  requiresLines: boolean;
  supportsCompliance: boolean;
  status: ExportSalesEntryModuleStatus;
};
