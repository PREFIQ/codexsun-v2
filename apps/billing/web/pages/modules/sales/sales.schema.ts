import { z } from "zod";

export const salesSettingScopeSchema = z.enum(["client", "industry"]);

export const salesSettingToggleSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string(),
  scope: salesSettingScopeSchema,
  enabled: z.boolean(),
});

export const salesLayoutSettingIdSchema = z.enum([
  "sales-use-po",
  "sales-use-dc",
  "sales-use-colour",
  "sales-use-size",
  "sales-use-einvoice",
  "sales-use-eway",
]);

export const salesLetterheadSettingsSchema = z.object({
  addressColor: z.string(),
  addressFontFamily: z.string(),
  addressFontSize: z.coerce.number(),
  borderColor: z.string(),
  companyNameColor: z.string(),
  companyNameFontFamily: z.string(),
  companyNameFontSize: z.coerce.number(),
  contactFontSize: z.coerce.number(),
  heightMm: z.coerce.number(),
  logoHeightMm: z.coerce.number(),
  logoLeftMm: z.coerce.number(),
  logoTopMm: z.coerce.number(),
  logoWidthMm: z.coerce.number(),
  taxFontSize: z.coerce.number(),
});

export const salesSettingsSchema = z.object({
  customise: z.array(salesSettingToggleSchema),
  features: z.array(salesSettingToggleSchema),
  gstApiMode: z.enum(["einvoice_eway", "eway_only"]),
  letterhead: salesLetterheadSettingsSchema,
  layout: z.record(salesLayoutSettingIdSchema, z.boolean()),
  printing: z.object({
    customTerms: z.string(),
    settings: z.array(salesSettingToggleSchema),
  }),
});

export const salesEntryLineSchema = z.object({
  lineId: z.string().optional(),
  productId: z.string().nullable().optional(),
  productName: z.string(),
  description: z.string().nullable().optional(),
  colour: z.string().nullable().optional(),
  hsnCode: z.string().nullable().optional(),
  poNo: z.string().nullable().optional(),
  dcNo: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
  quantity: z.coerce.number(),
  rate: z.coerce.number(),
  discountAmount: z.coerce.number(),
  taxRate: z.coerce.number(),
  taxAmount: z.coerce.number().optional(),
  lineTotal: z.coerce.number().optional(),
});

export const salesAllocationSchema = z.object({
  allocationId: z.string().optional(),
  documentType: z.string(),
  documentId: z.string().nullable().optional(),
  documentNo: z.string(),
  documentDate: z.string().nullable().optional(),
  documentTotal: z.coerce.number(),
  previousBalance: z.coerce.number(),
  allocatedAmount: z.coerce.number(),
  balanceAfterAllocation: z.coerce.number().optional(),
});

export const salesEntrySchema = z.object({
  entryId: z.string(),
  entryType: z.literal("sales"),
  documentNo: z.string(),
  documentDate: z.string(),
  partyId: z.string().nullable().optional(),
  partyName: z.string(),
  partyType: z.string().nullable().optional(),
  partyGstin: z.string().nullable().optional(),
  partyStateCode: z.string().nullable().optional(),
  partyStateName: z.string().nullable().optional(),
  billingAddress: z.string().nullable().optional(),
  shippingAddress: z.string().nullable().optional(),
  placeOfSupply: z.string().nullable().optional(),
  referenceNo: z.string().nullable().optional(),
  referenceDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  subtotal: z.coerce.number(),
  discountTotal: z.coerce.number(),
  taxableTotal: z.coerce.number(),
  taxTotal: z.coerce.number(),
  roundOff: z.coerce.number(),
  grandTotal: z.coerce.number(),
  paidAmount: z.coerce.number(),
  balanceAmount: z.coerce.number(),
  amount: z.coerce.number(),
  tdsAmount: z.coerce.number(),
  netAmount: z.coerce.number(),
  allocatedAmount: z.coerce.number(),
  unallocatedAmount: z.coerce.number(),
  status: z.string(),
  paymentStatus: z.string(),
  notes: z.string().nullable().optional(),
  terms: z.string().nullable().optional(),
  irn: z.string().nullable().optional(),
  ackNo: z.string().nullable().optional(),
  ackDate: z.string().nullable().optional(),
  signedQr: z.string().nullable().optional(),
  ewayBillNo: z.string().nullable().optional(),
  ewayBillDate: z.string().nullable().optional(),
  transportName: z.string().nullable().optional(),
  vehicleNo: z.string().nullable().optional(),
  ewayPart: z.string().nullable().optional(),
  source: z.record(z.string(), z.unknown()).nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lines: z.array(salesEntryLineSchema),
  allocations: z.array(salesAllocationSchema).default([]),
  comments: z.array(z.object({ authorEmail: z.string(), body: z.string(), createdAt: z.string() })).default([]),
  activities: z.array(z.object({ activityType: z.string(), actorEmail: z.string(), message: z.string(), createdAt: z.string() })).default([]),
}).passthrough();

export const salesEntriesSchema = z.array(salesEntrySchema);
