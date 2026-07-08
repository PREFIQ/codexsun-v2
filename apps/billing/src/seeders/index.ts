import { entriesSeeders } from "../modules/entries/seeders/index.js";
import { quotationSeeders } from "../modules/quotation/seeders/index.js";
import { salesSeeders } from "../modules/sales/seeders/index.js";
import { exportSalesSeeders } from "../modules/export-sales/seeders/index.js";
import { purchaseSeeders } from "../modules/purchase/seeders/index.js";
import { receiptSeeders } from "../modules/receipt/seeders/index.js";
import { paymentSeeders } from "../modules/payment/seeders/index.js";
import { cashBookSeeders } from "../modules/cash-book/seeders/index.js";
import { bankBookSeeders } from "../modules/bank-book/seeders/index.js";

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
