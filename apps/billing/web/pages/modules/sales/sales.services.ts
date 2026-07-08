import { apiGet, apiPost } from "../../api";
import {
  readSalesSettings,
  saveSalesSettings,
  payloadFromForm,
  type SalesEntryForm,
  type SalesEntryRecord,
} from "./sales.workspace";
import {
  salesEntriesSchema,
  salesEntrySchema,
  salesSettingsSchema,
} from "./sales.schema";
import type { SalesEntry, SalesSettings } from "./sales.types";

export async function listSalesEntries() {
  const entries = await apiGet<unknown>("/billing/entries/sales", "tenant");
  return salesEntriesSchema.parse(entries) satisfies SalesEntry[];
}

export async function upsertSalesEntry(input: SalesEntryForm) {
  const result = await apiPost<{ ok: boolean; entry: unknown }>("/billing/entries/sales/upsert", payloadFromForm("sales", input), "tenant");
  return { ...result, entry: salesEntrySchema.parse(result.entry) };
}

export async function archiveSalesEntry(entry: SalesEntryRecord) {
  const result = await apiPost<{ ok: boolean; entry: unknown }>(`/billing/entries/sales/${entry.entryId}/archive`, {}, "tenant");
  return { ...result, entry: salesEntrySchema.parse(result.entry) };
}

export async function restoreSalesEntry(entry: SalesEntryRecord) {
  const result = await apiPost<{ ok: boolean; entry: unknown }>(`/billing/entries/sales/${entry.entryId}/restore`, {}, "tenant");
  return { ...result, entry: salesEntrySchema.parse(result.entry) };
}

export async function commentOnSalesEntry(entry: SalesEntryRecord, body: string) {
  const result = await apiPost<{ ok: boolean; entry: unknown }>(`/billing/entries/sales/${entry.entryId}/comments`, { body }, "tenant");
  return { ...result, entry: salesEntrySchema.parse(result.entry) };
}

export async function runSalesEntryTool(entry: SalesEntryRecord, tool: string, value?: string) {
  const result = await apiPost<{ ok: boolean; entry: unknown }>(`/billing/entries/sales/${entry.entryId}/tools`, { tool, value }, "tenant");
  return { ...result, entry: salesEntrySchema.parse(result.entry) };
}

export function getSalesSettings() {
  return salesSettingsSchema.parse(readSalesSettings()) satisfies SalesSettings;
}

export function persistSalesSettings(settings: SalesSettings) {
  saveSalesSettings(salesSettingsSchema.parse(settings));
}
