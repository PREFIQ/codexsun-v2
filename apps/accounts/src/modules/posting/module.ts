import type { AccountsModuleDefinition } from "../contracts.js";

export const postingModule: AccountsModuleDefinition = {
  key: "accounts.posting",
  label: "Accounts Posting",
  owns: ["posting contracts", "posting events", "ledger impact projections"],
  status: "planned",
};
