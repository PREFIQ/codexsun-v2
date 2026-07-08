import { entriesWorkers } from "../modules/entries/workers/index.js";
import { quotationWorkers } from "../modules/quotation/workers/index.js";
import { salesWorkers } from "../modules/sales/workers/index.js";
import { exportSalesWorkers } from "../modules/export-sales/workers/index.js";
import { purchaseWorkers } from "../modules/purchase/workers/index.js";
import { receiptWorkers } from "../modules/receipt/workers/index.js";
import { paymentWorkers } from "../modules/payment/workers/index.js";
import { cashBookWorkers } from "../modules/cash-book/workers/index.js";
import { bankBookWorkers } from "../modules/bank-book/workers/index.js";

export const billingWorkers = [
  ...entriesWorkers,
  ...quotationWorkers,
  ...salesWorkers,
  ...exportSalesWorkers,
  ...purchaseWorkers,
  ...receiptWorkers,
  ...paymentWorkers,
  ...cashBookWorkers,
  ...bankBookWorkers,
];
