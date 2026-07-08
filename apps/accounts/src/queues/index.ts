import { ledgersQueues } from "../modules/ledgers/queues/index.js";
import { bankAccountsQueues } from "../modules/bank-accounts/queues/index.js";
import { cashAccountsQueues } from "../modules/cash-accounts/queues/index.js";
import { journalQueues } from "../modules/journal/queues/index.js";
import { contraQueues } from "../modules/contra/queues/index.js";
import { doubleEntryQueues } from "../modules/double-entry/queues/index.js";
import { postingQueues } from "../modules/posting/queues/index.js";

export const accountsQueues = [
  ...ledgersQueues,
  ...bankAccountsQueues,
  ...cashAccountsQueues,
  ...journalQueues,
  ...contraQueues,
  ...doubleEntryQueues,
  ...postingQueues,
];
