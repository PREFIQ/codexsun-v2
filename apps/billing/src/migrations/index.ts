import { entriesMigrations } from "../modules/entries/entries.migration.js";
import { quotationMigrations } from "../modules/quotation/quotation.migration.js";
import { salesMigrations } from "../modules/sales/sales.migration.js";
import { exportSalesMigrations } from "../modules/export-sales/export-sales.migration.js";
import { purchaseMigrations } from "../modules/purchase/purchase.migration.js";
import { receiptMigrations } from "../modules/receipt/receipt.migration.js";
import { paymentMigrations } from "../modules/payment/payment.migration.js";
import { cashBookMigrations } from "../modules/cash-book/cash-book.migration.js";
import { bankBookMigrations } from "../modules/bank-book/bank-book.migration.js";

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
