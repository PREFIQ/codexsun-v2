import type { BillingEntryKind, BillingEntryModuleDefinition } from "./contracts.js";
import { quotationEntryModule } from "../quotation/module.js";
import { salesEntryModule } from "../sales/module.js";
import { exportSalesEntryModule } from "../export-sales/module.js";
import { purchaseEntryModule } from "../purchase/module.js";
import { receiptEntryModule } from "../receipt/module.js";
import { paymentEntryModule } from "../payment/module.js";
import { cashBookEntryModule } from "../cash-book/module.js";
import { bankBookEntryModule } from "../bank-book/module.js";

export const billingEntryModules = [
  quotationEntryModule,
  salesEntryModule,
  exportSalesEntryModule,
  purchaseEntryModule,
  receiptEntryModule,
  paymentEntryModule,
  cashBookEntryModule,
  bankBookEntryModule,
] satisfies BillingEntryModuleDefinition[];

const modulesByKind = new Map<BillingEntryKind, BillingEntryModuleDefinition>();
const aliasesByRoute = new Map<string, BillingEntryModuleDefinition>();

for (const moduleDefinition of billingEntryModules) {
  modulesByKind.set(moduleDefinition.kind, moduleDefinition);
  aliasesByRoute.set(moduleDefinition.kind.toLowerCase(), moduleDefinition);
  for (const alias of moduleDefinition.routeAliases) {
    aliasesByRoute.set(alias.toLowerCase(), moduleDefinition);
  }
}

export function findBillingEntryModule(value: string): BillingEntryModuleDefinition | undefined {
  return aliasesByRoute.get(value.trim().toLowerCase());
}

export function getBillingEntryModule(kind: BillingEntryKind): BillingEntryModuleDefinition {
  const moduleDefinition = modulesByKind.get(kind);
  if (!moduleDefinition) throw new Error(`Billing entry module '${kind}' is not registered`);
  return moduleDefinition;
}
