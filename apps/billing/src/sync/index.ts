import { entriesSyncRules } from "../modules/entries/sync/index.js";
import { quotationSyncRules } from "../modules/quotation/sync/index.js";
import { salesSyncRules } from "../modules/sales/sync/index.js";
import { exportSalesSyncRules } from "../modules/export-sales/sync/index.js";
import { purchaseSyncRules } from "../modules/purchase/sync/index.js";
import { receiptSyncRules } from "../modules/receipt/sync/index.js";
import { paymentSyncRules } from "../modules/payment/sync/index.js";
import { cashBookSyncRules } from "../modules/cash-book/sync/index.js";
import { bankBookSyncRules } from "../modules/bank-book/sync/index.js";

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
