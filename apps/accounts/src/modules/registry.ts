import type { AccountsModuleDefinition } from "./contracts.js";
import { ledgersModule } from "./ledgers/module.js";
import { bankAccountsModule } from "./bank-accounts/module.js";
import { cashAccountsModule } from "./cash-accounts/module.js";
import { journalModule } from "./journal/module.js";
import { contraModule } from "./contra/module.js";
import { doubleEntryModule } from "./double-entry/module.js";
import { postingModule } from "./posting/module.js";

export const accountsModules: AccountsModuleDefinition[] = [
  ledgersModule,
  bankAccountsModule,
  cashAccountsModule,
  journalModule,
  contraModule,
  doubleEntryModule,
  postingModule,
];
