import type { AccountsModuleDefinition } from "../contracts.js";

export const bankAccountsModule: AccountsModuleDefinition = {
  key: "accounts.bank-accounts",
  label: "Bank Accounts",
  owns: ["bank account masters", "bank reconciliation contracts"],
  status: "planned",
};
