import { ledgersSyncRules } from "../modules/ledgers/sync/index.js";
import { bankAccountsSyncRules } from "../modules/bank-accounts/sync/index.js";
import { cashAccountsSyncRules } from "../modules/cash-accounts/sync/index.js";
import { journalSyncRules } from "../modules/journal/sync/index.js";
import { contraSyncRules } from "../modules/contra/sync/index.js";
import { doubleEntrySyncRules } from "../modules/double-entry/sync/index.js";
import { postingSyncRules } from "../modules/posting/sync/index.js";

export const accountsSyncRules = [
  ...ledgersSyncRules,
  ...bankAccountsSyncRules,
  ...cashAccountsSyncRules,
  ...journalSyncRules,
  ...contraSyncRules,
  ...doubleEntrySyncRules,
  ...postingSyncRules,
];
