import { apiGet, apiPost } from "../../api";
import { purchaseEntriesSchema, purchaseEntrySchema } from "./purchase.schema";
import type { PurchaseEntry } from "./purchase.types";
import type { PurchaseEntryForm } from "./purchase.workspace";
import { payloadFromForm } from "./purchase.workspace";

export async function listPurchaseEntries() {
  const entries = await apiGet<unknown>("/billing/entries/purchase", "tenant");
  return purchaseEntriesSchema.parse(entries);
}

export async function upsertPurchaseEntry(input: PurchaseEntryForm) {
  const result = await apiPost<{ ok: boolean; entry: unknown }>("/billing/entries/purchase/upsert", payloadFromForm("purchase", input), "tenant");
  return { ...result, entry: purchaseEntrySchema.parse(result.entry) };
}

export async function archivePurchaseEntry(entry: PurchaseEntry) {
  const result = await apiPost<{ ok: boolean; entry: unknown }>(`/billing/entries/purchase/${entry.entryId}/archive`, {}, "tenant");
  return { ...result, entry: purchaseEntrySchema.parse(result.entry) };
}

export async function restorePurchaseEntry(entry: PurchaseEntry) {
  const result = await apiPost<{ ok: boolean; entry: unknown }>(`/billing/entries/purchase/${entry.entryId}/restore`, {}, "tenant");
  return { ...result, entry: purchaseEntrySchema.parse(result.entry) };
}

export async function commentOnPurchaseEntry(entry: PurchaseEntry, body: string) {
  const result = await apiPost<{ ok: boolean; entry: unknown }>(`/billing/entries/purchase/${entry.entryId}/comments`, { body }, "tenant");
  return { ...result, entry: purchaseEntrySchema.parse(result.entry) };
}

export async function runPurchaseEntryTool(entry: PurchaseEntry, tool: string, value?: string) {
  const result = await apiPost<{ ok: boolean; entry: unknown }>(`/billing/entries/purchase/${entry.entryId}/tools`, { tool, value }, "tenant");
  return { ...result, entry: purchaseEntrySchema.parse(result.entry) };
}