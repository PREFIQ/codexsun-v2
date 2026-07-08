export type PaymentEntryKind = "payment";

export type PaymentEntryModuleStatus = "active" | "planned" | "disabled";

export type PaymentEntryModuleDefinition = {
  kind: PaymentEntryKind;
  routeAliases: readonly string[];
  documentKey: string;
  documentPrefix: string;
  label: string;
  partyLabel: string;
  defaultPartyType: string;
  requiresLines: boolean;
  supportsCompliance: boolean;
  status: PaymentEntryModuleStatus;
};
