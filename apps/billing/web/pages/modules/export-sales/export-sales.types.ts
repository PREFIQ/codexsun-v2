import type { z } from "zod";
import type {
  exportSalesAllocationSchema,
  exportSalesEntryLineSchema,
  exportSalesEntrySchema,
} from "./export-sales.schema";

export type ExportSalesEntryLine = z.infer<typeof exportSalesEntryLineSchema>;
export type ExportSalesAllocation = z.infer<typeof exportSalesAllocationSchema>;
export type ExportSalesEntry = z.infer<typeof exportSalesEntrySchema>;