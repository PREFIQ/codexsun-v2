import type { z } from "zod";
import type {
  receiptAllocationSchema,
  receiptEntryLineSchema,
  receiptEntrySchema,
} from "./receipt.schema";

export type ReceiptEntryLine = z.infer<typeof receiptEntryLineSchema>;
export type ReceiptAllocation = z.infer<typeof receiptAllocationSchema>;
export type ReceiptEntry = z.infer<typeof receiptEntrySchema>;