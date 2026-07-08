import { entriesSeeders } from "../modules/entries/entries.seed.js";
import { quotationSeeders } from "../modules/quotation/quotation.seed.js";
import { salesSeeders } from "../modules/sales/sales.seed.js";
import { exportSalesSeeders } from "../modules/export-sales/export-sales.seed.js";
import { purchaseSeeders } from "../modules/purchase/purchase.seed.js";
import { receiptSeeders } from "../modules/receipt/receipt.seed.js";
import { paymentSeeders } from "../modules/payment/payment.seed.js";
import { cashBookSeeders } from "../modules/cash-book/cash-book.seed.js";
import { bankBookSeeders } from "../modules/bank-book/bank-book.seed.js";

export { entriesSeeders };

export const billingSeeders = [
  ...entriesSeeders,
  ...quotationSeeders,
  ...salesSeeders,
  ...exportSalesSeeders,
  ...purchaseSeeders,
  ...receiptSeeders,
  ...paymentSeeders,
  ...cashBookSeeders,
  ...bankBookSeeders,
];
