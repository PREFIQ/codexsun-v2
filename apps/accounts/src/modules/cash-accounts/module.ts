import type { AccountsModuleDefinition } from "../contracts.js";

export const cashAccountsModule: AccountsModuleDefinition = {
  key: "accounts.cash-accounts",
  label: "Cash Accounts",
  owns: ["cash account masters"],
  status: "planned",
};
