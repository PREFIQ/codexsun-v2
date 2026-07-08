import { ledgersMigrations } from "../modules/ledgers/migrations/index.js";
import { bankAccountsMigrations } from "../modules/bank-accounts/migrations/index.js";
import { cashAccountsMigrations } from "../modules/cash-accounts/migrations/index.js";
import { journalMigrations } from "../modules/journal/migrations/index.js";
import { contraMigrations } from "../modules/contra/migrations/index.js";
import { doubleEntryMigrations } from "../modules/double-entry/migrations/index.js";
import { postingMigrations } from "../modules/posting/migrations/index.js";

export const accountsMigrations = [
  ...ledgersMigrations,
  ...bankAccountsMigrations,
  ...cashAccountsMigrations,
  ...journalMigrations,
  ...contraMigrations,
  ...doubleEntryMigrations,
  ...postingMigrations,
];
