import type { AccountsModuleDefinition } from "../contracts.js";

export const contraModule: AccountsModuleDefinition = {
  key: "accounts.contra",
  label: "Contra",
  owns: ["contra vouchers"],
  status: "planned",
};
