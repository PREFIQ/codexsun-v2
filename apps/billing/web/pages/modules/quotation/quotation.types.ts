import type { z } from "zod";
import type {
  quotationAllocationSchema,
  quotationEntryLineSchema,
  quotationEntrySchema,
} from "./quotation.schema";

export type QuotationEntryLine = z.infer<typeof quotationEntryLineSchema>;
export type QuotationAllocation = z.infer<typeof quotationAllocationSchema>;
export type QuotationEntry = z.infer<typeof quotationEntrySchema>;