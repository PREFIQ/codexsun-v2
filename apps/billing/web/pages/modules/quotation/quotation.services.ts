import { apiGet, apiPost } from "../../api";
import { quotationEntriesSchema, quotationEntrySchema } from "./quotation.schema";
import type { QuotationEntry } from "./quotation.types";
import type { QuotationEntryForm } from "./quotation.workspace";
import { payloadFromForm } from "./quotation.workspace";

export async function listQuotationEntries() {
  const entries = await apiGet<unknown>("/billing/entries/quotation", "tenant");
  return quotationEntriesSchema.parse(entries);
}

export async function upsertQuotationEntry(input: QuotationEntryForm) {
  const result = await apiPost<{ ok: boolean; entry: unknown }>("/billing/entries/quotation/upsert", payloadFromForm("quotation", input), "tenant");
  return { ...result, entry: quotationEntrySchema.parse(result.entry) };
}

export async function archiveQuotationEntry(entry: QuotationEntry) {
  const result = await apiPost<{ ok: boolean; entry: unknown }>(`/billing/entries/quotation/${entry.entryId}/archive`, {}, "tenant");
  return { ...result, entry: quotationEntrySchema.parse(result.entry) };
}

export async function restoreQuotationEntry(entry: QuotationEntry) {
  const result = await apiPost<{ ok: boolean; entry: unknown }>(`/billing/entries/quotation/${entry.entryId}/restore`, {}, "tenant");
  return { ...result, entry: quotationEntrySchema.parse(result.entry) };
}

export async function commentOnQuotationEntry(entry: QuotationEntry, body: string) {
  const result = await apiPost<{ ok: boolean; entry: unknown }>(`/billing/entries/quotation/${entry.entryId}/comments`, { body }, "tenant");
  return { ...result, entry: quotationEntrySchema.parse(result.entry) };
}

export async function runQuotationEntryTool(entry: QuotationEntry, tool: string, value?: string) {
  const result = await apiPost<{ ok: boolean; entry: unknown }>(`/billing/entries/quotation/${entry.entryId}/tools`, { tool, value }, "tenant");
  return { ...result, entry: quotationEntrySchema.parse(result.entry) };
}