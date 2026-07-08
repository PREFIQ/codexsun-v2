import { apiGet, apiPost } from "../../api";
import { exportSalesEntriesSchema, exportSalesEntrySchema } from "./export-sales.schema";
import type { ExportSalesEntry } from "./export-sales.types";
import type { ExportSalesEntryForm } from "./export-sales.workspace";
import { payloadFromForm } from "./export-sales.workspace";

export async function listExportSalesEntries() {
  const entries = await apiGet<unknown>("/billing/entries/exportSales", "tenant");
  return exportSalesEntriesSchema.parse(entries);
}

export async function upsertExportSalesEntry(input: ExportSalesEntryForm) {
  const result = await apiPost<{ ok: boolean; entry: unknown }>("/billing/entries/exportSales/upsert", payloadFromForm("exportSales", input), "tenant");
  return { ...result, entry: exportSalesEntrySchema.parse(result.entry) };
}

export async function archiveExportSalesEntry(entry: ExportSalesEntry) {
  const result = await apiPost<{ ok: boolean; entry: unknown }>(`/billing/entries/exportSales/${entry.entryId}/archive`, {}, "tenant");
  return { ...result, entry: exportSalesEntrySchema.parse(result.entry) };
}

export async function restoreExportSalesEntry(entry: ExportSalesEntry) {
  const result = await apiPost<{ ok: boolean; entry: unknown }>(`/billing/entries/exportSales/${entry.entryId}/restore`, {}, "tenant");
  return { ...result, entry: exportSalesEntrySchema.parse(result.entry) };
}

export async function commentOnExportSalesEntry(entry: ExportSalesEntry, body: string) {
  const result = await apiPost<{ ok: boolean; entry: unknown }>(`/billing/entries/exportSales/${entry.entryId}/comments`, { body }, "tenant");
  return { ...result, entry: exportSalesEntrySchema.parse(result.entry) };
}

export async function runExportSalesEntryTool(entry: ExportSalesEntry, tool: string, value?: string) {
  const result = await apiPost<{ ok: boolean; entry: unknown }>(`/billing/entries/exportSales/${entry.entryId}/tools`, { tool, value }, "tenant");
  return { ...result, entry: exportSalesEntrySchema.parse(result.entry) };
}