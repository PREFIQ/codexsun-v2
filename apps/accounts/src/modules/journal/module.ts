import type { AccountsModuleDefinition } from "../contracts.js";

export const journalModule: AccountsModuleDefinition = {
  key: "accounts.journal",
  label: "Journal",
  owns: ["journal vouchers"],
  status: "planned",
};
