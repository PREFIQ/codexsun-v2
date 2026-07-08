import { apiGet, apiPost } from "../../api";
import { paymentEntriesSchema, paymentEntrySchema } from "./payment.schema";
import type { PaymentEntry } from "./payment.types";
import type { PaymentEntryForm } from "./payment.workspace";
import { payloadFromForm } from "./payment.workspace";

export async function listPaymentEntries() {
  const entries = await apiGet<unknown>("/billing/entries/payment", "tenant");
  return paymentEntriesSchema.parse(entries);
}

export async function upsertPaymentEntry(input: PaymentEntryForm) {
  const result = await apiPost<{ ok: boolean; entry: unknown }>("/billing/entries/payment/upsert", payloadFromForm("payment", input), "tenant");
  return { ...result, entry: paymentEntrySchema.parse(result.entry) };
}

export async function archivePaymentEntry(entry: PaymentEntry) {
  const result = await apiPost<{ ok: boolean; entry: unknown }>(`/billing/entries/payment/${entry.entryId}/archive`, {}, "tenant");
  return { ...result, entry: paymentEntrySchema.parse(result.entry) };
}

export async function restorePaymentEntry(entry: PaymentEntry) {
  const result = await apiPost<{ ok: boolean; entry: unknown }>(`/billing/entries/payment/${entry.entryId}/restore`, {}, "tenant");
  return { ...result, entry: paymentEntrySchema.parse(result.entry) };
}

export async function commentOnPaymentEntry(entry: PaymentEntry, body: string) {
  const result = await apiPost<{ ok: boolean; entry: unknown }>(`/billing/entries/payment/${entry.entryId}/comments`, { body }, "tenant");
  return { ...result, entry: paymentEntrySchema.parse(result.entry) };
}

export async function runPaymentEntryTool(entry: PaymentEntry, tool: string, value?: string) {
  const result = await apiPost<{ ok: boolean; entry: unknown }>(`/billing/entries/payment/${entry.entryId}/tools`, { tool, value }, "tenant");
  return { ...result, entry: paymentEntrySchema.parse(result.entry) };
}