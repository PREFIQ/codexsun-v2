import type { z } from "zod";
import type {
  salesEntrySchema,
  salesAllocationSchema,
  salesLayoutSettingIdSchema,
  salesLetterheadSettingsSchema,
  salesEntryLineSchema,
  salesSettingsSchema,
  salesSettingToggleSchema,
} from "./sales.schema";

export type SalesEntryLine = z.infer<typeof salesEntryLineSchema>;
export type SalesAllocation = z.infer<typeof salesAllocationSchema>;
export type SalesEntry = z.infer<typeof salesEntrySchema>;
export type SalesLayoutSettingId = z.infer<typeof salesLayoutSettingIdSchema>;
export type SalesSettings = z.infer<typeof salesSettingsSchema>;
export type SalesSettingsToggle = z.infer<typeof salesSettingToggleSchema>;
export type SalesLetterheadSettings = z.infer<typeof salesLetterheadSettingsSchema>;
