import { entriesSyncRules } from "../modules/entries/entries.sync.js";
import { quotationSyncRules } from "../modules/quotation/quotation.sync.js";
import { salesSyncRules } from "../modules/sales/sales.sync.js";
import { exportSalesSyncRules } from "../modules/export-sales/export-sales.sync.js";
import { purchaseSyncRules } from "../modules/purchase/purchase.sync.js";
import { receiptSyncRules } from "../modules/receipt/receipt.sync.js";
import { paymentSyncRules } from "../modules/payment/payment.sync.js";
import { cashBookSyncRules } from "../modules/cash-book/cash-book.sync.js";
import { bankBookSyncRules } from "../modules/bank-book/bank-book.sync.js";

export const billingSyncRules = [
  ...entriesSyncRules,
  ...quotationSyncRules,
  ...salesSyncRules,
  ...exportSalesSyncRules,
  ...purchaseSyncRules,
  ...receiptSyncRules,
  ...paymentSyncRules,
  ...cashBookSyncRules,
  ...bankBookSyncRules,
];
