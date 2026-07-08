import type { AccountsModuleDefinition } from "../contracts.js";

export const ledgersModule: AccountsModuleDefinition = {
  key: "accounts.ledgers",
  label: "Ledgers",
  owns: ["ledger groups", "ledger masters"],
  status: "planned",
};
