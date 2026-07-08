import type { z } from "zod";
import type {
  paymentAllocationSchema,
  paymentEntryLineSchema,
  paymentEntrySchema,
} from "./payment.schema";

export type PaymentEntryLine = z.infer<typeof paymentEntryLineSchema>;
export type PaymentAllocation = z.infer<typeof paymentAllocationSchema>;
export type PaymentEntry = z.infer<typeof paymentEntrySchema>;