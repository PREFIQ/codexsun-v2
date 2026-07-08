import { ledgersWorkers } from "../modules/ledgers/workers/index.js";
import { bankAccountsWorkers } from "../modules/bank-accounts/workers/index.js";
import { cashAccountsWorkers } from "../modules/cash-accounts/workers/index.js";
import { journalWorkers } from "../modules/journal/workers/index.js";
import { contraWorkers } from "../modules/contra/workers/index.js";
import { doubleEntryWorkers } from "../modules/double-entry/workers/index.js";
import { postingWorkers } from "../modules/posting/workers/index.js";

export const accountsWorkers = [
  ...ledgersWorkers,
  ...bankAccountsWorkers,
  ...cashAccountsWorkers,
  ...journalWorkers,
  ...contraWorkers,
  ...doubleEntryWorkers,
  ...postingWorkers,
];
