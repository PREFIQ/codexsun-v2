import { apiGet, apiPost } from "../../api";
import { receiptEntriesSchema, receiptEntrySchema } from "./receipt.schema";
import type { ReceiptEntry } from "./receipt.types";
import type { ReceiptEntryForm } from "./receipt.workspace";
import { payloadFromForm } from "./receipt.workspace";

export async function listReceiptEntries() {
  const entries = await apiGet<unknown>("/billing/entries/receipt", "tenant");
  return receiptEntriesSchema.parse(entries);
}

export async function upsertReceiptEntry(input: ReceiptEntryForm) {
  const result = await apiPost<{ ok: boolean; entry: unknown }>("/billing/entries/receipt/upsert", payloadFromForm("receipt", input), "tenant");
  return { ...result, entry: receiptEntrySchema.parse(result.entry) };
}

export async function archiveReceiptEntry(entry: ReceiptEntry) {
  const result = await apiPost<{ ok: boolean; entry: unknown }>(`/billing/entries/receipt/${entry.entryId}/archive`, {}, "tenant");
  return { ...result, entry: receiptEntrySchema.parse(result.entry) };
}

export async function restoreReceiptEntry(entry: ReceiptEntry) {
  const result = await apiPost<{ ok: boolean; entry: unknown }>(`/billing/entries/receipt/${entry.entryId}/restore`, {}, "tenant");
  return { ...result, entry: receiptEntrySchema.parse(result.entry) };
}

export async function commentOnReceiptEntry(entry: ReceiptEntry, body: string) {
  const result = await apiPost<{ ok: boolean; entry: unknown }>(`/billing/entries/receipt/${entry.entryId}/comments`, { body }, "tenant");
  return { ...result, entry: receiptEntrySchema.parse(result.entry) };
}

export async function runReceiptEntryTool(entry: ReceiptEntry, tool: string, value?: string) {
  const result = await apiPost<{ ok: boolean; entry: unknown }>(`/billing/entries/receipt/${entry.entryId}/tools`, { tool, value }, "tenant");
  return { ...result, entry: receiptEntrySchema.parse(result.entry) };
}