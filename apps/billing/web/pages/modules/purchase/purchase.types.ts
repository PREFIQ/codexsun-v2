import type { z } from "zod";
import type {
  purchaseAllocationSchema,
  purchaseEntryLineSchema,
  purchaseEntrySchema,
} from "./purchase.schema";

export type PurchaseEntryLine = z.infer<typeof purchaseEntryLineSchema>;
export type PurchaseAllocation = z.infer<typeof purchaseAllocationSchema>;
export type PurchaseEntry = z.infer<typeof purchaseEntrySchema>;