import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Switch } from "@codexsun/ui/components/switch";
import { WorkspacePage } from "@codexsun/ui/workspace";
import { apiGet } from "../../pages/api";

type EntryKind = "quotation" | "sales" | "exportSales" | "purchase" | "receipt" | "payment";
type DocumentNumberKind = EntryKind;
type DocumentNumberEntryRecord = { documentNo: string };
type DocumentNumberSetting = {
  kind: DocumentNumberKind;
  label: string;
  prefix: string;
  nextNumber: string;
  suffix: string;
  padding: string;
  enabled: boolean;
};

const documentSettingsStorageKey = "codexsun_document_settings";
const defaultDocumentSettings: DocumentNumberSetting[] = [
  { kind: "quotation", label: "Quotation", prefix: "QUO", nextNumber: "1", suffix: "", padding: "4", enabled: true },
  { kind: "sales", label: "Sales", prefix: "SAL", nextNumber: "1", suffix: "", padding: "4", enabled: true },
  { kind: "exportSales", label: "Export Sales", prefix: "EXP", nextNumber: "1", suffix: "", padding: "4", enabled: true },
  { kind: "purchase", label: "Purchase", prefix: "PUR", nextNumber: "1", suffix: "", padding: "4", enabled: true },
  { kind: "receipt", label: "Receipt", prefix: "REC", nextNumber: "1", suffix: "", padding: "4", enabled: true },
  { kind: "payment", label: "Payment", prefix: "PAY", nextNumber: "1", suffix: "", padding: "4", enabled: true },
];

function readDocumentSettings(): DocumentNumberSetting[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(documentSettingsStorageKey) ?? "null") as DocumentNumberSetting[] | null;
    if (!Array.isArray(parsed)) return defaultDocumentSettings;
    return defaultDocumentSettings.map((setting) => ({ ...setting, ...(parsed.find((item) => item.kind === setting.kind) ?? {}) }));
  } catch {
    return defaultDocumentSettings;
  }
}

function saveDocumentSettings(settings: DocumentNumberSetting[]) {
  try {
    localStorage.setItem(documentSettingsStorageKey, JSON.stringify(settings));
  } catch {}
}

function documentKindForEntry(kind: EntryKind): DocumentNumberKind {
  return kind;
}

function syncDocumentSettingWithEntries(settings: DocumentNumberSetting[], kind: DocumentNumberKind, entries: DocumentNumberEntryRecord[]) {
  const current = settings.find((setting) => setting.kind === kind);
  if (!current) return settings;
  const configuredNext = Math.max(1, numberValue(current.nextNumber));
  const usedMax = entries
    .map((entry) => documentNumberValue(current, entry.documentNo))
    .reduce((max, value) => Math.max(max, value), 0);
  const nextNumber = Math.max(configuredNext, usedMax + 1);
  if (String(nextNumber) === current.nextNumber) return settings;
  return settings.map((setting) => setting.kind === kind ? { ...setting, nextNumber: String(nextNumber) } : setting);
}

function documentNumberValue(setting: DocumentNumberSetting, documentNo: string) {
  const text = documentNo.trim();
  const prefix = setting.prefix.trim();
  const suffix = setting.suffix.trim();
  let body = text;
  if (prefix) {
    if (!body.toLowerCase().startsWith(`${prefix.toLowerCase()}-`)) return 0;
    body = body.slice(prefix.length + 1);
  }
  if (suffix) {
    if (!body.toLowerCase().endsWith(`-${suffix.toLowerCase()}`)) return 0;
    body = body.slice(0, -(suffix.length + 1));
  }
  const parsed = Number(body.match(/\d+/)?.[0] ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function documentPreview(setting: DocumentNumberSetting) {
  const padding = Math.max(0, numberValue(setting.padding));
  const number = String(Math.max(0, numberValue(setting.nextNumber))).padStart(padding, "0");
  return [setting.prefix, number].filter(Boolean).join("-") + (setting.suffix ? `-${setting.suffix}` : "");
}

function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function DocumentSettingsPage() {
  const [records, setRecords] = useState<DocumentNumberSetting[]>(() => readDocumentSettings());
  const documentEntriesQuery = useQuery({
    queryKey: ["tenant", "entries", "document-settings", "all"],
    queryFn: async () => {
      const pairs = await Promise.all(
        (["quotation", "sales", "exportSales", "purchase", "receipt", "payment"] as EntryKind[]).map(async (kind) => [
          kind,
          await apiGet<DocumentNumberEntryRecord[]>(`/billing/entries/${kind}`, "tenant"),
        ] as const),
      );
      return Object.fromEntries(pairs) as Record<EntryKind, DocumentNumberEntryRecord[]>;
    },
  });

  useEffect(() => {
    if (!documentEntriesQuery.data) return;
    setRecords((current) => {
      const next = (["quotation", "sales", "exportSales", "purchase", "receipt", "payment"] as EntryKind[]).reduce(
        (settings, kind) => syncDocumentSettingWithEntries(settings, documentKindForEntry(kind), documentEntriesQuery.data[kind] ?? []),
        current,
      );
      if (next === current) return current;
      saveDocumentSettings(next);
      return next;
    });
  }, [documentEntriesQuery.data]);

  function publish() {
    saveDocumentSettings(records);
    toast.success("Document settings published");
  }

  function update(kind: DocumentNumberKind, patch: Partial<DocumentNumberSetting>) {
    setRecords((current) => {
      const next = current.map((record) => record.kind === kind ? { ...record, ...patch } : record);
      saveDocumentSettings(next);
      return next;
    });
  }

  return (
    <WorkspacePage
      title="Document Settings"
      description="Configure automatic document numbers for billing vouchers."
      actions={<Button type="button" className="h-9 rounded-md" onClick={publish}><Save className="size-4" />Publish live</Button>}
    >
      <div className="overflow-hidden rounded-md border border-border/70 bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead className="bg-muted/45">
              <tr className="border-b border-border/70 text-left text-xs font-semibold uppercase text-muted-foreground">
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Prefix</th>
                <th className="px-4 py-3">Next no</th>
                <th className="px-4 py-3">Suffix</th>
                <th className="px-4 py-3">Padding</th>
                <th className="px-4 py-3">Preview</th>
                <th className="px-4 py-3 text-right">Active</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.kind} className="border-b border-border/70 last:border-b-0">
                  <td className="px-4 py-3 font-medium">{record.label}</td>
                  <td className="px-4 py-2"><Input className="h-9 rounded-md" value={record.prefix} onChange={(event) => update(record.kind, { prefix: event.target.value.toUpperCase() })} /></td>
                  <td className="px-4 py-2"><Input className="h-9 rounded-md text-right tabular-nums" inputMode="numeric" value={record.nextNumber} onChange={(event) => update(record.kind, { nextNumber: event.target.value })} /></td>
                  <td className="px-4 py-2"><Input className="h-9 rounded-md" value={record.suffix} onChange={(event) => update(record.kind, { suffix: event.target.value.toUpperCase() })} /></td>
                  <td className="px-4 py-2"><Input className="h-9 rounded-md text-right tabular-nums" inputMode="numeric" value={record.padding} onChange={(event) => update(record.kind, { padding: event.target.value })} /></td>
                  <td className="px-4 py-3 font-mono text-xs">{documentPreview(record)}</td>
                  <td className="px-4 py-3 text-right"><Switch checked={record.enabled} onCheckedChange={(enabled) => update(record.kind, { enabled })} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </WorkspacePage>
  );
}
