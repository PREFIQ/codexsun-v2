import { entriesQueues } from "../modules/entries/queues/index.js";
import { quotationQueues } from "../modules/quotation/queues/index.js";
import { salesQueues } from "../modules/sales/queues/index.js";
import { exportSalesQueues } from "../modules/export-sales/queues/index.js";
import { purchaseQueues } from "../modules/purchase/queues/index.js";
import { receiptQueues } from "../modules/receipt/queues/index.js";
import { paymentQueues } from "../modules/payment/queues/index.js";
import { cashBookQueues } from "../modules/cash-book/queues/index.js";
import { bankBookQueues } from "../modules/bank-book/queues/index.js";

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
