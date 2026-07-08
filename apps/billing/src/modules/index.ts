import { exportSalesMigrations } from "./export-sales/export-sales.migration.js";
import { exportSalesSeeders } from "./export-sales/export-sales.seed.js";
import { exportSalesSyncRules } from "./export-sales/export-sales.sync.js";
import { exportSalesQueues, exportSalesWorkers } from "./export-sales/export-sales.worker.js";
import { paymentMigrations } from "./payment/payment.migration.js";
import { paymentSeeders } from "./payment/payment.seed.js";
import { paymentSyncRules } from "./payment/payment.sync.js";
import { paymentQueues, paymentWorkers } from "./payment/payment.worker.js";
import { purchaseMigrations } from "./purchase/purchase.migration.js";
import { purchaseSeeders } from "./purchase/purchase.seed.js";
import { purchaseSyncRules } from "./purchase/purchase.sync.js";
import { purchaseQueues, purchaseWorkers } from "./purchase/purchase.worker.js";
import { quotationMigrations } from "./quotation/quotation.migration.js";
import { quotationSeeders } from "./quotation/quotation.seed.js";
import { quotationSyncRules } from "./quotation/quotation.sync.js";
import { quotationQueues, quotationWorkers } from "./quotation/quotation.worker.js";
import { receiptMigrations } from "./receipt/receipt.migration.js";
import { receiptSeeders } from "./receipt/receipt.seed.js";
import { receiptSyncRules } from "./receipt/receipt.sync.js";
import { receiptQueues, receiptWorkers } from "./receipt/receipt.worker.js";
import { salesMigrations } from "./sales/sales.migration.js";
import { salesSeeders } from "./sales/sales.seed.js";
import { salesSyncRules } from "./sales/sales.sync.js";
import { salesQueues, salesWorkers } from "./sales/sales.worker.js";

export * from "./billing.routes.js";
export * from "./migrations.js";
export * from "./quotation/index.js";
export * from "./sales/index.js";
export * from "./export-sales/index.js";
export * from "./purchase/index.js";
export * from "./receipt/index.js";
export * from "./payment/index.js";

export const billingMigrations = [
  ...quotationMigrations,
  ...salesMigrations,
  ...exportSalesMigrations,
  ...purchaseMigrations,
  ...receiptMigrations,
  ...paymentMigrations,
];

export const billingSeeders = [
  ...quotationSeeders,
  ...salesSeeders,
  ...exportSalesSeeders,
  ...purchaseSeeders,
  ...receiptSeeders,
  ...paymentSeeders,
];

export const billingQueues = [
  ...quotationQueues,
  ...salesQueues,
  ...exportSalesQueues,
  ...purchaseQueues,
  ...receiptQueues,
  ...paymentQueues,
];

export const billingSyncRules = [
  ...quotationSyncRules,
  ...salesSyncRules,
  ...exportSalesSyncRules,
  ...purchaseSyncRules,
  ...receiptSyncRules,
  ...paymentSyncRules,
];

export const billingWorkers = [
  ...quotationWorkers,
  ...salesWorkers,
  ...exportSalesWorkers,
  ...purchaseWorkers,
  ...receiptWorkers,
  ...paymentWorkers,
];
