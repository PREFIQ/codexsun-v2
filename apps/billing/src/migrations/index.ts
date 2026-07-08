import { entriesMigrations } from "../modules/entries/migrations/index.js";
import { quotationMigrations } from "../modules/quotation/migrations/index.js";
import { salesMigrations } from "../modules/sales/migrations/index.js";
import { exportSalesMigrations } from "../modules/export-sales/migrations/index.js";
import { purchaseMigrations } from "../modules/purchase/migrations/index.js";
import { receiptMigrations } from "../modules/receipt/migrations/index.js";
import { paymentMigrations } from "../modules/payment/migrations/index.js";
import { cashBookMigrations } from "../modules/cash-book/migrations/index.js";
import { bankBookMigrations } from "../modules/bank-book/migrations/index.js";

export { entriesMigrations };

export const billingMigrations = [
  ...entriesMigrations,
  ...quotationMigrations,
  ...salesMigrations,
  ...exportSalesMigrations,
  ...purchaseMigrations,
  ...receiptMigrations,
  ...paymentMigrations,
  ...cashBookMigrations,
  ...bankBookMigrations,
];
