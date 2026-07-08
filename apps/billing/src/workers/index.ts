import { entriesWorkers } from "../modules/entries/entries.worker.js";
import { quotationWorkers } from "../modules/quotation/quotation.worker.js";
import { salesWorkers } from "../modules/sales/sales.worker.js";
import { exportSalesWorkers } from "../modules/export-sales/export-sales.worker.js";
import { purchaseWorkers } from "../modules/purchase/purchase.worker.js";
import { receiptWorkers } from "../modules/receipt/receipt.worker.js";
import { paymentWorkers } from "../modules/payment/payment.worker.js";
import { cashBookWorkers } from "../modules/cash-book/cash-book.worker.js";
import { bankBookWorkers } from "../modules/bank-book/bank-book.worker.js";

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
