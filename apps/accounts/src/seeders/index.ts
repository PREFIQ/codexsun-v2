import { ledgersSeeders } from "../modules/ledgers/seeders/index.js";
import { bankAccountsSeeders } from "../modules/bank-accounts/seeders/index.js";
import { cashAccountsSeeders } from "../modules/cash-accounts/seeders/index.js";
import { journalSeeders } from "../modules/journal/seeders/index.js";
import { contraSeeders } from "../modules/contra/seeders/index.js";
import { doubleEntrySeeders } from "../modules/double-entry/seeders/index.js";
import { postingSeeders } from "../modules/posting/seeders/index.js";

export const accountsSeeders = [
  ...ledgersSeeders,
  ...bankAccountsSeeders,
  ...cashAccountsSeeders,
  ...journalSeeders,
  ...contraSeeders,
  ...doubleEntrySeeders,
  ...postingSeeders,
];
