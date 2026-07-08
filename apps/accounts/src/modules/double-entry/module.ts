import type { AccountsModuleDefinition } from "../contracts.js";

export const doubleEntryModule: AccountsModuleDefinition = {
  key: "accounts.double-entry",
  label: "Double Entry",
  owns: ["debit lines", "credit lines", "voucher balancing rules"],
  status: "planned",
};
