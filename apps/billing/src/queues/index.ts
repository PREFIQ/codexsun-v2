import { entriesQueues } from "../modules/entries/entries.worker.js";
import { quotationQueues } from "../modules/quotation/quotation.worker.js";
import { salesQueues } from "../modules/sales/sales.worker.js";
import { exportSalesQueues } from "../modules/export-sales/export-sales.worker.js";
import { purchaseQueues } from "../modules/purchase/purchase.worker.js";
import { receiptQueues } from "../modules/receipt/receipt.worker.js";
import { paymentQueues } from "../modules/payment/payment.worker.js";
import { cashBookQueues } from "../modules/cash-book/cash-book.worker.js";
import { bankBookQueues } from "../modules/bank-book/bank-book.worker.js";

export const billingQueues = [
  ...entriesQueues,
  ...quotationQueues,
  ...salesQueues,
  ...exportSalesQueues,
  ...purchaseQueues,
  ...receiptQueues,
  ...paymentQueues,
  ...cashBookQueues,
  ...bankBookQueues,
];
