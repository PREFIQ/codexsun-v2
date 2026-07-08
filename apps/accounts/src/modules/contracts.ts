export type AccountsModuleKey =
  | "accounts.ledgers"
  | "accounts.bank-accounts"
  | "accounts.cash-accounts"
  | "accounts.journal"
  | "accounts.contra"
  | "accounts.double-entry"
  | "accounts.posting";

export type AccountsModuleDefinition = {
  key: AccountsModuleKey;
  label: string;
  owns: string[];
  status: "planned" | "active";
};
