import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowUpRight, ChevronLeft, ChevronRight, Download, Mail, MessageCircle, Paperclip, Pencil, Plus, Printer, RefreshCw, Save, Send, Settings2, Tag, Trash2, UserRound, X } from "lucide-react";
import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Dialog, DialogContent } from "@codexsun/ui/components/dialog";
import { Input } from "@codexsun/ui/components/input";
import { Switch } from "@codexsun/ui/components/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codexsun/ui/components/tabs";
import { Textarea } from "@codexsun/ui/components/textarea";
import { WorkspacePage } from "@codexsun/ui/workspace";
import { WorkspaceAnimatedTabs, type WorkspaceAnimatedTab } from "@codexsun/ui/workspace/animated-tabs";
import { WorkspaceDatePicker } from "@codexsun/ui/workspace/date-picker";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspaceLineTable, WorkspaceLineTableHeader } from "@codexsun/ui/workspace/line-table";
import { WorkspaceLookup, type WorkspaceLookupOption } from "@codexsun/ui/workspace/lookup";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import {
  WorkspaceFormBanner,
  WorkspaceFormField,
  WorkspaceFormFooter,
  WorkspaceFormGrid,
  WorkspaceFormPanel,
  WorkspaceUpsertPage,
} from "@codexsun/ui/workspace/upsert";
import { buildShowingLabel } from "@codexsun/ui/workspace/utils";
import { cn } from "@codexsun/ui/lib/utils";
import { ApiError } from "@codexsun/platform/api-client";
import { apiGet, apiPost, apiPut } from "../../api";
import { CommonRecordAutocomplete } from "../../components/CommonRecordAutocomplete";

export type EntryKind = "quotation" | "sales" | "purchase" | "receipt" | "payment";

type EntryLine = {
  lineId?: string;
  productId?: string | null;
  productName: string;
  description?: string | null;
  colour?: string | null;
  hsnCode?: string | null;
  poNo?: string | null;
  dcNo?: string | null;
  size?: string | null;
  unit?: string | null;
  quantity: number;
  rate: number;
  discountAmount: number;
  taxRate: number;
  taxAmount?: number;
  lineTotal?: number;
};

type EntryAllocation = {
  allocationId?: string;
  documentType: string;
  documentId?: string | null;
  documentNo: string;
  documentDate?: string | null;
  documentTotal: number;
  previousBalance: number;
  allocatedAmount: number;
  balanceAfterAllocation?: number;
};

type EntryRecord = {
  entryId: string;
  entryType: EntryKind;
  documentNo: string;
  documentDate: string;
  partyId?: string | null;
  partyName: string;
  partyType?: string | null;
  partyGstin?: string | null;
  partyStateCode?: string | null;
  partyStateName?: string | null;
  supplierBillNo?: string | null;
  supplierBillDate?: string | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  placeOfSupply?: string | null;
  referenceNo?: string | null;
  referenceDate?: string | null;
  dueDate?: string | null;
  ledgerName?: string | null;
  paymentMode?: string | null;
  subtotal: number;
  discountTotal: number;
  taxableTotal: number;
  taxTotal: number;
  roundOff: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  amount: number;
  tdsAmount: number;
  netAmount: number;
  allocatedAmount: number;
  unallocatedAmount: number;
  status: string;
  paymentStatus: string;
  notes?: string | null;
  terms?: string | null;
  irn?: string | null;
  ackNo?: string | null;
  ackDate?: string | null;
  signedQr?: string | null;
  ewayBillNo?: string | null;
  ewayBillDate?: string | null;
  transportName?: string | null;
  vehicleNo?: string | null;
  ewayPart?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lines: EntryLine[];
  allocations: EntryAllocation[];
  comments: Array<{ authorEmail: string; body: string; createdAt: string }>;
  activities: Array<{ activityType: string; actorEmail: string; message: string; createdAt: string }>;
};

type EntryForm = {
  entryId?: string;
  documentNo: string;
  documentDate: string;
  partyId: string;
  partyName: string;
  partyGstin: string;
  supplierBillNo: string;
  supplierBillDate: string;
  billingAddress: string;
  shippingAddress: string;
  placeOfSupply: string;
  referenceNo: string;
  referenceDate: string;
  dueDate: string;
  ledgerName: string;
  paymentMode: string;
  amount: string;
  tdsAmount: string;
  discountTotal: string;
  roundOff: string;
  paidAmount: string;
  status: string;
  paymentStatus: string;
  notes: string;
  terms: string;
  irn: string;
  ackNo: string;
  ackDate: string;
  signedQr: string;
  ewayBillNo: string;
  ewayBillDate: string;
  transportName: string;
  vehicleNo: string;
  ewayPart: string;
  lines: EntryLine[];
  allocations: EntryAllocation[];
};

type ViewState = { mode: "list" } | { mode: "show"; entry: EntryRecord } | { mode: "upsert"; entry: EntryRecord | null };

type ContactLookupRecord = {
  addressBook?: ContactAddressBookEntry[];
  contactId: string;
  code?: string;
  legalName?: string;
  name: string;
  gstin?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  status?: string;
};

type ContactAddressBookEntry = {
  addressLine1?: string;
  addressLine2?: string;
  addressTypeId?: string | null;
  cityId?: string | null;
  countryId?: string | null;
  districtId?: string | null;
  id?: string;
  isActive?: boolean;
  isDefault?: boolean;
  pincodeId?: string | null;
  stateId?: string | null;
  uuid?: string;
};

type ProductLookupRecord = {
  code: string;
  hsnCodeId?: string;
  itemId: string;
  name: string;
  openingPrice?: number;
  productTypeId?: string;
  status?: string;
  taxId?: string;
  unitId?: string;
};

type CommonLookupRecord = {
  address?: string;
  code?: string;
  contactNo?: string;
  contactPerson?: string;
  description?: string;
  countryId?: string | number;
  districtId?: string | number;
  gst?: string;
  id: string | number;
  isActive?: boolean;
  name?: string;
  ratePercent?: number;
  stateId?: string | number;
  vehicleNo?: string;
};

type SalesContactForm = {
  addressLine1: string;
  addressLine2: string;
  addressTypeId: string;
  cityId: string;
  code: string;
  countryId: string;
  districtId: string;
  email: string;
  gstin: string;
  legalName: string;
  name: string;
  phone: string;
  pincodeId: string;
  stateId: string;
};

type SalesProductForm = {
  code: string;
  hsnCodeId: string;
  isActive: boolean;
  name: string;
  productTypeId: string;
  taxId: string;
  unitId: string;
};

type ProductLookupDefinitionKey = "product-types" | "hsn-codes" | "units" | "taxes";
type SalesAttributeDefinitionKey = "colours" | "sizes";
type ProductLookupMaps = Record<ProductLookupDefinitionKey, Map<string, CommonLookupRecord>>;

type SalesSettingId = "sales-use-po" | "sales-use-dc" | "sales-use-colour" | "sales-use-size" | "sales-use-einvoice" | "sales-use-eway";
type SettingsScope = "client" | "industry";
type SettingsToggle = { id: string; label: string; description: string; scope: SettingsScope; enabled: boolean };
type LetterheadSettings = {
  addressColor: string;
  addressFontFamily: string;
  addressFontSize: number;
  borderColor: string;
  companyNameColor: string;
  companyNameFontFamily: string;
  companyNameFontSize: number;
  contactFontSize: number;
  heightMm: number;
  logoHeightMm: number;
  logoLeftMm: number;
  logoTopMm: number;
  logoWidthMm: number;
  taxFontSize: number;
};
type SalesSettingsState = {
  customise: SettingsToggle[];
  features: SettingsToggle[];
  gstApiMode: "einvoice_eway" | "eway_only";
  letterhead: LetterheadSettings;
  layout: Record<SalesSettingId, boolean>;
  printing: {
    customTerms: string;
    settings: SettingsToggle[];
  };
};

type DocumentNumberKind = "quotation" | "sales" | "exportSales" | "purchase" | "receipt" | "payment" | "cashBook" | "bankBook";
type DocumentNumberSetting = {
  kind: DocumentNumberKind;
  label: string;
  prefix: string;
  nextNumber: string;
  suffix: string;
  padding: string;
  enabled: boolean;
};

const defaultSalesSettings: SalesSettingsState = {
  customise: [
    { id: "billing-print-template", label: "Use textile invoice print template", description: "Keeps garment-style PO, DC, HSN, GST, and blank-line fitting controls ready.", scope: "industry", enabled: true },
    { id: "billing-shipping-address", label: "Show shipping address block", description: "Adds buyer shipping details beside billing details on sales and purchase bills.", scope: "client", enabled: true },
    { id: "billing-irn-qr", label: "Show IRN and QR area", description: "Reserves the e-invoice acknowledgement and QR position in the print header.", scope: "client", enabled: true },
  ],
  features: [
    { id: "feature-billing", label: "Billing", description: "Sales, purchase, receipt, payment, and report modules for simple billing.", scope: "industry", enabled: true },
    { id: "feature-quotation", label: "Quotation", description: "Shows Quotation entries and enables quotation consolidation into draft Sales invoices.", scope: "client", enabled: true },
    { id: "feature-export-sales", label: "Export Sales", description: "Shows Export Sales entries, totals, shortcuts, and document settings across the Billing desk.", scope: "client", enabled: true },
    { id: "sales-auto-post-accounts", label: "Auto post sales to accounts", description: "Posts saved sales invoices to accounting ledgers automatically. Turn off to save sales without ledger posting.", scope: "client", enabled: true },
    { id: "purchase-auto-post-accounts", label: "Auto post purchase to accounts", description: "Posts saved purchase bills to accounting ledgers automatically. Turn off to save purchase without ledger posting.", scope: "client", enabled: true },
    { id: "feature-tconnect", label: "TConnect", description: "Shows the TConnect trade connection workspace in the client app menu and landing desk.", scope: "client", enabled: false },
  ],
  gstApiMode: "einvoice_eway",
  letterhead: {
    addressColor: "#111111",
    addressFontFamily: "Times New Roman",
    addressFontSize: 12,
    borderColor: "#9ca3af",
    companyNameColor: "#000000",
    companyNameFontFamily: "Times New Roman",
    companyNameFontSize: 32,
    contactFontSize: 11,
    heightMm: 42,
    logoHeightMm: 24,
    logoLeftMm: 4,
    logoTopMm: 9,
    logoWidthMm: 28,
    taxFontSize: 11,
  },
  layout: {
    "sales-use-po": true,
    "sales-use-dc": true,
    "sales-use-colour": false,
    "sales-use-size": false,
    "sales-use-einvoice": true,
    "sales-use-eway": true,
  },
  printing: {
    customTerms: "",
    settings: [
      { id: "sales-print-with-logo", label: "Print with logo", description: "Shows the active company logo in the sales invoice print header.", scope: "client", enabled: true },
      { id: "sales-print-account-no", label: "Print account no", description: "Shows or hides the company bank account number in sales invoice bank details.", scope: "client", enabled: true },
      { id: "sales-print-qr-account-details", label: "Print QR account details", description: "Controls whether QR account details are enabled for sales invoice printing.", scope: "client", enabled: true },
    ],
  },
};

const salesSettingsStorageKey = "codexsun_sales_settings";
const documentSettingsStorageKey = "codexsun_document_settings";
const salesLayoutSettings: Array<{ id: SalesSettingId; label: string; description: string }> = [
  { id: "sales-use-po", label: "Use PO in sales", description: "Shows PO number on sales item entry and invoice item rows." },
  { id: "sales-use-dc", label: "Use DC in sales", description: "Shows DC number on sales item entry and invoice item rows." },
  { id: "sales-use-colour", label: "Use Colour in sales", description: "Shows colour on sales item entry and invoice item rows." },
  { id: "sales-use-size", label: "Use Size in sales", description: "Shows size on sales item entry and invoice item rows." },
  { id: "sales-use-einvoice", label: "Use E-invoice in sales", description: "Shows the E-invoice details tab on sales upsert." },
  { id: "sales-use-eway", label: "Use E-way in sales", description: "Shows the E-way details tab on sales upsert." },
];
const defaultDocumentSettings: DocumentNumberSetting[] = [
  { kind: "quotation", label: "Quotation", prefix: "QUO", nextNumber: "1", suffix: "", padding: "4", enabled: true },
  { kind: "sales", label: "Sales", prefix: "SAL", nextNumber: "1", suffix: "", padding: "4", enabled: true },
  { kind: "exportSales", label: "Export Sales", prefix: "EXP", nextNumber: "1", suffix: "", padding: "4", enabled: true },
  { kind: "purchase", label: "Purchase", prefix: "PUR", nextNumber: "1", suffix: "", padding: "4", enabled: true },
  { kind: "receipt", label: "Receipt", prefix: "REC", nextNumber: "1", suffix: "", padding: "4", enabled: true },
  { kind: "payment", label: "Payment", prefix: "PAY", nextNumber: "1", suffix: "", padding: "4", enabled: true },
  { kind: "cashBook", label: "Cash Book", prefix: "CB", nextNumber: "1", suffix: "", padding: "4", enabled: true },
  { kind: "bankBook", label: "Bank Book", prefix: "BB", nextNumber: "1", suffix: "", padding: "4", enabled: true },
];

const entryMeta: Record<EntryKind, {
  allocationDocumentType: string;
  description: string;
  label: string;
  newLabel: string;
  partyLabel: string;
  usesAllocations?: boolean;
}> = {
  quotation: { allocationDocumentType: "sales", description: "Create and review customer quotation entries.", label: "Quotation", newLabel: "New Quotation", partyLabel: "Customer" },
  sales: { allocationDocumentType: "sales", description: "Create and review sales invoices.", label: "Sales", newLabel: "New Sales", partyLabel: "Customer" },
  purchase: { allocationDocumentType: "purchase", description: "Create and review purchase bills.", label: "Purchase", newLabel: "New Purchase", partyLabel: "Supplier" },
  receipt: { allocationDocumentType: "sales", description: "Record customer receipts and allocations.", label: "Receipt", newLabel: "New Receipt", partyLabel: "Party", usesAllocations: true },
  payment: { allocationDocumentType: "purchase", description: "Record supplier payments and allocations.", label: "Payment", newLabel: "New Payment", partyLabel: "Party", usesAllocations: true },
};

const statusOptions = [
  { label: "Draft", value: "draft" },
  { label: "Posted", value: "posted" },
  { label: "Cancelled", value: "cancelled" },
];
const paymentStatusOptions = [
  { label: "Unpaid", value: "unpaid" },
  { label: "Partial", value: "partial" },
  { label: "Paid", value: "paid" },
];
const modeOptions = [
  { label: "Cash", value: "cash" },
  { label: "Bank", value: "bank" },
  { label: "UPI", value: "upi" },
  { label: "Cheque", value: "cheque" },
];
const supplyOptions = [
  { label: "CGST + SGST", value: "cgst-sgst" },
  { label: "IGST", value: "igst" },
];

export function EntryWorkspacePage({ kind }: { kind: EntryKind }) {
  const meta = entryMeta[kind];
  const queryClient = useQueryClient();
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [view, setView] = useState<ViewState>({ mode: "list" });
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const entriesQuery = useQuery({
    queryKey: ["tenant", "entries", kind],
    queryFn: () => apiGet<EntryRecord[]>(`/core/entries/${kind}`, "tenant"),
  });
  const saveMutation = useMutation({
    mutationFn: (input: EntryForm) => apiPost<{ ok: boolean; entry: EntryRecord }>(`/core/entries/${kind}/upsert`, payloadFromForm(kind, input), "tenant"),
    onSuccess: async (result, input) => {
      if (!input.entryId) advanceDocumentSetting(kind, result.entry.documentNo);
      await queryClient.invalidateQueries({ queryKey: ["tenant", "entries", kind] });
      toast.success(`${meta.label} saved`, { description: result.entry.documentNo });
      setView({ mode: "show", entry: result.entry });
    },
    onError: (error) => toast.error(`${meta.label} save failed`, { description: apiErrorText(error, "Could not save entry") }),
  });
  const archiveMutation = useMutation({
    mutationFn: (entry: EntryRecord) => apiPost<{ ok: boolean; entry: EntryRecord }>(`/core/entries/${kind}/${entry.entryId}/archive`, {}, "tenant"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tenant", "entries", kind] });
      setView({ mode: "list" });
    },
  });
  const restoreMutation = useMutation({
    mutationFn: (entry: EntryRecord) => apiPost<{ ok: boolean; entry: EntryRecord }>(`/core/entries/${kind}/${entry.entryId}/restore`, {}, "tenant"),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["tenant", "entries", kind] });
      setView({ mode: "show", entry: result.entry });
    },
  });
  const commentMutation = useMutation({
    mutationFn: ({ body, entry }: { body: string; entry: EntryRecord }) => apiPost<{ ok: boolean; entry: EntryRecord }>(`/core/entries/${kind}/${entry.entryId}/comments`, { body }, "tenant"),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["tenant", "entries", kind] });
      setView({ mode: "show", entry: result.entry });
    },
    onError: (error) => toast.error("Comment failed", { description: apiErrorText(error, "Could not add comment") }),
  });
  const toolMutation = useMutation({
    mutationFn: ({ entry, tool, value }: { entry: EntryRecord; tool: string; value?: string }) => apiPost<{ ok: boolean; entry: EntryRecord }>(`/core/entries/${kind}/${entry.entryId}/tools`, { tool, value }, "tenant"),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["tenant", "entries", kind] });
      setView({ mode: "show", entry: result.entry });
    },
    onError: (error) => toast.error("Entry tool failed", { description: apiErrorText(error, "Could not run tool") }),
  });

  const entries = entriesQuery.data ?? [];
  const filtered = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    return entries.filter((entry) => {
      if (statusFilter !== "all" && entry.status !== statusFilter) return false;
      if (!term) return true;
      return [entry.documentNo, entry.documentDate, entry.partyName, entry.referenceNo, entry.status, entry.paymentStatus]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [entries, searchValue, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const pageItems = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  if (view.mode === "show") {
    const entry = entries.find((item) => item.entryId === view.entry.entryId) ?? view.entry;
    return (
      <EntryShowPage
        entry={entry}
        kind={kind}
        onArchive={() => archiveMutation.mutate(entry)}
        onBack={() => setView({ mode: "list" })}
        onComment={(body) => commentMutation.mutate({ entry, body })}
        onEdit={() => setView({ mode: "upsert", entry })}
        onNew={() => setView({ mode: "upsert", entry: null })}
        onNext={() => {
          const index = entries.findIndex((item) => item.entryId === entry.entryId);
          const next = entries[index + 1];
          if (next) setView({ mode: "show", entry: next });
        }}
        onPrevious={() => {
          const index = entries.findIndex((item) => item.entryId === entry.entryId);
          const previous = entries[index - 1];
          if (previous) setView({ mode: "show", entry: previous });
        }}
        onRestore={() => restoreMutation.mutate(entry)}
        onTool={(tool, value) => toolMutation.mutate(value === undefined ? { entry, tool } : { entry, tool, value })}
      />
    );
  }

  if (view.mode === "upsert") {
    if (kind === "sales") {
      return (
        <SalesUpsertPage
          entry={view.entry}
          existingEntries={entries}
          loading={saveMutation.isPending}
          onBack={() => setView(view.entry ? { mode: "show", entry: view.entry } : { mode: "list" })}
          onSave={(form) => saveMutation.mutate(form)}
        />
      );
    }
    return (
      <EntryUpsertPage
        entry={view.entry}
        kind={kind}
        loading={saveMutation.isPending}
        onBack={() => setView(view.entry ? { mode: "show", entry: view.entry } : { mode: "list" })}
        onSave={(form) => saveMutation.mutate(form)}
      />
    );
  }

  return (
    <WorkspacePage
      title={meta.label}
      description={meta.description}
      actions={
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className="h-9 rounded-md" disabled={entriesQuery.isFetching} onClick={() => entriesQuery.refetch()}>
            <RefreshCw className={cn("size-4", entriesQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
          <Button type="button" className="h-9 rounded-md" onClick={() => setView({ mode: "upsert", entry: null })}>
            <Plus className="size-4" />
            {meta.newLabel}
          </Button>
        </div>
      }
    >
      <WorkspaceFilters
        filterOptions={[
          { id: "all", label: `All ${meta.label}` },
          ...statusOptions.map((option) => ({ id: option.value, label: option.label })),
        ]}
        filterValue={statusFilter}
        onFilterValueChange={(value: string) => { setStatusFilter(value); setCurrentPage(1); }}
        onSearchValueChange={(value: string) => { setSearchValue(value); setCurrentPage(1); }}
        searchValue={searchValue}
      />
      <div className="overflow-hidden rounded-md border border-border/70 bg-card/95 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-sm">
            <thead className="bg-muted/50">
              <tr>
                <TableHead>Document</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>{meta.partyLabel}</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Taxable</TableHead>
                <TableHead className="text-right">GST</TableHead>
                <TableHead className="text-right">Grand Total</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((entry) => (
                <tr key={entry.entryId} className="border-b border-border/70 last:border-b-0">
                  <td className="px-4 py-2">
                    <button type="button" className="font-semibold text-primary hover:underline" onClick={() => setView({ mode: "show", entry })}>
                      {entry.documentNo}
                    </button>
                    {entry.referenceNo ? <div className="text-xs text-muted-foreground">{entry.referenceNo}</div> : null}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{formatDate(entry.documentDate)}</td>
                  <td className="px-4 py-2">{entry.partyName}</td>
                  <td className="px-4 py-2"><WorkspaceStatusBadge label={entry.status} tone={entry.status === "posted" ? "success" : entry.status === "cancelled" ? "danger" : "warning"} /></td>
                  <td className="px-4 py-2"><WorkspaceStatusBadge label={entry.paymentStatus} tone={entry.paymentStatus === "paid" ? "success" : entry.paymentStatus === "partial" ? "warning" : "neutral"} /></td>
                  <td className="px-4 py-2 text-right tabular-nums">{money(entry.taxableTotal || entry.amount)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{money(entry.taxTotal)}</td>
                  <td className="px-4 py-2 text-right font-semibold tabular-nums">{money(entry.grandTotal || entry.netAmount)}</td>
                  <td className="px-4 py-2 text-muted-foreground">{formatDateTime(entry.updatedAt)}</td>
                  <td className="px-4 py-1.5 text-right">
                    <WorkspaceRowActions
                      title={entry.documentNo}
                      deleteLabel="Suspend"
                      isSuspended={!entry.isActive}
                      onView={() => setView({ mode: "show", entry })}
                      onEdit={() => setView({ mode: "upsert", entry })}
                      onDelete={() => archiveMutation.mutate(entry)}
                      onRestore={() => restoreMutation.mutate(entry)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!pageItems.length ? (
          <div className="px-6 py-14 text-center text-sm text-muted-foreground">
            {entriesQuery.isLoading ? "Loading entries..." : "No entries found."}
          </div>
        ) : null}
      </div>
      <WorkspacePagination
        page={currentPage}
        rowsPerPage={rowsPerPage}
        showingLabel={buildShowingLabel(currentPage, rowsPerPage, filtered.length)}
        singularLabel="entries"
        totalCount={filtered.length}
        totalPages={totalPages}
        onNextPage={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
        onPageChange={setCurrentPage}
        onPreviousPage={() => setCurrentPage((page) => Math.max(1, page - 1))}
        onRowsPerPageChange={(rows) => { setRowsPerPage(rows); setCurrentPage(1); }}
      />
    </WorkspacePage>
  );
}

function EntryShowPage({
  entry,
  kind,
  onArchive,
  onBack,
  onComment,
  onEdit,
  onNew,
  onNext,
  onPrevious,
  onRestore,
  onTool,
}: {
  entry: EntryRecord;
  kind: EntryKind;
  onArchive: () => void;
  onBack: () => void;
  onComment: (body: string) => void;
  onEdit: () => void;
  onNew: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onRestore: () => void;
  onTool: (tool: string, value?: string) => void;
}) {
  const meta = entryMeta[kind];
  const [printCopies, setPrintCopies] = useState<Array<"original" | "duplicate" | "office">>(["original"]);
  function togglePrintCopy(copy: "original" | "duplicate" | "office") {
    setPrintCopies((current) => current.includes(copy) ? current.filter((item) => item !== copy) : [...current, copy]);
  }
  return (
    <WorkspacePage
      title={kind === "sales" ? entry.partyName : `${meta.label} ${entry.documentNo}`}
      description={kind === "sales" ? entry.documentNo : `${meta.partyLabel}: ${entry.partyName}`}
      actions={
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Button type="button" variant="outline" className="h-9 rounded-md" onClick={onNew}><Plus className="size-4" />New</Button>
        </div>
      }
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" className="h-9 rounded-md" onClick={onBack}><ArrowLeft className="size-4" />Back</Button>
          <Button type="button" variant="outline" className="h-9 rounded-md" onClick={onPrevious}><ChevronLeft className="size-4" />Prev</Button>
          <Button type="button" variant="outline" className="h-9 rounded-md" onClick={onNext}><ChevronRight className="size-4" />Next</Button>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {kind === "sales" ? (
            <div className="flex min-h-9 flex-wrap items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-sm shadow-sm">
              {([
                ["original", "Original"],
                ["duplicate", "Duplicate"],
                ["office", "Office Copy"],
              ] as const).map(([value, label]) => (
                <label key={value} className="flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                  <input type="checkbox" className="size-3.5 accent-primary" checked={printCopies.includes(value)} onChange={() => togglePrintCopy(value)} />
                  {label}
                </label>
              ))}
            </div>
          ) : null}
          <Button type="button" className="h-9 rounded-md" onClick={() => window.print()}><Printer className="size-4" />Print</Button>
          <Button type="button" variant="outline" className="h-9 rounded-md" onClick={onEdit}><Pencil className="size-4" />Edit</Button>
          {entry.isActive ? (
            <Button type="button" variant="destructive" className="h-9 rounded-md" onClick={onArchive}><Trash2 className="size-4" />Suspend</Button>
          ) : (
            <Button type="button" variant="outline" className="h-9 rounded-md" onClick={onRestore}>Restore</Button>
          )}
        </div>
      </div>
      <div className="space-y-4 print:block">
        <PrintPreview entry={entry} kind={kind} printCopies={printCopies.length ? printCopies : ["original"]} />
        <EntryConversation entry={entry} onComment={onComment} onTool={onTool} />
      </div>
    </WorkspacePage>
  );
}

function PrintPreview({ entry, kind, printCopies = ["original"] }: { entry: EntryRecord; kind: EntryKind; printCopies?: Array<"original" | "duplicate" | "office"> }) {
  const meta = entryMeta[kind];
  const isMoneyEntry = meta.usesAllocations;
  const [settings] = useState<SalesSettingsState>(() => readSalesSettings());
  if (kind === "sales") {
    return (
      <div className="sales-print-root mx-auto grid w-fit max-w-full gap-4 rounded-md border border-border/70 bg-card p-3 shadow-sm print:block print:w-[210mm] print:max-w-none print:border-0 print:bg-white print:p-0 print:shadow-none">
        {printCopies.map((copy) => <SalesTaxInvoiceDocument key={copy} copy={copy} entry={entry} settings={settings} />)}
      </div>
    );
  }
  return (
    <div className="rounded-md border border-border/70 bg-card/95 p-6 shadow-sm print:border-0 print:bg-white print:p-0 print:shadow-none">
      <div className="mx-auto min-h-[920px] max-w-[820px] bg-white p-8 text-foreground shadow-sm ring-1 ring-border/70 print:min-h-0 print:max-w-none print:p-0 print:shadow-none print:ring-0">
        <div className="flex items-start justify-between gap-6 border-b border-border pb-5">
          <div>
            <div className="text-xs font-semibold uppercase text-muted-foreground">CODEXSUN</div>
            <h2 className="mt-2 text-2xl font-semibold">{meta.label}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{meta.description}</p>
          </div>
          <div className="text-right text-sm">
            <div className="text-lg font-semibold">{entry.documentNo}</div>
            <div className="text-muted-foreground">{formatDate(entry.documentDate)}</div>
            <div className="mt-2"><WorkspaceStatusBadge label={entry.status} tone={entry.status === "posted" ? "success" : entry.status === "cancelled" ? "danger" : "warning"} /></div>
          </div>
        </div>

        <div className="grid gap-5 border-b border-border py-5 md:grid-cols-2">
          <PrintBlock title={meta.partyLabel}>
            <p className="font-semibold">{entry.partyName}</p>
            {entry.partyGstin ? <p>GSTIN: {entry.partyGstin}</p> : null}
            {entry.billingAddress ? <p>{entry.billingAddress}</p> : null}
          </PrintBlock>
          <PrintBlock title="Reference">
            {entry.referenceNo ? <p>Ref: {entry.referenceNo}</p> : null}
            {entry.dueDate ? <p>Due: {formatDate(entry.dueDate)}</p> : null}
            {entry.supplierBillNo ? <p>Supplier bill: {entry.supplierBillNo}</p> : null}
            {entry.paymentMode ? <p>Mode: {entry.paymentMode}</p> : null}
          </PrintBlock>
        </div>

        {isMoneyEntry ? (
          <PrintAllocationTable allocations={entry.allocations} />
        ) : (
          <PrintLineTable lines={entry.lines} />
        )}

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_18rem]">
          <div className="text-sm text-muted-foreground">
            {entry.notes ? <p>{entry.notes}</p> : null}
            {entry.terms ? <p className="mt-3">{entry.terms}</p> : null}
          </div>
          <TotalsBox entry={entry} />
        </div>
      </div>
    </div>
  );
}

function SalesTaxInvoiceDocument({ copy, entry, settings }: { copy: "original" | "duplicate" | "office"; entry: EntryRecord; settings: SalesSettingsState }) {
  const isCgstSgst = entry.placeOfSupply !== "igst";
  const copyLabel = copy === "duplicate" ? "Duplicate" : copy === "office" ? "Office Copy" : "Original";
  const columns = salesPrintItemColumns(settings, isCgstSgst);
  const linePlan = getSalesPrintLinePlan(entry.lines);
  if (linePlan.requiresTwoPageTemplate) {
    const pages = getSalesPrintPagedLinePlan(entry.lines);
    return (
      <article className="sales-print-copy grid gap-4 print:block">
        {pages.map((page, pageIndex) => (
          <SalesTaxInvoicePage
            key={`sales-print-page-${pageIndex}`}
            columns={columns}
            copyLabel={`${copyLabel} - Page ${pageIndex + 1} of ${pages.length}`}
            entry={entry}
            isCgstSgst={isCgstSgst}
            isLastPage={pageIndex === pages.length - 1}
            rows={page.rows}
          />
        ))}
      </article>
    );
  }
  return (
    <article className="sales-print-copy">
      <SalesTaxInvoicePage columns={columns} copyLabel={copyLabel} entry={entry} isCgstSgst={isCgstSgst} isLastPage rows={linePlan.rows} />
    </article>
  );
}

function SalesTaxInvoicePage({
  columns,
  copyLabel,
  entry,
  isCgstSgst,
  isLastPage,
  rows,
}: {
  columns: SalesPrintItemColumn[];
  copyLabel: string;
  entry: EntryRecord;
  isCgstSgst: boolean;
  isLastPage: boolean;
  rows: SalesPrintLineRow[];
}) {
  return (
    <div className="sales-print-extended-page sales-invoice-print-sheet mx-auto h-[297mm] w-[210mm] max-w-full overflow-hidden bg-white p-[7mm] text-[9px] leading-tight text-black shadow-sm ring-1 ring-border/70 print:m-0 print:h-[297mm] print:w-[210mm] print:max-w-none print:p-[7mm] print:shadow-none print:ring-0">
      <div className="border border-neutral-300">
        <div className="relative border-b border-neutral-300 px-2 py-2 text-center">
          <div className="text-[12px] font-bold">TAX INVOICE</div>
          <div className="absolute right-2 top-2 text-[8px]">{copyLabel}</div>
        </div>
        <div className="relative min-h-[35mm] border-b border-neutral-300 px-4 py-3 text-center font-['Times_New_Roman',serif]">
          <div className="absolute left-4 top-6 flex size-16 items-center justify-center rounded-full border border-neutral-400 text-xl italic">CKF</div>
          <h2 className="text-[27px] font-bold leading-none">COTTON KNIT FASHIONS</h2>
          <p className="mt-3 text-[11px] leading-tight">8/1, TSR Layout, 4th street, Kongu Main Road<br />Tiruppur, Tiruppur -Dist, Tamil Nadu, India - 641607</p>
          <p className="text-[10px] leading-tight">Email: sam@hariyaexports.com Phone: 9944935395</p>
          <p className="text-[11px] font-bold leading-tight">GSTIN/UIN: 33ANKPS9182N1Z3</p>
        </div>
        <div className="grid grid-cols-2 border-b border-neutral-300">
          <div className="grid grid-cols-[24mm_1fr] px-2 py-1.5">
            <div>Invoice No:</div><div className="font-bold">{entry.documentNo}</div>
            <div>Date:</div><div className="font-bold">{formatDate(entry.documentDate)}</div>
            <div>Work Order:</div><div>{entry.referenceNo || "-"}</div>
          </div>
          <div className="border-l border-neutral-300 px-2 py-1.5">
            {entry.irn ? (
              <div className="grid grid-cols-[16mm_1fr] gap-1">
                <span className="font-bold">IRN :</span>
                <span className="break-all font-bold leading-tight">{entry.irn}</span>
              </div>
            ) : null}
            {entry.ackNo || entry.ackDate ? (
              <InlineInvoiceDetail leftLabel="Ack No.:" leftValue={entry.ackNo} rightLabel="Ack Date:" rightValue={entry.ackDate ? formatDate(entry.ackDate) : ""} />
            ) : null}
            {entry.ewayBillNo || entry.ewayBillDate ? (
              <InlineInvoiceDetail leftLabel="E-Way Bill No.:" leftValue={entry.ewayBillNo} rightLabel="Date:" rightValue={entry.ewayBillDate ? formatDate(entry.ewayBillDate) : ""} />
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-2 border-b border-neutral-300">
          <SalesPartyBlock title="Buyer (Bill to)" entry={entry} address={entry.billingAddress ?? null} />
          <SalesPartyBlock title="Buyer (Ship to)" entry={entry} address={entry.shippingAddress || entry.billingAddress || null} />
        </div>
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr className="bg-neutral-50">
              {columns.map((column) => <InvoiceTh key={column.key} className={column.widthClass}>{column.label}</InvoiceTh>)}
            </tr>
          </thead>
          <tbody>
            {!isLastPage ? <SalesCarryForwardRow columns={columns} label="Carry forward to next page" /> : null}
            {rows.map((row) => row.kind === "item"
              ? <SalesPrintItemRow key={`item-${row.index}`} columns={columns} index={row.index} isCgstSgst={isCgstSgst} line={row.line} />
              : <SalesPrintBlankRow key={`blank-${row.index}`} columns={columns} />)}
            {isLastPage ? <SalesPrintTotalRow columns={columns} entry={entry} isCgstSgst={isCgstSgst} /> : <SalesCarryForwardRow columns={columns} label="To be continued..." />}
          </tbody>
        </table>
        {isLastPage ? (
          <>
            <div className="grid grid-cols-[1fr_63mm] border-t border-neutral-300">
              <div className="min-h-[28mm] px-2 py-2">
                <p>We hereby certify that our registration under the GST Act 2017 is in force on the date on which sale of goods specified in this invoice is made by us and the sale is effected in the regular course of business.</p>
                <p className="mt-2 font-bold">* Goods once sold will not be taken back unless agreed in writing.</p>
                {entry.signedQr ? <p className="mt-2 break-all text-[8px]">Signed QR: {entry.signedQr}</p> : null}
              </div>
              <div className="border-l border-neutral-300">
                <InvoiceTotal label="Taxable Value" value={money(entry.taxableTotal)} />
                <InvoiceTotal label={isCgstSgst ? "Total CGST" : "Total IGST"} value={money(isCgstSgst ? entry.taxTotal / 2 : entry.taxTotal)} />
                {isCgstSgst ? <InvoiceTotal label="Total SGST" value={money(entry.taxTotal / 2)} /> : null}
                <InvoiceTotal label="Total GST" value={money(entry.taxTotal)} />
                <InvoiceTotal label="Round Off" value={money(entry.roundOff)} />
                <InvoiceTotal label="GRAND TOTAL" value={money(entry.grandTotal)} strong />
              </div>
            </div>
            <div className="border-t border-neutral-300 px-2 py-1">
              <span>Amount (in words)</span>
              <div className="font-bold">{amountWords(entry.grandTotal)}</div>
            </div>
            <div className="grid min-h-[23mm] grid-cols-2 border-t border-neutral-300">
              <div className="px-2 py-2">Receiver Sign</div>
              <div className="flex flex-col justify-between border-l border-neutral-300 px-2 py-2 font-bold">
                <div>For COTTON KNIT FASHIONS</div>
                <div>Authorised Signatory</div>
              </div>
            </div>
            <div className="border-t border-neutral-300 px-2 py-1 text-[8px] font-bold">Subject to Tiruppur Jurisdiction</div>
          </>
        ) : null}
      </div>
    </div>
  );
}

type SalesPrintItemColumnKey = "cgst" | "gstPercent" | "hsn" | "igst" | "poDc" | "product" | "quantity" | "rate" | "serial" | "sgst" | "taxable" | "total";
type SalesPrintItemColumn = { key: SalesPrintItemColumnKey; label: string; widthClass: string };
type SalesPrintLineRow =
  | { index: number; kind: "item"; line: EntryLine; lineCount: number }
  | { index: number; kind: "blank" };

const salesPrintMinimumItemLineBudget = 12;
const salesPrintExtendedItemOnlyLineBudget = 24;
const salesPrintFinalTotalsLineBudget = 11;

function salesPrintItemColumns(settings: SalesSettingsState, isCgstSgst: boolean): SalesPrintItemColumn[] {
  const showPo = settings.layout["sales-use-po"];
  const showDc = settings.layout["sales-use-dc"];
  const showPoDc = showPo || showDc;
  return [
    { key: "serial", label: "S.no", widthClass: "w-[9mm]" },
    { key: "product", label: "Particulars", widthClass: showPoDc ? "w-[40mm]" : "w-[50mm]" },
    { key: "hsn", label: "HSN", widthClass: "w-[13mm]" },
    ...(showPoDc ? [{ key: "poDc" as const, label: [showPo ? "PO" : null, showDc ? "DC" : null].filter(Boolean).join(" / "), widthClass: "w-[18mm]" }] : []),
    { key: "quantity", label: "Qty", widthClass: "w-[12mm]" },
    { key: "rate", label: "Rate", widthClass: "w-[15mm]" },
    { key: "taxable", label: "Taxable", widthClass: "w-[20mm]" },
    { key: "gstPercent", label: "GST %", widthClass: "w-[11mm]" },
    ...(isCgstSgst
      ? [{ key: "cgst" as const, label: "CGST", widthClass: "w-[16mm]" }, { key: "sgst" as const, label: "SGST", widthClass: "w-[16mm]" }]
      : [{ key: "igst" as const, label: "IGST", widthClass: "w-[22mm]" }]),
    { key: "total", label: "Total", widthClass: "w-[19mm]" },
  ];
}

function getSalesPrintLinePlan(lines: readonly EntryLine[]) {
  const lineBudget = salesPrintMinimumItemLineBudget;
  let usedLines = 0;
  let requiresTwoPageTemplate = false;
  const rows: SalesPrintLineRow[] = [];
  lines.forEach((line, index) => {
    const lineCount = getSalesItemPrintLineCount(line);
    if (usedLines + lineCount > lineBudget) {
      requiresTwoPageTemplate = true;
      return;
    }
    usedLines += lineCount;
    rows.push({ index, kind: "item", line, lineCount });
  });
  if (!requiresTwoPageTemplate) {
    for (let index = rows.length; usedLines < lineBudget; index += 1) {
      rows.push({ index, kind: "blank" });
      usedLines += 1;
    }
  }
  return { lineBudget, requiresTwoPageTemplate, rows, usedLines };
}

function getSalesPrintPagedLinePlan(lines: readonly EntryLine[]) {
  const pages: Array<{ lineBudget: number; rows: SalesPrintLineRow[]; startIndex: number; usedLines: number }> = [];
  let itemIndex = 0;
  while (lines.length - itemIndex > salesPrintFinalTotalsLineBudget) {
    const startIndex = itemIndex;
    const rows: SalesPrintLineRow[] = [];
    let usedLines = 0;
    while (itemIndex < lines.length && usedLines < salesPrintExtendedItemOnlyLineBudget) {
      const line = lines[itemIndex];
      if (!line) break;
      const lineCount = getSalesItemPrintLineCount(line);
      if (usedLines + lineCount > salesPrintExtendedItemOnlyLineBudget) break;
      rows.push({ index: itemIndex, kind: "item", line, lineCount });
      usedLines += lineCount;
      itemIndex += 1;
    }
    pages.push({ lineBudget: salesPrintExtendedItemOnlyLineBudget, rows, startIndex, usedLines });
  }

  const finalStartIndex = itemIndex;
  const finalRows: SalesPrintLineRow[] = [];
  let finalUsedLines = 0;
  while (itemIndex < lines.length && finalUsedLines < salesPrintFinalTotalsLineBudget) {
    const line = lines[itemIndex];
    if (!line) break;
    const lineCount = getSalesItemPrintLineCount(line);
    if (finalUsedLines + lineCount > salesPrintFinalTotalsLineBudget) break;
    finalRows.push({ index: itemIndex, kind: "item", line, lineCount });
    finalUsedLines += lineCount;
    itemIndex += 1;
  }
  for (let index = finalStartIndex + finalRows.length; finalUsedLines < salesPrintFinalTotalsLineBudget; index += 1) {
    finalRows.push({ index, kind: "blank" });
    finalUsedLines += 1;
  }
  pages.push({ lineBudget: salesPrintFinalTotalsLineBudget, rows: finalRows, startIndex: finalStartIndex, usedLines: finalUsedLines });
  return pages;
}

function getSalesItemPrintLineCount(_line: EntryLine) {
  return 1;
}

function SalesPrintItemRow({ columns, index, isCgstSgst, line }: { columns: SalesPrintItemColumn[]; index: number; isCgstSgst: boolean; line: EntryLine }) {
  const tax = salesTaxBreakup(line, isCgstSgst);
  const values: Record<SalesPrintItemColumnKey, ReactNode> = {
    cgst: money(tax.cgst),
    gstPercent: `${line.taxRate}%`,
    hsn: line.hsnCode || "-",
    igst: money(tax.igst),
    poDc: [line.poNo, line.dcNo].filter(Boolean).join(" / ") || "-",
    product: <><span className="font-bold">{line.productName}</span>{line.description ? ` - ${line.description}` : ""}</>,
    quantity: money(line.quantity).replace(".00", ""),
    rate: money(line.rate),
    serial: index + 1,
    sgst: money(tax.sgst),
    taxable: money(tax.taxable),
    total: money(tax.total),
  };
  const rightAligned = new Set<SalesPrintItemColumnKey>(["cgst", "igst", "quantity", "rate", "sgst", "taxable", "total"]);
  return (
    <tr className="h-[8mm] align-top">
      {columns.map((column) => (
        <InvoiceTd key={column.key} align={rightAligned.has(column.key) ? "right" : column.key === "product" ? "left" : "center"} className="border-b-0">{values[column.key]}</InvoiceTd>
      ))}
    </tr>
  );
}

function SalesPrintBlankRow({ columns }: { columns: SalesPrintItemColumn[] }) {
  return <tr className="h-[8mm]">{columns.map((column) => <InvoiceTd key={column.key} className="border-b-0">&nbsp;</InvoiceTd>)}</tr>;
}

function SalesCarryForwardRow({ columns, label }: { columns: SalesPrintItemColumn[]; label: string }) {
  return <tr className="font-bold"><InvoiceTd align="right" colSpan={columns.length}>{label}</InvoiceTd></tr>;
}

function SalesPrintTotalRow({ columns, entry, isCgstSgst }: { columns: SalesPrintItemColumn[]; entry: EntryRecord; isCgstSgst: boolean }) {
  const values: Partial<Record<SalesPrintItemColumnKey, ReactNode>> = {
    cgst: money(isCgstSgst ? entry.taxTotal / 2 : 0),
    igst: money(isCgstSgst ? 0 : entry.taxTotal),
    quantity: money(entry.lines.reduce((sum, line) => sum + numberValue(line.quantity), 0)).replace(".00", ""),
    sgst: money(isCgstSgst ? entry.taxTotal / 2 : 0),
    taxable: money(entry.taxableTotal),
    total: money(entry.grandTotal),
  };
  const quantityIndex = Math.max(1, columns.findIndex((column) => column.key === "quantity"));
  return (
    <tr className="font-bold">
      <InvoiceTd className="whitespace-nowrap border-t border-neutral-300 text-[8px]">E&amp;OE</InvoiceTd>
      {quantityIndex > 1 ? <InvoiceTd align="center" className="border-t border-neutral-300" colSpan={quantityIndex - 1}>Total</InvoiceTd> : null}
      {columns.slice(quantityIndex).map((column) => (
        <InvoiceTd key={column.key} align={["cgst", "igst", "quantity", "sgst", "taxable", "total"].includes(column.key) ? "right" : "center"} className="border-t border-neutral-300">
          {values[column.key] ?? ""}
        </InvoiceTd>
      ))}
    </tr>
  );
}

function InlineInvoiceDetail({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
}: {
  leftLabel: string;
  leftValue?: ReactNode;
  rightLabel: string;
  rightValue?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(70px,1fr)_auto_auto] gap-x-2 whitespace-nowrap font-bold leading-tight">
      <span>{leftLabel}</span>
      <span>{leftValue || "-"}</span>
      <span>{rightLabel}</span>
      <span>{rightValue || "-"}</span>
    </div>
  );
}

function SalesPartyBlock({ address, entry, title }: { address?: string | null; entry: EntryRecord; title: string }) {
  return (
    <div className="min-h-[18mm] border-r border-neutral-300 px-2 py-1 last:border-r-0">
      <div>{title}</div>
      <div className="font-bold">M/s. {entry.partyName}</div>
      <div>{address || "Address not set"}</div>
      <div>GSTIN/UIN : {entry.partyGstin || "-"}</div>
      <div>State Name : {entry.partyStateName || ""} <span className="ml-6">State Code : {entry.partyStateCode || ""}</span></div>
    </div>
  );
}

function EntryConversation({ entry, onComment, onTool }: { entry: EntryRecord; onComment: (body: string) => void; onTool: (tool: string, value?: string) => void }) {
  const [comment, setComment] = useState("");
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px] print:hidden">
      <div className="min-h-[280px] rounded-md border border-border/70 bg-card p-4 shadow-sm">
        <h3 className="text-lg font-semibold">Comments</h3>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">A</div>
          <Input className="h-10 rounded-md shadow-sm" placeholder="Type a reply / comment" value={comment} onChange={(event) => setComment(event.target.value)} />
          <Button type="button" className="h-10 rounded-md px-4" disabled={!comment.trim()} onClick={() => { onComment(comment); setComment(""); }}>Add</Button>
        </div>
        {entry.comments.length ? (
          <div className="mt-4 space-y-2">
            {entry.comments.map((item) => <SideNote key={`${item.authorEmail}-${item.createdAt}`} title={item.authorEmail} body={item.body} meta={formatDateTime(item.createdAt)} />)}
          </div>
        ) : null}
        <h3 className="mt-8 text-lg font-semibold">Activity</h3>
        <div className="relative mt-5 space-y-5 before:absolute before:left-[6px] before:top-1 before:h-[calc(100%-0.25rem)] before:border-l-2 before:border-border">
          {entry.activities.map((item) => (
            <div key={`${item.activityType}-${item.createdAt}-${item.message}`} className="relative pl-9 text-sm">
              <span className="absolute left-0 top-0.5 flex size-3.5 items-center justify-center rounded-full border border-muted-foreground/10 bg-muted-foreground/10 shadow-sm">
                <span className="size-1.5 rounded-full bg-muted-foreground" />
              </span>
              <span>{item.message}</span>
              <span className="text-muted-foreground"> - {formatDate(item.createdAt)}</span>
            </div>
          ))}
        </div>
      </div>
      <EntryTools onTool={onTool} />
    </div>
  );
}

function EntryTools({ onTool }: { onTool: (tool: string, value?: string) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const tools = [
    { icon: Mail, id: "email", label: "Send to Email", placeholder: "email@example.com" },
    { icon: UserRound, id: "assign", label: "Assign", placeholder: "Assignee" },
    { icon: Paperclip, id: "attachments", label: "Attachments", placeholder: "Attachment note" },
    { icon: Tag, id: "tags", label: "Tags", placeholder: "Tag" },
    { icon: MessageCircle, id: "whatsapp", label: "Send to WhatsApp", placeholder: "WhatsApp number" },
  ];
  return (
    <div className="h-fit rounded-md border border-border/70 bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border/70 px-3 py-3 text-sm font-semibold"><Settings2 className="size-4" />Entry tools</div>
      <div>
        {tools.map((tool) => {
          const Icon = tool.icon;
          const active = open === tool.id;
          return (
            <div key={tool.id} className="border-b border-border/70 last:border-b-0">
              <button type="button" className="flex w-full items-center justify-between px-3 py-3 text-left text-sm text-muted-foreground hover:bg-muted/40" onClick={() => { setOpen(active ? null : tool.id); setValue(""); }}>
                <span className="flex items-center gap-3"><Icon className="size-4" />{tool.label}</span>
                <Plus className="size-4" />
              </button>
              {active ? (
                <div className="grid gap-2 px-3 pb-3">
                  <Input className="h-9 rounded-md" placeholder={tool.placeholder} value={value} onChange={(event) => setValue(event.target.value)} />
                  <Button type="button" className="h-8 rounded-md" onClick={() => { onTool(tool.id, value); setOpen(null); setValue(""); }}>Add</Button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SideNote({ body, meta, title }: { body: string; meta: string; title: string }) {
  return (
    <div className="rounded-md border border-border/70 bg-muted/20 px-3 py-2 text-sm">
      <div className="font-medium">{title}</div>
      <div className="mt-1">{body}</div>
      <div className="mt-1 text-xs text-muted-foreground">{meta}</div>
    </div>
  );
}

function InvoiceTh({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={cn("box-border overflow-hidden border-b border-r border-neutral-300 px-1 py-2 text-center font-bold last:border-r-0", className)}>{children}</th>;
}

function InvoiceTd({ align = "left", children, className, colSpan }: { align?: "center" | "left" | "right"; children?: ReactNode; className?: string; colSpan?: number }) {
  return <td colSpan={colSpan} className={cn("box-border overflow-hidden break-words border-b border-r border-neutral-300 px-1 py-1 last:border-r-0", align === "center" && "text-center", align === "right" && "text-right tabular-nums", className)}>{children}</td>;
}

function InvoiceTotal({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  return <div className={cn("grid grid-cols-[1fr_24mm] border-b border-neutral-300 px-1.5 py-1 last:border-b-0", strong && "font-bold")}><span>{label}</span><span className="text-right tabular-nums">{value}</span></div>;
}

function SalesUpsertPage({
  entry,
  existingEntries,
  loading,
  onBack,
  onSave,
}: {
  entry: EntryRecord | null;
  existingEntries: EntryRecord[];
  loading: boolean;
  onBack: () => void;
  onSave: (form: EntryForm) => void;
}) {
  const [settings] = useState<SalesSettingsState>(() => readSalesSettings());
  const [form, setForm] = useState<EntryForm>(() => {
    const next = formFromEntry("sales", entry);
    return {
      ...next,
      documentNo: next.documentNo || nextDocumentNoForKind("sales", existingEntries),
      ledgerName: next.ledgerName || "Sales Account",
      placeOfSupply: next.placeOfSupply || "cgst-sgst",
      lines: entry?.lines?.length ? entry.lines : [],
    };
  });
  const [itemDraft, setItemDraft] = useState<EntryLine>(() => emptyLine());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState<"einvoice" | "eway" | null>(null);
  const [selectedContact, setSelectedContact] = useState<ContactLookupRecord | null>(null);
  const showPo = settings.layout["sales-use-po"];
  const showDc = settings.layout["sales-use-dc"];
  const showColour = settings.layout["sales-use-colour"];
  const showSize = settings.layout["sales-use-size"];
  const isCgstSgst = form.placeOfSupply !== "igst";
  const totals = calculateSalesTotals(form.lines, form.roundOff);

  function update(patch: Partial<EntryForm>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function updateDraft(patch: Partial<EntryLine>) {
    setItemDraft((current) => ({ ...current, ...patch }));
  }

  function addItem() {
    if (!itemDraft.productName.trim()) return;
    const nextLine = { ...itemDraft, quantity: numberValue(itemDraft.quantity) || 1, rate: numberValue(itemDraft.rate) };
    update({
      lines: editingIndex === null
        ? [...form.lines, nextLine]
        : form.lines.map((line, index) => index === editingIndex ? nextLine : line),
    });
    setItemDraft(emptyLine());
    setEditingIndex(null);
  }

  function editItem(index: number) {
    const line = form.lines[index];
    if (!line) return;
    setItemDraft({ ...line });
    setEditingIndex(index);
  }

  function deleteItem(index: number) {
    update({ lines: form.lines.filter((_, lineIndex) => lineIndex !== index) });
    if (editingIndex === index) {
      setItemDraft(emptyLine());
      setEditingIndex(null);
    }
  }

  function submit(printAfterSave = false) {
    const nextErrors = validateEntryForm("sales", form);
    if (isDuplicateDocumentNo(form.documentNo, existingEntries, form.entryId)) {
      nextErrors.documentNo = "Invoice no already exists for this tenant.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave({ ...form, status: printAfterSave ? "posted" : form.status });
    if (printAfterSave) window.setTimeout(() => window.print(), 300);
  }

  async function generateCompliance(type: "einvoice" | "eway") {
    const nextErrors = validateEntryForm("sales", form);
    if (type === "eway" && !form.irn.trim()) nextErrors.irn = "IRN is required before generating E-way bill.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setGenerating(type);
    const toastId = toast.loading(type === "einvoice" ? "Sending e-invoice request..." : "Sending E-way bill request...");
    try {
      const saved = await apiPost<{ ok: boolean; entry: EntryRecord }>(`/core/entries/sales/upsert`, payloadFromForm("sales", { ...form, status: "posted" }), "tenant");
      const savedEntry = saved.entry;
      setForm((current) => ({ ...current, entryId: savedEntry.entryId, status: savedEntry.status }));
      const action = type === "einvoice" ? "generate-irn" : "generate-eway";
      const result = await apiPost<{ ok: boolean; entry: EntryRecord; document?: Partial<EntryRecord> }>(
        `/core/entries/sales/${encodeURIComponent(savedEntry.entryId)}/compliance/${action}`,
        { payload: type === "einvoice" ? buildSalesEinvoicePayload({ ...form, entryId: savedEntry.entryId }) : buildSalesEwayPayload({ ...form, entryId: savedEntry.entryId, irn: savedEntry.irn ?? form.irn }) },
        "tenant",
      );
      const nextEntry = result.entry;
      setForm((current) => ({
        ...current,
        entryId: nextEntry.entryId,
        irn: nextEntry.irn ?? current.irn,
        ackNo: nextEntry.ackNo ?? current.ackNo,
        ackDate: normalizeDateValue(nextEntry.ackDate, current.ackDate),
        signedQr: nextEntry.signedQr ?? current.signedQr,
        ewayBillNo: nextEntry.ewayBillNo ?? current.ewayBillNo,
        ewayBillDate: normalizeDateValue(nextEntry.ewayBillDate, current.ewayBillDate),
        transportName: nextEntry.transportName ?? current.transportName,
        vehicleNo: nextEntry.vehicleNo ?? current.vehicleNo,
        ewayPart: nextEntry.ewayPart ?? current.ewayPart,
      }));
      toast.success(type === "einvoice" ? "E-invoice generated" : "E-way bill generated", { description: type === "einvoice" ? "WhiteBooks IRN details saved." : "WhiteBooks E-way details saved.", id: toastId });
    } catch (error) {
      toast.error(type === "einvoice" ? "E-invoice failed" : "E-way bill failed", { description: apiErrorText(error, "WhiteBooks request failed"), id: toastId });
    } finally {
      setGenerating(null);
    }
  }

  return (
    <WorkspacePage
      title={entry ? `Edit ${entry.documentNo}` : "New Sales"}
      description="Create or update a tenant-isolated sales voucher."
      actions={<Button type="button" variant="outline" className="h-9 rounded-md" onClick={onBack}><X className="size-4" />Cancel</Button>}
    >
      <div className="overflow-hidden rounded-md border border-border/70 bg-card shadow-sm">
        {Object.keys(errors).length ? (
          <div className="px-6 pt-5">
            <WorkspaceFormBanner title="Required fields">Fill the highlighted fields before saving.</WorkspaceFormBanner>
          </div>
        ) : null}
        <Tabs defaultValue="details">
          <TabsList className="h-auto w-full justify-start rounded-none border-b border-border/70 bg-card px-6 py-0.5">
            {[
              ["details", "Details"],
              ["address", "Address"],
              ...(settings.layout["sales-use-eway"] ? [["eway", "E-way"] as const] : []),
              ...(settings.gstApiMode !== "eway_only" && settings.layout["sales-use-einvoice"] ? [["einvoice", "E-invoice"] as const] : []),
              ["terms", "Terms"],
            ].map(([value, label]) => (
              <TabsTrigger key={value} value={value} className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="details" className="m-0">
            <div className="space-y-8 px-6 pb-8 pt-4">
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-5">
                  <PlainField label="Customer name *" error={errors.partyName}>
                    <ContactPicker
                      createEnabled
                      invalid={Boolean(errors.partyName)}
                      value={form.partyName}
                      onChange={(partyName, contact) => {
                        setSelectedContact(contact);
                        const billingAddress = contact ? contactAddressText(contact, "billing") || contactAddressText(contact) || form.billingAddress : form.billingAddress;
                        const shippingAddress = contact ? contactAddressText(contact, "shipping") || billingAddress || form.shippingAddress : form.shippingAddress;
                        update({
                          partyName,
                          partyId: contact?.contactId ?? form.partyId,
                          partyGstin: contact?.gstin ?? form.partyGstin,
                          billingAddress,
                          shippingAddress,
                        });
                      }}
                    />
                  </PlainField>
                  <PlainField label="Work Order no">
                    <WorkOrderAutocomplete value={form.referenceNo} onChange={(referenceNo) => update({ referenceNo })} />
                  </PlainField>
                  <PlainField label="Sales Ledger">
                    <SalesLedgerAutocomplete value={salesLedgerLabel(form.ledgerName)} onChange={(ledgerName) => update({ ledgerName })} />
                  </PlainField>
                </div>
                <div className="space-y-5">
                  <PlainField label="Invoice no" error={errors.documentNo}>
                    <Input className={inputClass(errors.documentNo)} value={form.documentNo} onChange={(event) => update({ documentNo: event.target.value })} />
                  </PlainField>
                  <PlainField label="Date" error={errors.documentDate}>
                    <WorkspaceDatePicker ariaLabel="Date" placeholder="Select date" value={form.documentDate} onValueChange={(documentDate) => update({ documentDate })} />
                  </PlainField>
                  <PlainField label="Sales tax type">
                    <WorkspaceSelect options={supplyOptions} value={form.placeOfSupply} onValueChange={(placeOfSupply) => update({ placeOfSupply })} />
                  </PlainField>
                </div>
              </div>
              <section className="space-y-5">
                <h2 className="text-lg font-semibold underline underline-offset-4">Sales Items</h2>
                <div className={cn("grid items-end gap-1 sm:grid-cols-2 lg:grid-cols-4", (showPo || showDc) ? "xl:grid-cols-[minmax(5rem,.42fr)_minmax(5rem,.42fr)_minmax(18rem,2fr)_minmax(11rem,1fr)_minmax(5rem,.45fr)_minmax(6rem,.55fr)_auto]" : "xl:grid-cols-[minmax(22rem,2.3fr)_minmax(14rem,1fr)_minmax(5rem,.45fr)_minmax(6rem,.55fr)_auto]")}>
                  {showPo ? <CompactInput label="PO" value={itemDraft.poNo ?? ""} onChange={(poNo) => updateDraft({ poNo })} /> : null}
                  {showDc ? <CompactInput label="DC" value={itemDraft.dcNo ?? ""} onChange={(dcNo) => updateDraft({ dcNo })} /> : null}
                  <CompactField label="Product name">
                    <ProductPicker
                      value={itemDraft.productName}
                      onChange={(productName, productLine) => updateDraft(productLine ? { ...productLine } : { productName })}
                    />
                  </CompactField>
                  <CompactInput label="Description" value={itemDraft.description ?? ""} onChange={(description) => updateDraft({ description })} />
                  {showColour ? (
                    <CompactField label="Colour">
                      <SalesAttributeLookup definitionKey="colours" label="Colour" placeholder="Search colour" value={itemDraft.colour ?? ""} onChange={(colour) => updateDraft({ colour })} />
                    </CompactField>
                  ) : null}
                  {showSize ? (
                    <CompactField label="Size">
                      <SalesAttributeLookup definitionKey="sizes" label="Size" placeholder="Search size" value={itemDraft.size ?? ""} onChange={(size) => updateDraft({ size })} />
                    </CompactField>
                  ) : null}
                  <CompactInput label="Quantity" numeric value={String(itemDraft.quantity)} onChange={(quantity) => updateDraft({ quantity: numberValue(quantity) })} />
                  <CompactInput label="Price" numeric value={String(itemDraft.rate)} onChange={(rate) => updateDraft({ rate: numberValue(rate) })} />
                  <div className="flex h-11 items-end gap-1">
                    <Button type="button" className="h-11 rounded-md px-3" disabled={!itemDraft.productName.trim()} onClick={addItem}>
                      {editingIndex === null ? <Plus className="size-4" /> : <Save className="size-4" />}
                      {editingIndex === null ? "Add" : "Update"}
                    </Button>
                  </div>
                </div>
                <SalesItemsPreviewTable
                  isCgstSgst={isCgstSgst}
                  items={form.lines}
                  showColour={showColour}
                  showDc={showDc}
                  showPo={showPo}
                  showSize={showSize}
                  onDelete={deleteItem}
                  onEdit={editItem}
                />
                <SalesTotalsFooter roundOff={form.roundOff} totals={totals} onRoundOffChange={(roundOff) => update({ roundOff })} />
              </section>
            </div>
          </TabsContent>
          <TabsContent value="address" className="m-0">
            <div className="grid gap-5 px-6 py-5 lg:grid-cols-2">
              <ContactAddressPicker
                addressKind="billing"
                contact={selectedContact}
                label="Billing address"
                value={form.billingAddress}
                onChange={(billingAddress) => update({ billingAddress })}
                onContactChange={(contact) => setSelectedContact(contact)}
              />
              <ContactAddressPicker
                addressKind="shipping"
                contact={selectedContact}
                label="Shipping address"
                value={form.shippingAddress}
                onChange={(shippingAddress) => update({ shippingAddress })}
                onContactChange={(contact) => setSelectedContact(contact)}
              />
              <PlainField label="GSTIN"><Input className="h-11 rounded-md" value={form.partyGstin} onChange={(event) => update({ partyGstin: event.target.value.toUpperCase() })} /></PlainField>
              <PlainField label="Due date"><WorkspaceDatePicker ariaLabel="Due date" placeholder="Select due date" value={form.dueDate} onValueChange={(dueDate) => update({ dueDate })} /></PlainField>
            </div>
          </TabsContent>
          <TabsContent value="eway" className="m-0">
            <SalesDocumentTab
              form={form}
              generating={generating === "eway"}
              type="eway"
              onGenerate={() => void generateCompliance("eway")}
              onUpdate={update}
            />
          </TabsContent>
          <TabsContent value="einvoice" className="m-0">
            <SalesDocumentTab
              form={form}
              generating={generating === "einvoice"}
              type="einvoice"
              onGenerate={() => void generateCompliance("einvoice")}
              onUpdate={update}
            />
          </TabsContent>
          <TabsContent value="terms" className="m-0">
            <div className="grid gap-5 px-6 py-5 lg:grid-cols-2">
              <PlainField label="Notes"><Textarea className="min-h-28 rounded-md" value={form.notes} onChange={(event) => update({ notes: event.target.value })} /></PlainField>
              <PlainField label="Terms"><Textarea className="min-h-28 rounded-md" value={form.terms} onChange={(event) => update({ terms: event.target.value })} /></PlainField>
            </div>
          </TabsContent>
        </Tabs>
        <div className="flex flex-wrap items-center gap-3 border-t border-border/70 bg-muted/20 px-6 py-4">
          <Button type="button" disabled={loading} className="rounded-md" onClick={() => submit(false)}>
            <Save className={cn("size-4", loading && "animate-spin")} />Save
          </Button>
          <Button type="button" disabled={loading} variant="secondary" className="rounded-md" onClick={() => submit(true)}>
            <Printer className="size-4" />Save & Print
          </Button>
          <Button type="button" variant="outline" className="rounded-md" onClick={onBack}><X className="size-4" />Cancel</Button>
        </div>
      </div>
    </WorkspacePage>
  );
}

function EntryUpsertPage({
  entry,
  kind,
  loading,
  onBack,
  onSave,
}: {
  entry: EntryRecord | null;
  kind: EntryKind;
  loading: boolean;
  onBack: () => void;
  onSave: (form: EntryForm) => void;
}) {
  const meta = entryMeta[kind];
  const [form, setForm] = useState<EntryForm>(() => formFromEntry(kind, entry));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hasErrors = Object.keys(errors).length > 0;

  function update(patch: Partial<EntryForm>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateEntryForm(kind, form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSave(form);
  }

  return (
    <WorkspaceUpsertPage
      title={entry ? `Edit ${meta.label}` : meta.newLabel}
      description={meta.description}
      onBack={onBack}
    >
      <form noValidate className="space-y-4" onSubmit={submit}>
        <WorkspaceFormPanel>
          {hasErrors ? (
            <WorkspaceFormBanner title="Required fields">Fill the highlighted fields before saving.</WorkspaceFormBanner>
          ) : null}
          <WorkspaceFormGrid columns={3}>
            <Field label="Document No" error={errors.documentNo}>
              <Input className={inputClass(errors.documentNo)} value={form.documentNo} onChange={(event) => update({ documentNo: event.target.value })} />
            </Field>
            <Field label="Date" required error={errors.documentDate}>
              <WorkspaceDatePicker ariaLabel="Date" placeholder="Select date" required value={form.documentDate} onValueChange={(documentDate) => update({ documentDate })} />
            </Field>
            <WorkspaceFormField label="Status">
              <WorkspaceSelect options={statusOptions} value={form.status} onValueChange={(status) => update({ status })} />
            </WorkspaceFormField>
            <WorkspaceFormField label={meta.partyLabel} required>
              <ContactPicker
                invalid={Boolean(errors.partyName)}
                value={form.partyName}
                onChange={(partyName, contact) => update({
                  partyName,
                  partyId: contact?.contactId ?? form.partyId,
                  partyGstin: contact?.gstin ?? form.partyGstin,
                })}
              />
              {errors.partyName ? <Helper>{errors.partyName}</Helper> : null}
            </WorkspaceFormField>
            <WorkspaceFormField label="GSTIN">
              <Input className="h-11 rounded-md" value={form.partyGstin} onChange={(event) => update({ partyGstin: event.target.value.toUpperCase() })} />
            </WorkspaceFormField>
            <WorkspaceFormField label="Reference No">
              <Input className="h-11 rounded-md" value={form.referenceNo} onChange={(event) => update({ referenceNo: event.target.value })} />
            </WorkspaceFormField>
            {kind === "purchase" ? (
              <>
                <WorkspaceFormField label="Supplier Bill No">
                  <Input className="h-11 rounded-md" value={form.supplierBillNo} onChange={(event) => update({ supplierBillNo: event.target.value })} />
                </WorkspaceFormField>
                <WorkspaceFormField label="Supplier Bill Date">
                  <WorkspaceDatePicker ariaLabel="Supplier Bill Date" placeholder="Select supplier bill date" value={form.supplierBillDate} onValueChange={(supplierBillDate) => update({ supplierBillDate })} />
                </WorkspaceFormField>
              </>
            ) : null}
            {meta.usesAllocations ? (
              <>
                <WorkspaceFormField label="Mode">
                  <WorkspaceSelect options={modeOptions} value={form.paymentMode} onValueChange={(paymentMode) => update({ paymentMode })} />
                </WorkspaceFormField>
                <Field label="Amount" required error={errors.amount}>
                  <Input className={inputClass(errors.amount)} type="number" value={form.amount} onChange={(event) => update({ amount: event.target.value })} />
                </Field>
                <WorkspaceFormField label="Ledger">
                  <Input className="h-11 rounded-md" value={form.ledgerName} onChange={(event) => update({ ledgerName: event.target.value })} />
                </WorkspaceFormField>
              </>
            ) : (
              <>
                <WorkspaceFormField label="Place of Supply">
                  <WorkspaceSelect options={supplyOptions} value={form.placeOfSupply} onValueChange={(placeOfSupply) => update({ placeOfSupply })} />
                </WorkspaceFormField>
                <WorkspaceFormField label="Payment Status">
                  <WorkspaceSelect options={paymentStatusOptions} value={form.paymentStatus} onValueChange={(paymentStatus) => update({ paymentStatus })} />
                </WorkspaceFormField>
                <WorkspaceFormField label="Paid Amount">
                  <Input className="h-11 rounded-md" type="number" value={form.paidAmount} onChange={(event) => update({ paidAmount: event.target.value })} />
                </WorkspaceFormField>
              </>
            )}
            <WorkspaceFormField label="Billing Address" className="md:col-span-2">
              <Textarea className="min-h-20 rounded-md" value={form.billingAddress} onChange={(event) => update({ billingAddress: event.target.value })} />
            </WorkspaceFormField>
            <WorkspaceFormField label="Shipping Address">
              <Textarea className="min-h-20 rounded-md" value={form.shippingAddress} onChange={(event) => update({ shippingAddress: event.target.value })} />
            </WorkspaceFormField>
          </WorkspaceFormGrid>
        </WorkspaceFormPanel>

        <WorkspaceFormPanel title={meta.usesAllocations ? "Allocations" : "Items"}>
          {meta.usesAllocations ? (
            <AllocationEditor
              allocations={form.allocations}
              documentType={meta.allocationDocumentType}
              onChange={(allocations) => update({ allocations })}
            />
          ) : (
            <LineEditor lines={form.lines} onChange={(lines) => update({ lines })} />
          )}
        </WorkspaceFormPanel>

        <WorkspaceFormPanel title="Notes and totals">
          <WorkspaceFormGrid columns={2}>
            <WorkspaceFormField label="Notes">
              <Textarea className="min-h-24 rounded-md" value={form.notes} onChange={(event) => update({ notes: event.target.value })} />
            </WorkspaceFormField>
            <WorkspaceFormField label="Terms">
              <Textarea className="min-h-24 rounded-md" value={form.terms} onChange={(event) => update({ terms: event.target.value })} />
            </WorkspaceFormField>
            <WorkspaceFormField label="Round Off">
              <Input className="h-11 rounded-md" type="number" value={form.roundOff} onChange={(event) => update({ roundOff: event.target.value })} />
            </WorkspaceFormField>
            {meta.usesAllocations ? (
              <>
                <WorkspaceFormField label="TDS">
                  <Input className="h-11 rounded-md" type="number" value={form.tdsAmount} onChange={(event) => update({ tdsAmount: event.target.value })} />
                </WorkspaceFormField>
                <WorkspaceFormField label="Discount">
                  <Input className="h-11 rounded-md" type="number" value={form.discountTotal} onChange={(event) => update({ discountTotal: event.target.value })} />
                </WorkspaceFormField>
              </>
            ) : null}
          </WorkspaceFormGrid>
        </WorkspaceFormPanel>

        <WorkspaceFormPanel>
          <WorkspaceFormFooter primaryLabel={loading ? "Saving..." : entry ? "Update" : "Save"} primaryLoading={loading} onCancel={onBack}>
            <Button type="button" variant="outline" className="rounded-md" onClick={() => window.print()}>
              <Printer className="size-4" />
              Print Preview
            </Button>
          </WorkspaceFormFooter>
        </WorkspaceFormPanel>
      </form>
    </WorkspaceUpsertPage>
  );
}

function LineEditor({ lines, onChange }: { lines: EntryLine[]; onChange: (lines: EntryLine[]) => void }) {
  const updateLine = (index: number, patch: Partial<EntryLine>) => onChange(lines.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line));
  return (
    <>
      <WorkspaceLineTableHeader label="Item lines" />
      <WorkspaceLineTable
        data={lines}
        rowKey={(line, index) => line.lineId ?? String(index)}
        minWidth="980px"
        onAdd={() => onChange([...lines, emptyLine()])}
        onDelete={(_, index) => onChange(lines.filter((__, lineIndex) => lineIndex !== index))}
        columns={[
          { header: "Product", width: "220px", render: (line, index) => <Input className="h-9 rounded-md" value={line.productName} onChange={(event) => updateLine(index, { productName: event.target.value })} /> },
          { header: "HSN", width: "120px", render: (line, index) => <Input className="h-9 rounded-md" value={line.hsnCode ?? ""} onChange={(event) => updateLine(index, { hsnCode: event.target.value })} /> },
          { header: "Unit", width: "120px", render: (line, index) => <CommonRecordAutocomplete definitionKey="units" value={line.unit ?? ""} onChange={(unit) => updateLine(index, { unit: unit ?? "" })} /> },
          { header: "Qty", width: "100px", render: (line, index) => <Input className="h-9 rounded-md" type="number" value={line.quantity} onChange={(event) => updateLine(index, { quantity: numberValue(event.target.value) })} /> },
          { header: "Rate", width: "120px", render: (line, index) => <Input className="h-9 rounded-md" type="number" value={line.rate} onChange={(event) => updateLine(index, { rate: numberValue(event.target.value) })} /> },
          { header: "Discount", width: "120px", render: (line, index) => <Input className="h-9 rounded-md" type="number" value={line.discountAmount} onChange={(event) => updateLine(index, { discountAmount: numberValue(event.target.value) })} /> },
          { header: "GST %", width: "110px", render: (line, index) => <Input className="h-9 rounded-md" type="number" value={line.taxRate} onChange={(event) => updateLine(index, { taxRate: numberValue(event.target.value) })} /> },
          { header: "Total", width: "120px", render: (line) => <span className="font-semibold tabular-nums">{money(lineTotal(line))}</span> },
        ]}
      />
    </>
  );
}

function AllocationEditor({ allocations, documentType, onChange }: { allocations: EntryAllocation[]; documentType: string; onChange: (allocations: EntryAllocation[]) => void }) {
  const updateAllocation = (index: number, patch: Partial<EntryAllocation>) => onChange(allocations.map((allocation, allocationIndex) => allocationIndex === index ? { ...allocation, ...patch } : allocation));
  return (
    <>
      <WorkspaceLineTableHeader label="Document allocations" />
      <WorkspaceLineTable
        data={allocations}
        rowKey={(allocation, index) => allocation.allocationId ?? String(index)}
        minWidth="820px"
        onAdd={() => onChange([...allocations, emptyAllocation(documentType)])}
        onDelete={(_, index) => onChange(allocations.filter((__, allocationIndex) => allocationIndex !== index))}
        columns={[
          { header: "Document No", width: "180px", render: (allocation, index) => <Input className="h-9 rounded-md" value={allocation.documentNo} onChange={(event) => updateAllocation(index, { documentNo: event.target.value })} /> },
          { header: "Date", width: "180px", render: (allocation, index) => <WorkspaceDatePicker ariaLabel="Allocation date" placeholder="Select date" value={normalizeDateValue(allocation.documentDate, "")} onValueChange={(documentDate) => updateAllocation(index, { documentDate })} /> },
          { header: "Total", width: "130px", render: (allocation, index) => <Input className="h-9 rounded-md" type="number" value={allocation.documentTotal} onChange={(event) => updateAllocation(index, { documentTotal: numberValue(event.target.value), previousBalance: numberValue(event.target.value) })} /> },
          { header: "Previous", width: "130px", render: (allocation, index) => <Input className="h-9 rounded-md" type="number" value={allocation.previousBalance} onChange={(event) => updateAllocation(index, { previousBalance: numberValue(event.target.value) })} /> },
          { header: "Allocated", width: "130px", render: (allocation, index) => <Input className="h-9 rounded-md" type="number" value={allocation.allocatedAmount} onChange={(event) => updateAllocation(index, { allocatedAmount: numberValue(event.target.value) })} /> },
          { header: "Balance", width: "120px", render: (allocation) => <span className="font-semibold tabular-nums">{money(allocation.previousBalance - allocation.allocatedAmount)}</span> },
        ]}
      />
    </>
  );
}

type ContactLookupOption = WorkspaceLookupOption & { contact: ContactLookupRecord };
type ProductLookupOption = WorkspaceLookupOption & { line: EntryLine; product: ProductLookupRecord };

function ProductPicker({
  onChange,
  value,
}: {
  onChange: (value: string, line: EntryLine | null) => void;
  value: string;
}) {
  const queryClient = useQueryClient();
  const productsQuery = useQuery({
    queryKey: ["tenant", "entry-product-lookup"],
    queryFn: () => apiGet<ProductLookupRecord[]>("/core/products", "tenant"),
  });
  const lookupsQuery = useProductLookupMaps();
  const options = useMemo<ProductLookupOption[]>(
    () =>
      (productsQuery.data ?? [])
        .filter((product) => product.status !== "archived")
        .map((product) => productOptionFromRecord(product, lookupsQuery.data)),
    [lookupsQuery.data, productsQuery.data],
  );

  return (
    <WorkspaceLookup
      allowTextValue
      createLabel="Create product"
      createDialogClassName="w-[min(56rem,calc(100vw-3rem))] max-w-none overflow-hidden p-0 duration-0 data-[state=open]:animate-none data-[state=closed]:animate-none"
      createMode="popup"
      loading={(productsQuery.isLoading || lookupsQuery.isLoading) && options.length === 0}
      options={options}
      value={value}
      renderCreateForm={({ initialName, onCancel, onCreated }) => (
        <SalesProductCreateForm
          initialName={initialName}
          onCancel={onCancel}
          onCreated={(product, lookupMaps) => {
            void queryClient.invalidateQueries({ queryKey: ["tenant", "entry-product-lookup"] });
            void queryClient.invalidateQueries({ queryKey: ["tenant", "products"] });
            onCreated(productOptionFromRecord(product, lookupMaps));
          }}
        />
      )}
      onTextChange={(nextValue) => onChange(nextValue, null)}
      onValueChange={(nextValue, option) => {
        const productOption = option as ProductLookupOption | undefined;
        onChange(option?.label ?? nextValue, productOption?.line ?? null);
      }}
    />
  );
}

function SalesProductCreateForm({
  initialName,
  onCancel,
  onCreated,
}: {
  initialName: string;
  onCancel: () => void;
  onCreated: (product: ProductLookupRecord, lookupMaps: ProductLookupMaps) => void;
}) {
  const queryClient = useQueryClient();
  const lookupsQuery = useProductLookupMaps();
  const [form, setForm] = useState<SalesProductForm>(() => emptySalesProductForm(initialName));
  const [error, setError] = useState<string | null>(null);
  const saveMutation = useMutation({
    mutationFn: async () => {
      const name = form.name.trim();
      if (!name) throw new Error("Product name is required");
      return apiPost<ProductLookupRecord>("/core/products", {
        code: form.code.trim() || codeFromName(name),
        name,
        productTypeId: optional(form.productTypeId),
        hsnCodeId: optional(form.hsnCodeId),
        unitId: optional(form.unitId),
        taxId: optional(form.taxId),
        openingPrice: 0,
        openingStock: 0,
      }, "tenant");
    },
    onError: (saveError) => setError(apiErrorText(saveError, "Could not save product")),
    onSuccess: async (product) => {
      toast.success("Product created", { description: product.name });
      const lookupMaps = await queryClient.fetchQuery({
        queryKey: ["tenant", "product-lookup-maps"],
        queryFn: fetchProductLookupMaps,
      });
      onCreated(product, lookupMaps);
    },
  });

  useEffect(() => {
    setForm((current) => current.code ? current : { ...current, code: codeFromName(current.name) });
  }, []);

  function update(patch: Partial<SalesProductForm>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  return (
    <div className="grid h-[29rem] grid-rows-[auto_1fr_auto] overflow-hidden rounded-md bg-card">
      <div className="border-b border-border/70 px-6 py-4">
        <h2 className="text-base font-semibold">Create product</h2>
      </div>
      <div className="min-h-0 overflow-y-auto px-6 py-5">
        {error ? <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div> : null}
        <div className="grid items-end gap-4 md:grid-cols-2">
          <PlainField label="Name *"><Input className="h-11 rounded-md" value={form.name} onChange={(event) => update({ name: event.target.value })} /></PlainField>
          <PlainField label="Code"><Input className="h-11 rounded-md" value={form.code} onChange={(event) => update({ code: event.target.value.toUpperCase() })} /></PlainField>
          <PlainField label="Product Type">
            <ProductCommonLookup definitionKey="product-types" placeholder="Search product type" value={form.productTypeId} onChange={(productTypeId) => update({ productTypeId })} />
          </PlainField>
          <PlainField label="HSN Code">
            <ProductCommonLookup definitionKey="hsn-codes" placeholder="Search hsn code" value={form.hsnCodeId} onChange={(hsnCodeId) => update({ hsnCodeId })} />
          </PlainField>
          <PlainField label="Unit">
            <ProductCommonLookup definitionKey="units" placeholder="Search unit" value={form.unitId} onChange={(unitId) => update({ unitId })} />
          </PlainField>
          <PlainField label="GST %">
            <ProductCommonLookup definitionKey="taxes" placeholder="Search gst %" value={form.taxId} onChange={(taxId) => update({ taxId })} />
          </PlainField>
          <div className="flex h-11 items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-4 text-sm font-medium md:col-span-1">
            <span>Active</span>
            <Switch checked={form.isActive} onCheckedChange={(isActive) => update({ isActive })} />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border/70 bg-muted/20 px-6 py-4">
        <Button type="button" variant="outline" className="rounded-md" disabled={saveMutation.isPending} onClick={onCancel}>Cancel</Button>
        <Button type="button" disabled={saveMutation.isPending || !form.name.trim()} className="rounded-md" onClick={() => saveMutation.mutate()}>
          <Save className={cn("size-4", saveMutation.isPending && "animate-spin")} />Save
        </Button>
      </div>
    </div>
  );
}

function ProductCommonLookup({
  definitionKey,
  onChange,
  placeholder,
  value,
}: {
  definitionKey: ProductLookupDefinitionKey;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  const queryClient = useQueryClient();
  const recordsQuery = useQuery({
    queryKey: ["tenant", "common-lookup", definitionKey],
    queryFn: () => apiGet<CommonLookupRecord[]>(`/core/common/records?definitionKey=${definitionKey}`, "tenant"),
  });
  const options = useMemo<WorkspaceLookupOption[]>(
    () =>
      (recordsQuery.data ?? [])
        .filter((record) => record.isActive !== false)
        .map((record) => commonOptionFromRecord(record)),
    [recordsQuery.data],
  );

  return (
    <WorkspaceLookup
      allowTextValue={false}
      createLabel="Create"
      createMode="inline"
      dropdownMode="portal"
      loading={recordsQuery.isLoading && options.length === 0}
      options={options}
      placeholder={placeholder}
      value={value}
      onCreate={async (name) => {
        const created = await apiPost<CommonLookupRecord>("/core/common/records", {
          definitionKey,
          name,
          ...createPayloadForProductLookup(definitionKey, name),
        }, "tenant");
        void queryClient.invalidateQueries({ queryKey: ["tenant", "common-lookup", definitionKey] });
        void queryClient.invalidateQueries({ queryKey: ["tenant", "product-lookup-maps"] });
        return commonOptionFromRecord(created);
      }}
      onValueChange={(nextValue, option) => onChange(option ? nextValue : "")}
    />
  );
}

function SalesAttributeLookup({
  definitionKey,
  label,
  onChange,
  placeholder,
  value,
}: {
  definitionKey: SalesAttributeDefinitionKey;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  const queryClient = useQueryClient();
  const recordsQuery = useQuery({
    queryKey: ["tenant", "common-lookup", definitionKey],
    queryFn: () => apiGet<CommonLookupRecord[]>(`/core/common/records?definitionKey=${definitionKey}`, "tenant"),
  });
  const options = useMemo<WorkspaceLookupOption[]>(
    () =>
      (recordsQuery.data ?? [])
        .filter((record) => record.isActive !== false)
        .map((record) => {
          const optionLabel = commonLookupLabel(record) || String(record.id);
          return {
            value: optionLabel,
            label: optionLabel,
            ...(record.code ? { description: String(record.code) } : {}),
          };
        }),
    [recordsQuery.data],
  );

  return (
    <WorkspaceLookup
      allowTextValue={false}
      createLabel={`Create ${label}`}
      createMode="inline"
      dropdownMode="portal"
      loading={recordsQuery.isLoading && options.length === 0}
      options={options}
      placeholder={placeholder}
      value={value}
      onCreate={async (name) => {
        const created = await apiPost<CommonLookupRecord>("/core/common/records", {
          definitionKey,
          name,
        }, "tenant");
        void queryClient.invalidateQueries({ queryKey: ["tenant", "common-lookup", definitionKey] });
        const optionLabel = commonLookupLabel(created) || name.trim();
        toast.success(`${label} created`, { description: optionLabel });
        return { value: optionLabel, label: optionLabel };
      }}
      onValueChange={(nextValue, option) => onChange(option ? option.label : nextValue)}
    />
  );
}

function ContactPicker({
  createEnabled = false,
  invalid,
  onChange,
  value,
}: {
  createEnabled?: boolean;
  invalid: boolean;
  onChange: (value: string, contact: ContactLookupRecord | null) => void;
  value: string;
}) {
  const queryClient = useQueryClient();
  const [editContact, setEditContact] = useState<ContactLookupRecord | null>(null);
  const contactsQuery = useQuery({
    queryKey: ["tenant", "entry-contact-lookup"],
    queryFn: () => apiGet<ContactLookupRecord[]>("/core/contacts", "tenant"),
  });
  const options = useMemo<ContactLookupOption[]>(
    () =>
      (contactsQuery.data ?? [])
        .filter((contact) => contact.status !== "archived")
        .map((contact) => ({
          value: contact.name,
          label: contact.name,
          ...(contact.code ? { description: contact.code } : {}),
          meta: [contact.gstin, contact.primaryPhone].filter(Boolean).join(" | "),
          contact,
        })),
    [contactsQuery.data],
  );
  const selectedContact = useMemo(
    () => options.find((option) => option.label.toLowerCase() === value.trim().toLowerCase())?.contact ?? null,
    [options, value],
  );

  return (
    <>
      <WorkspaceLookup
        allowTextValue
        createLabel="Create contact"
        createDialogClassName="w-[min(62rem,calc(100vw-3rem))] max-w-none overflow-hidden p-0 duration-0 data-[state=open]:animate-none data-[state=closed]:animate-none"
        createMode={createEnabled ? "popup" : "none"}
        invalid={invalid}
        loading={contactsQuery.isLoading}
        options={options}
        trailingAction={selectedContact ? (
          <button
            aria-label={`Edit contact ${selectedContact.name}`}
            className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-sky-50 hover:text-sky-600"
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              event.preventDefault();
              setEditContact(selectedContact);
            }}
          >
            <ArrowUpRight className="size-4" />
          </button>
        ) : undefined}
        value={value}
        {...(createEnabled ? {
          renderCreateForm: ({ initialName, onCancel, onCreated }) => (
            <SalesContactCreateForm
              initialName={initialName}
              onCancel={onCancel}
              onCreated={async (contact) => {
                await queryClient.invalidateQueries({ queryKey: ["tenant", "entry-contact-lookup"] });
                const option: ContactLookupOption = {
                  value: contact.name,
                  label: contact.name,
                  ...(contact.code ? { description: contact.code } : {}),
                  meta: [contact.gstin, contact.primaryPhone].filter(Boolean).join(" | "),
                  contact,
                };
                onCreated(option);
              }}
            />
          ),
        } : {})}
        onTextChange={(nextValue) => onChange(nextValue, null)}
        onValueChange={(nextValue, option) => {
          const contact = (option as ContactLookupOption | undefined)?.contact ?? null;
          onChange(option?.label ?? nextValue, contact);
        }}
      />
      <SalesContactDialog
        contact={editContact}
        initialTab="details"
        open={Boolean(editContact)}
        onOpenChange={(open) => { if (!open) setEditContact(null); }}
        onSaved={async (contact) => {
          await queryClient.invalidateQueries({ queryKey: ["tenant", "entry-contact-lookup"] });
          onChange(contact.name, contact);
        }}
      />
    </>
  );
}

function ContactAddressPicker({
  addressKind,
  contact,
  label,
  onChange,
  onContactChange,
  value,
}: {
  addressKind: "billing" | "shipping";
  contact: ContactLookupRecord | null;
  label: string;
  onChange: (value: string) => void;
  onContactChange: (contact: ContactLookupRecord) => void;
  value: string;
}) {
  const queryClient = useQueryClient();
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const options = useMemo<WorkspaceLookupOption[]>(
    () => contactAddressOptions(contact, addressKind),
    [addressKind, contact],
  );
  const createLabel = contact ? `Create ${addressKind} address` : "Select contact first";

  return (
    <>
      <PlainField label={label}>
        <div className="grid gap-2">
        <WorkspaceLookup
          allowTextValue
          createLabel={createLabel}
          createMode={contact ? "inline" : "none"}
          dropdownMode="portal"
          emptyLabel={contact ? "No saved address. Type one and create it." : "Select a customer to use saved addresses."}
          options={options}
          placeholder={contact ? `Search or create ${addressKind} address` : "Select contact first"}
          value={value}
          onCreate={async (addressText) => {
            if (!contact) {
              toast.error("Select a customer before creating an address.");
              return { value: addressText, label: addressText };
            }
            const text = addressText.trim();
            if (!text) throw new Error("Address is required");
            const updated = await apiPut<ContactLookupRecord>(`/core/contacts/${encodeURIComponent(contact.contactId)}`, {
              addressBook: [
                ...(contact.addressBook ?? []).map((address) => ({ ...address, isDefault: address.isDefault ?? false, isActive: address.isActive ?? true })),
                {
                  addressLine1: text,
                  addressLine2: "",
                  addressTypeId: addressKind,
                  cityId: "",
                  countryId: "",
                  districtId: "",
                  isActive: true,
                  isDefault: !(contact.addressBook ?? []).some((address) => address.isDefault),
                  pincodeId: "",
                  stateId: "",
                },
              ],
            }, "tenant");
            await queryClient.invalidateQueries({ queryKey: ["tenant", "entry-contact-lookup"] });
            onContactChange(updated);
            onChange(text);
            toast.success(`${label} created`, { description: updated.name });
            return { value: text, label: text };
          }}
          onTextChange={onChange}
          onValueChange={(nextValue, option) => onChange(option?.label ?? nextValue)}
        />
        <div className="flex items-center justify-between gap-2 text-xs">
          <button
            className="inline-flex items-center gap-1 rounded-sm text-muted-foreground transition-colors hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
            type="button"
            disabled={!value}
            onClick={() => onChange("")}
          >
            <X className="size-3.5" />
            Clear
          </button>
          <button
            className="inline-flex items-center gap-1 rounded-sm text-muted-foreground transition-colors hover:text-sky-600 disabled:pointer-events-none disabled:opacity-50"
            type="button"
            disabled={!contact}
            onClick={() => setIsContactDialogOpen(true)}
          >
            <ArrowUpRight className="size-3.5" />
            Open contact address
          </button>
        </div>
        </div>
      </PlainField>
      <SalesContactDialog
        contact={contact}
        initialTab="address"
        open={Boolean(contact && isContactDialogOpen)}
        onOpenChange={(open) => setIsContactDialogOpen(open)}
        onSaved={async (updated) => {
          await queryClient.invalidateQueries({ queryKey: ["tenant", "entry-contact-lookup"] });
          onContactChange(updated);
          onChange(contactAddressText(updated, addressKind) || contactAddressText(updated) || value);
        }}
      />
    </>
  );
}

function WorkOrderAutocomplete({ onChange, value }: { onChange: (value: string) => void; value: string }) {
  const queryClient = useQueryClient();
  const recordsQuery = useQuery({
    queryKey: ["tenant", "common-lookup", "work-orders"],
    queryFn: () => apiGet<CommonLookupRecord[]>("/core/common/records?definitionKey=work-orders", "tenant"),
  });
  const options = useMemo<WorkspaceLookupOption[]>(
    () =>
      (recordsQuery.data ?? [])
        .filter((record) => record.isActive !== false)
        .map((record) => {
          const label = commonLookupLabel(record) || String(record.code ?? record.id);
          return {
            value: label,
            label,
            ...(record.code ? { description: String(record.code) } : {}),
            ...(record.description && record.description !== label ? { meta: String(record.description) } : {}),
          };
        }),
    [recordsQuery.data],
  );

  return (
    <WorkspaceLookup
      allowTextValue
      createLabel="Create work order"
      createMode="inline"
      dropdownMode="portal"
      emptyLabel="No work orders found."
      loading={recordsQuery.isLoading && options.length === 0}
      options={options}
      placeholder="Search or create work order"
      value={value}
      onCreate={async (name) => {
        const created = await apiPost<CommonLookupRecord>("/core/common/records", {
          definitionKey: "work-orders",
          name,
          code: codeFromName(name),
          description: `${name} work order`,
        }, "tenant");
        await queryClient.invalidateQueries({ queryKey: ["tenant", "common-lookup", "work-orders"] });
        const label = commonLookupLabel(created) || name.trim();
        toast.success("Work order created", { description: label });
        return { value: label, label, ...(created.code ? { description: String(created.code) } : {}) };
      }}
      onTextChange={onChange}
      onValueChange={(nextValue, option) => onChange(option?.label ?? nextValue)}
    />
  );
}

function SalesLedgerAutocomplete({ onChange, value }: { onChange: (value: string) => void; value: string }) {
  const queryClient = useQueryClient();
  const recordsQuery = useQuery({
    queryKey: ["tenant", "common-lookup", "sales-account-types"],
    queryFn: () => apiGet<CommonLookupRecord[]>("/core/common/records?definitionKey=sales-account-types", "tenant"),
  });
  const options = useMemo<WorkspaceLookupOption[]>(() => {
    const records = (recordsQuery.data ?? [])
      .filter((record) => record.isActive !== false)
      .map((record) => {
        const label = String(record.name ?? record.description ?? record.code ?? record.id);
        return { value: label, label, ...(record.description ? { description: String(record.description) } : {}) };
      });
    return records.some((option) => option.label === "Normal Sales")
      ? records
      : [{ value: "Normal Sales", label: "Normal Sales", description: "Default normal sales ledger." }, ...records];
  }, [recordsQuery.data]);

  return (
    <WorkspaceLookup
      allowTextValue
      createLabel="Create sales ledger"
      createMode="inline"
      loading={recordsQuery.isLoading && options.length === 0}
      options={options}
      value={value}
      onCreate={async (name) => {
        const created = await apiPost<CommonLookupRecord>("/core/common/records", {
          definitionKey: "sales-account-types",
          name,
          description: `${name} sales ledger.`,
        }, "tenant");
        void queryClient.invalidateQueries({ queryKey: ["tenant", "common-lookup", "sales-account-types"] });
        const label = String(created.name ?? name);
        return { value: label, label };
      }}
      onTextChange={onChange}
      onValueChange={(nextValue, option) => onChange(option?.label ?? nextValue)}
    />
  );
}

function AddressLookup({
  createPayload,
  definitionKey,
  onChange,
  parentFilter,
  placeholder,
  value,
}: {
  createPayload?: ((name: string) => Record<string, unknown>) | undefined;
  definitionKey: string;
  onChange: (value: string) => void;
  parentFilter?: Record<string, string> | undefined;
  placeholder: string;
  value: string;
}) {
  const queryClient = useQueryClient();
  const recordsQuery = useQuery({
    queryKey: ["tenant", "common-lookup", definitionKey],
    queryFn: () => apiGet<CommonLookupRecord[]>(`/core/common/records?definitionKey=${definitionKey}`, "tenant"),
  });
  const options = useMemo<WorkspaceLookupOption[]>(
    () =>
      (recordsQuery.data ?? [])
        .filter((record) => record.isActive !== false)
        .filter((record) => matchesParentFilter(record, parentFilter))
        .map((record) => ({
          value: String(record.id),
          label: String(record.name ?? record.description ?? record.code ?? record.id),
          ...(record.code ? { description: String(record.code) } : {}),
        })),
    [parentFilter, recordsQuery.data],
  );

  return (
    <WorkspaceLookup
      allowTextValue={false}
      createLabel="Create"
      createMode="inline"
      dropdownMode="portal"
      loading={recordsQuery.isLoading && options.length === 0}
      options={options}
      placeholder={placeholder}
      value={value}
      onCreate={async (name) => {
        const created = await apiPost<CommonLookupRecord>("/core/common/records", {
          definitionKey,
          name,
          code: codeFromName(name),
          ...(createPayload ? createPayload(name) : {}),
        }, "tenant");
        toast.success(`${addressLookupLabel(definitionKey)} created`, { description: String(created.name ?? name) });
        void queryClient.invalidateQueries({ queryKey: ["tenant", "common-lookup", definitionKey] });
        return {
          value: String(created.id),
          label: String(created.name ?? name),
          ...(created.code ? { description: String(created.code) } : {}),
        };
      }}
      onValueChange={(nextValue, option) => onChange(option ? nextValue : "")}
    />
  );
}

function SalesContactCreateForm({
  contact,
  initialTab = "details",
  initialName,
  onCancel,
  onCreated,
}: {
  contact?: ContactLookupRecord | null;
  initialTab?: "address" | "details";
  initialName: string;
  onCancel: () => void;
  onCreated: (contact: ContactLookupRecord) => void | Promise<void>;
}) {
  const isEdit = Boolean(contact?.contactId);
  const nextCodeQuery = useQuery({
    queryKey: ["tenant", "contacts", "next-code", "sales-create"],
    queryFn: () => apiGet<{ code: string }>("/core/contacts/next-code", "tenant"),
    enabled: !isEdit,
  });
  const [form, setForm] = useState<SalesContactForm>(() => salesContactFormFromContact(contact, initialName));
  const [activeTab, setActiveTab] = useState<"address" | "details">(initialTab);
  const [error, setError] = useState<string | null>(null);
  const saveMutation = useMutation({
    mutationFn: async () => {
      const name = form.name.trim();
      if (!name) throw new Error("Customer name is required");
      const contactTypeId = await ensureCustomerContactType();
      const existingAddresses = contact?.addressBook ?? [];
      const editedAddress = form.addressLine1.trim()
        ? [{
            ...(existingAddresses.find((address) => address.isDefault) ?? existingAddresses[0] ?? {}),
            addressLine1: form.addressLine1.trim(),
            addressLine2: form.addressLine2.trim(),
            addressTypeId: optional(form.addressTypeId) ?? "billing",
            cityId: optional(form.cityId),
            countryId: optional(form.countryId),
            districtId: optional(form.districtId),
            isActive: true,
            isDefault: true,
            pincodeId: optional(form.pincodeId),
            stateId: optional(form.stateId),
          }]
        : [];
      const addressBook = isEdit
        ? editedAddress.length
          ? [editedAddress[0], ...existingAddresses.filter((address) => address.uuid !== editedAddress[0]?.uuid && address.id !== editedAddress[0]?.id)]
          : existingAddresses
        : editedAddress;
      const payload = {
        code: form.code.trim() || nextCodeQuery.data?.code || codeFromName(name),
        contactTypeId,
        gstin: optional(form.gstin.toUpperCase()),
        legalName: optional(form.legalName),
        name,
        primaryEmail: optional(form.email),
        primaryPhone: optional(form.phone),
        addressBook,
        contactEmails: form.email.trim() ? [{ email: form.email.trim(), emailType: "Primary", isActive: true, isPrimary: true }] : [],
        contactPhones: form.phone.trim() ? [{ phoneNumber: form.phone.trim(), phoneType: "Primary", isActive: true, isPrimary: true }] : [],
      };
      return isEdit && contact
        ? apiPut<ContactLookupRecord>(`/core/contacts/${encodeURIComponent(contact.contactId)}`, payload, "tenant")
        : apiPost<ContactLookupRecord>("/core/contacts", payload, "tenant");
    },
    onError: (saveError) => setError(apiErrorText(saveError, "Could not save contact")),
    onSuccess: async (contact) => {
      toast.success(isEdit ? "Contact updated" : "Contact created", { description: contact.name });
      await onCreated(contact);
    },
  });

  useEffect(() => {
    if (!nextCodeQuery.data?.code) return;
    setForm((current) => (!current.code || /^C-\d+$/i.test(current.code)) ? { ...current, code: nextCodeQuery.data.code } : current);
  }, [nextCodeQuery.data?.code]);

  function update(patch: Partial<SalesContactForm>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  const contactTabs: WorkspaceAnimatedTab[] = [
    {
      value: "details",
      label: "Details",
      content: (
        <>
          {error ? <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div> : null}
          <div className="grid gap-4 py-5 md:grid-cols-2">
            <PlainField label="Customer name *"><Input className="h-11 rounded-md" value={form.name} onChange={(event) => update({ name: event.target.value })} /></PlainField>
            <PlainField label="Code"><Input className="h-11 rounded-md" value={form.code} onChange={(event) => update({ code: event.target.value })} /></PlainField>
            <PlainField label="Legal name"><Input className="h-11 rounded-md" value={form.legalName} onChange={(event) => update({ legalName: event.target.value })} /></PlainField>
            <PlainField label="GSTIN"><Input className="h-11 rounded-md" value={form.gstin} onChange={(event) => update({ gstin: event.target.value.toUpperCase() })} /></PlainField>
            <PlainField label="Phone"><Input className="h-11 rounded-md" value={form.phone} onChange={(event) => update({ phone: event.target.value })} /></PlainField>
            <PlainField label="Email"><Input className="h-11 rounded-md" type="email" value={form.email} onChange={(event) => update({ email: event.target.value })} /></PlainField>
          </div>
        </>
      ),
    },
    {
      value: "address",
      label: "Address",
      content: (
        <>
          {error ? <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div> : null}
          <div className="grid gap-4 py-5 pb-24 md:grid-cols-2">
            <PlainField label="Address type"><AddressLookup definitionKey="address-types" placeholder="Search address type" value={form.addressTypeId} onChange={(addressTypeId) => update({ addressTypeId })} /></PlainField>
            <div className="hidden md:block" aria-hidden="true" />
            <PlainField label="Address line 1"><Input className="h-11 rounded-md" value={form.addressLine1} onChange={(event) => update({ addressLine1: event.target.value })} /></PlainField>
            <PlainField label="Address line 2"><Input className="h-11 rounded-md" value={form.addressLine2} onChange={(event) => update({ addressLine2: event.target.value })} /></PlainField>
            <PlainField label="Country"><AddressLookup definitionKey="countries" placeholder="Search country name" value={form.countryId} onChange={(countryId) => update({ countryId, stateId: "", districtId: "", cityId: "" })} /></PlainField>
            <PlainField label="State"><AddressLookup definitionKey="states" placeholder="Search state name" value={form.stateId} parentFilter={{ countryId: form.countryId }} createPayload={() => ({ countryId: form.countryId })} onChange={(stateId) => update({ stateId, districtId: "", cityId: "" })} /></PlainField>
            <PlainField label="District"><AddressLookup definitionKey="districts" placeholder="Search district name" value={form.districtId} parentFilter={{ stateId: form.stateId }} createPayload={() => ({ stateId: form.stateId })} onChange={(districtId) => update({ districtId, cityId: "" })} /></PlainField>
            <PlainField label="City"><AddressLookup definitionKey="cities" placeholder="Search city name" value={form.cityId} parentFilter={{ districtId: form.districtId }} createPayload={() => ({ districtId: form.districtId })} onChange={(cityId) => update({ cityId })} /></PlainField>
            <div className="hidden md:block" aria-hidden="true" />
            <PlainField label="Pincode"><AddressLookup definitionKey="pincodes" placeholder="Search pincode" value={form.pincodeId} onChange={(pincodeId) => update({ pincodeId })} /></PlainField>
          </div>
        </>
      ),
    },
  ];

  return (
    <div className="grid h-[36rem] grid-rows-[auto_1fr_auto] overflow-hidden rounded-md bg-card">
      <div className="border-b border-border/70 px-6 py-4">
        <h2 className="text-base font-semibold">{isEdit ? "Edit contact" : "Create contact"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{isEdit ? "Update invoice-ready customer details." : "Add invoice-ready customer details."}</p>
      </div>
      <WorkspaceAnimatedTabs
        className="min-h-0"
        contentClassName="m-0 h-[26.5rem] overflow-y-auto px-6 pb-8"
        keepMounted
        listClassName="rounded-none border-x-0 border-t-0 bg-transparent px-5 shadow-none"
        tabs={contactTabs}
        triggerClassName="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value === "address" ? "address" : "details")}
      />
      <div className="flex flex-wrap items-center gap-3 border-t border-border/70 bg-muted/20 px-6 py-4">
        <Button type="button" disabled={saveMutation.isPending || !form.name.trim()} className="rounded-md" onClick={() => saveMutation.mutate()}>
          <Save className={cn("size-4", saveMutation.isPending && "animate-spin")} />{isEdit ? "Update contact" : "Save contact"}
        </Button>
        <Button type="button" variant="outline" className="rounded-md" disabled={saveMutation.isPending} onClick={onCancel}><X className="size-4" />Cancel</Button>
      </div>
    </div>
  );
}

function SalesContactDialog({
  contact,
  initialTab,
  onOpenChange,
  onSaved,
  open,
}: {
  contact: ContactLookupRecord | null;
  initialTab: "address" | "details";
  onOpenChange: (open: boolean) => void;
  onSaved: (contact: ContactLookupRecord) => void | Promise<void>;
  open: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[min(62rem,calc(100vw-3rem))] max-w-none overflow-hidden rounded-md p-0 duration-0 data-[state=open]:animate-none data-[state=closed]:animate-none"
        onInteractOutside={(event) => event.preventDefault()}
      >
        {contact ? (
          <SalesContactCreateForm
            contact={contact}
            initialName={contact.name}
            initialTab={initialTab}
            onCancel={() => onOpenChange(false)}
            onCreated={async (updated) => {
              await onSaved(updated);
              onOpenChange(false);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function SalesItemsPreviewTable({
  isCgstSgst,
  items,
  onDelete,
  onEdit,
  showColour,
  showDc,
  showPo,
  showSize,
}: {
  isCgstSgst: boolean;
  items: EntryLine[];
  onDelete: (index: number) => void;
  onEdit: (index: number) => void;
  showColour: boolean;
  showDc: boolean;
  showPo: boolean;
  showSize: boolean;
}) {
  const emptyColSpan = 9 + (showPo ? 1 : 0) + (showDc ? 1 : 0) + (showColour ? 1 : 0) + (showSize ? 1 : 0) + (isCgstSgst ? 2 : 1);
  return (
    <div className="w-full overflow-x-auto rounded-md border border-border/70">
      <table className="w-full min-w-[980px] table-fixed border-collapse text-xs">
        <thead className="bg-muted/45 text-muted-foreground">
          <tr>
            <ItemHead className="w-[2.5%]">#</ItemHead>
            {showPo ? <ItemHead className="w-[5%]">PO</ItemHead> : null}
            {showDc ? <ItemHead className="w-[5%]">DC</ItemHead> : null}
            <ItemHead className="w-[24%]">Particulars</ItemHead>
            <ItemHead className="w-[5%]">HSN Code</ItemHead>
            {showColour ? <ItemHead className="w-[6%]">Colour</ItemHead> : null}
            {showSize ? <ItemHead className="w-[5%]">Size</ItemHead> : null}
            <ItemHead className="w-[5%]">Qty</ItemHead>
            <ItemHead className="w-[7%]">Rate</ItemHead>
            <ItemHead className="w-[5%]">Unit</ItemHead>
            <ItemHead className="w-[7%]">Taxable</ItemHead>
            <ItemHead className="w-[4%]">GST %</ItemHead>
            {isCgstSgst ? <ItemHead className="w-[7%]">CGST</ItemHead> : <ItemHead className="w-[8%]">IGST</ItemHead>}
            {isCgstSgst ? <ItemHead className="w-[7%]">SGST</ItemHead> : null}
            <ItemHead className="w-[8%]">Total</ItemHead>
            <ItemHead className="w-[4.5%]">Action</ItemHead>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={emptyColSpan} className="px-4 py-8 text-center text-sm text-muted-foreground">No sales items added.</td>
            </tr>
          ) : items.map((item, index) => {
            const tax = salesTaxBreakup(item, isCgstSgst);
            return (
              <tr key={item.lineId ?? index} className="border-b border-border/60 last:border-b-0">
                <ItemCell align="center">{index + 1}</ItemCell>
                {showPo ? <ItemCell align="center">{item.poNo || "-"}</ItemCell> : null}
                {showDc ? <ItemCell align="center">{item.dcNo || "-"}</ItemCell> : null}
                <ItemCell>{[item.productName, item.description].filter(Boolean).join(" - ")}</ItemCell>
                <ItemCell align="center">{item.hsnCode || "-"}</ItemCell>
                {showColour ? <ItemCell>{item.colour || "-"}</ItemCell> : null}
                {showSize ? <ItemCell>{item.size || "-"}</ItemCell> : null}
                <ItemCell align="center">{numberValue(item.quantity).toLocaleString()}</ItemCell>
                <ItemCell align="right">{money(item.rate)}</ItemCell>
                <ItemCell align="center">{item.unit || "-"}</ItemCell>
                <ItemCell align="right">{money(tax.taxable)}</ItemCell>
                <ItemCell align="center">{numberValue(item.taxRate)}%</ItemCell>
                <ItemCell align="right">{money(isCgstSgst ? tax.cgst : tax.igst)}</ItemCell>
                {isCgstSgst ? <ItemCell align="right">{money(tax.sgst)}</ItemCell> : null}
                <ItemCell align="right">{money(tax.total)}</ItemCell>
                <td className="px-1 py-1.5 text-center align-middle">
                  <div className="flex items-center justify-center gap-1">
                    <Button type="button" size="icon" variant="ghost" className="size-7 rounded-md" aria-label="Edit item" onClick={() => onEdit(index)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost" className="size-7 rounded-md text-destructive hover:text-destructive" aria-label="Delete item" onClick={() => onDelete(index)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SalesTotalsFooter({ onRoundOffChange, roundOff, totals }: { onRoundOffChange: (value: string) => void; roundOff: string; totals: ReturnType<typeof calculateSalesTotals> }) {
  return (
    <div className="flex justify-end pt-2">
      <div className="grid w-full max-w-[24rem] gap-3 text-sm">
        <SalesTotalRow label="Taxable amount" value={`₹${money(totals.taxable)}`} />
        <SalesTotalRow label="GST total" value={`₹${money(totals.gst)}`} />
        <div className="grid grid-cols-[1fr_auto_6rem] items-center gap-4">
          <span className="text-muted-foreground">Round off</span>
          <span>:</span>
          <Input className="h-9 rounded-md text-right" type="number" value={roundOff} onChange={(event) => onRoundOffChange(event.target.value)} />
        </div>
        <SalesTotalRow label="Grand total" strong value={`₹${money(totals.grand)}`} />
      </div>
    </div>
  );
}

function SalesTotalRow({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <div className={cn("grid grid-cols-[1fr_auto_6rem] items-center gap-4", strong && "font-semibold")}>
      <span className="text-muted-foreground">{label}</span>
      <span>:</span>
      <span className="text-right tabular-nums">{value}</span>
    </div>
  );
}

function SalesDocumentPlaceholder({ title }: { title: string }) {
  return (
    <div className="grid gap-5 px-6 py-5 lg:grid-cols-2">
      <PlainField label={title}><Input className="h-11 rounded-md" value="Not generated" readOnly /></PlainField>
      <PlainField label="Document no"><Input className="h-11 rounded-md" readOnly /></PlainField>
    </div>
  );
}

function SalesDocumentTab({
  form,
  generating,
  onGenerate,
  onUpdate,
  type,
}: {
  form: EntryForm;
  generating: boolean;
  onGenerate: () => void;
  onUpdate: (patch: Partial<EntryForm>) => void;
  type: "einvoice" | "eway";
}) {
  const generated = type === "einvoice" ? Boolean(form.irn || form.ackNo || form.signedQr) : Boolean(form.ewayBillNo);
  if (type === "einvoice") {
    return (
      <div className="space-y-5 px-6 py-5">
        <SalesDocumentStatus generated={generated} generating={generating} label="E-invoice status" onGenerate={onGenerate} />
        <PlainField label="IRN"><Input className="h-11 rounded-md" value={form.irn} onChange={(event) => onUpdate({ irn: event.target.value })} /></PlainField>
        <div className="grid gap-5 lg:grid-cols-2">
          <PlainField label="Ack no"><Input className="h-11 rounded-md" value={form.ackNo} onChange={(event) => onUpdate({ ackNo: event.target.value })} /></PlainField>
          <PlainField label="Ack date"><WorkspaceDatePicker ariaLabel="Ack date" placeholder="dd-mm-yyyy" value={form.ackDate} onValueChange={(ackDate) => onUpdate({ ackDate })} /></PlainField>
        </div>
        <PlainField label="Signed QR"><Textarea className="min-h-20 rounded-md" value={form.signedQr} onChange={(event) => onUpdate({ signedQr: event.target.value })} /></PlainField>
        <WhiteBooksHelp />
      </div>
    );
  }
  return (
    <div className="space-y-5 px-6 py-5">
      <SalesDocumentStatus generated={generated} generating={generating} label="E-way status" onGenerate={onGenerate} />
      <div className="grid gap-5 lg:grid-cols-2">
        <PlainField label="E-way bill no"><Input className="h-11 rounded-md" value={form.ewayBillNo} onChange={(event) => onUpdate({ ewayBillNo: event.target.value })} /></PlainField>
        <PlainField label="E-way bill date"><WorkspaceDatePicker ariaLabel="E-way bill date" placeholder="dd-mm-yyyy" value={form.ewayBillDate} onValueChange={(ewayBillDate) => onUpdate({ ewayBillDate })} /></PlainField>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_.48fr_.48fr]">
        <PlainField label="Transport">
          <TransportAutocomplete
            value={form.transportName}
            onChange={(transportName, transport) => onUpdate({
              transportName,
              vehicleNo: transport?.vehicleNo ? String(transport.vehicleNo).toUpperCase() : form.vehicleNo,
              ewayPart: transportName.trim() ? "part-a" : form.ewayPart || "part-b",
            })}
          />
        </PlainField>
        <PlainField label="E-way part"><EwayPartAutocomplete value={form.ewayPart || "part-b"} onChange={(ewayPart) => onUpdate({ ewayPart })} /></PlainField>
        <PlainField label="Vehicle no"><Input className="h-11 rounded-md" value={form.vehicleNo} onChange={(event) => onUpdate({ vehicleNo: event.target.value.toUpperCase() })} /></PlainField>
      </div>
      <PlainField label="Transport / vehicle notes"><Textarea className="min-h-20 rounded-md" value={form.notes} onChange={(event) => onUpdate({ notes: event.target.value })} /></PlainField>
      <WhiteBooksHelp />
    </div>
  );
}

function SalesDocumentStatus({ generated, generating, label, onGenerate }: { generated: boolean; generating: boolean; label: string; onGenerate: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2.5">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span>{label}</span>
        <Badge variant="outline" className={cn("h-6 rounded-md px-2 text-[11px]", generated ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700")}>
          {generated ? "Generated" : "Not generated"}
        </Badge>
      </div>
      <Button className="h-9 rounded-md" type="button" disabled={generating} onClick={onGenerate}>
        <Send className={cn("size-4", generating && "animate-pulse")} />Generate
      </Button>
    </div>
  );
}

function TransportAutocomplete({ onChange, value }: { onChange: (value: string, transport: CommonLookupRecord | null) => void; value: string }) {
  const queryClient = useQueryClient();
  const recordsQuery = useQuery({
    queryKey: ["tenant", "common-lookup", "transports"],
    queryFn: () => apiGet<CommonLookupRecord[]>("/core/common/records?definitionKey=transports", "tenant"),
  });
  const options = useMemo<Array<WorkspaceLookupOption & { transport: CommonLookupRecord }>>(
    () =>
      (recordsQuery.data ?? [])
        .filter((record) => record.isActive !== false)
        .map((record) => {
          const label = commonLookupLabel(record) || String(record.code ?? record.id);
          return {
            value: label,
            label,
            ...(record.vehicleNo ? { description: String(record.vehicleNo) } : record.code ? { description: String(record.code) } : {}),
            meta: [record.gst, record.contactNo, record.contactPerson].filter(Boolean).join(" | "),
            transport: record,
          };
        }),
    [recordsQuery.data],
  );

  return (
    <WorkspaceLookup
      allowTextValue
      createLabel="Create transport"
      createMode="inline"
      dropdownMode="portal"
      emptyLabel="No transports found."
      loading={recordsQuery.isLoading && options.length === 0}
      options={options}
      placeholder="Search or create transport"
      value={value}
      onCreate={async (name) => {
        const created = await apiPost<CommonLookupRecord>("/core/common/records", {
          definitionKey: "transports",
          name,
          code: codeFromName(name),
        }, "tenant");
        await queryClient.invalidateQueries({ queryKey: ["tenant", "common-lookup", "transports"] });
        const label = commonLookupLabel(created) || name.trim();
        toast.success("Transport created", { description: label });
        return { value: label, label, ...(created.code ? { description: String(created.code) } : {}) };
      }}
      onTextChange={(nextValue) => onChange(nextValue, null)}
      onValueChange={(nextValue, option) => {
        const transport = (option as (WorkspaceLookupOption & { transport?: CommonLookupRecord }) | undefined)?.transport ?? null;
        onChange(option?.label ?? nextValue, transport);
      }}
    />
  );
}

function EwayPartAutocomplete({ onChange, value }: { onChange: (value: string) => void; value: string }) {
  const options = [
    { value: "part-a", label: "Part A", description: "Transport details available" },
    { value: "part-b", label: "Part B", description: "Vehicle details only or pending transport" },
  ];
  return (
    <WorkspaceLookup
      allowTextValue={false}
      createMode="none"
      dropdownMode="portal"
      options={options}
      placeholder="Select E-way part"
      value={value}
      onValueChange={(nextValue, option) => onChange(option?.value ?? nextValue)}
    />
  );
}

function WhiteBooksHelp() {
  return (
    <div className="rounded-md border border-sky-100 bg-sky-50 px-3 py-2 text-xs text-sky-900">
      WhiteBooks e-Invoice uses sandbox apisandbox.whitebooks.in or production api.whitebooks.in for real-time IRN, signed JSON/QR, e-way, and bulk-ready GST workflows. CODEXSUN stores every provider operation for audit before updating the invoice.
    </div>
  );
}

function PlainField({ children, error, label }: { children: ReactNode; error?: string | undefined; label: string }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
      {error ? <Helper>{error}</Helper> : null}
    </label>
  );
}

function CompactInput({ label, numeric, onChange, value }: { label: string; numeric?: boolean; onChange: (value: string) => void; value: string }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Input className={cn("h-11 rounded-md", numeric && "text-right tabular-nums")} inputMode={numeric ? "decimal" : undefined} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function CompactField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function ItemHead({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={cn("border-b border-r border-border/70 px-1.5 py-2 text-center font-medium last:border-r-0", className)}>{children}</th>;
}

function ItemCell({ align = "left", children }: { align?: "center" | "left" | "right"; children: ReactNode }) {
  return <td className={cn("border-r border-border/70 px-1.5 py-1.5 align-middle last:border-r-0", align === "center" && "text-center", align === "right" && "text-right tabular-nums")}>{children}</td>;
}

function salesTaxBreakup(line: EntryLine, isCgstSgst: boolean) {
  const taxable = Math.max(0, numberValue(line.quantity) * numberValue(line.rate) - numberValue(line.discountAmount));
  const gst = taxable * numberValue(line.taxRate) / 100;
  return {
    taxable,
    gst,
    cgst: isCgstSgst ? gst / 2 : 0,
    sgst: isCgstSgst ? gst / 2 : 0,
    igst: isCgstSgst ? 0 : gst,
    total: taxable + gst,
  };
}

function calculateSalesTotals(lines: EntryLine[], roundOff: string) {
  const taxable = lines.reduce((sum, line) => sum + salesTaxBreakup(line, true).taxable, 0);
  const gst = lines.reduce((sum, line) => sum + salesTaxBreakup(line, true).gst, 0);
  return { taxable, gst, grand: taxable + gst + numberValue(roundOff) };
}

function salesLedgerLabel(value: string) {
  return value === "Sales Account" ? "Normal Sales" : value;
}

function openContactEdit(contactId: string) {
  const url = new URL(window.location.href);
  url.pathname = "/tenant/master/contacts";
  url.search = `?edit=${encodeURIComponent(contactId)}`;
  window.history.pushState({ contactId }, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function addressLookupLabel(definitionKey: string) {
  const labels: Record<string, string> = {
    "address-types": "Address type",
    cities: "City",
    countries: "Country",
    districts: "District",
    pincodes: "Pincode",
    states: "State",
  };
  return labels[definitionKey] ?? labelFromDefinitionKey(definitionKey);
}

function labelFromDefinitionKey(definitionKey: string) {
  return definitionKey.split("-").map((part) => part ? part[0]!.toUpperCase() + part.slice(1) : part).join(" ");
}

function useProductLookupMaps() {
  return useQuery({
    queryKey: ["tenant", "product-lookup-maps"],
    queryFn: fetchProductLookupMaps,
  });
}

async function fetchProductLookupMaps() {
  const definitionKeys: ProductLookupDefinitionKey[] = ["product-types", "hsn-codes", "units", "taxes"];
  const entries = await Promise.all(
    definitionKeys.map(async (definitionKey) => {
      const records = await apiGet<CommonLookupRecord[]>(`/core/common/records?definitionKey=${definitionKey}`, "tenant");
      return [definitionKey, new Map(records.map((record) => [String(record.id), record]))] as const;
    }),
  );
  return Object.fromEntries(entries) as ProductLookupMaps;
}

function productOptionFromRecord(product: ProductLookupRecord, lookupMaps: ProductLookupMaps | undefined): ProductLookupOption {
  const hsn = lookupMaps?.["hsn-codes"].get(String(product.hsnCodeId ?? ""));
  const unit = lookupMaps?.units.get(String(product.unitId ?? ""));
  const tax = lookupMaps?.taxes.get(String(product.taxId ?? ""));
  return {
    value: product.name,
    label: product.name,
    description: product.code,
    meta: [commonLookupLabel(hsn), commonLookupLabel(unit), taxRateLabel(tax)].filter(Boolean).join(" | "),
    product,
    line: {
      productId: product.itemId,
      productName: product.name,
      hsnCode: commonLookupLabel(hsn),
      unit: commonLookupLabel(unit),
      quantity: 1,
      rate: numberValue(product.openingPrice),
      discountAmount: 0,
      taxRate: taxRateValue(tax),
    },
  };
}

function commonOptionFromRecord(record: CommonLookupRecord): WorkspaceLookupOption {
  return {
    value: String(record.id),
    label: commonLookupLabel(record) || String(record.id),
    ...(record.code ? { description: String(record.code) } : {}),
  };
}

function commonLookupLabel(record: CommonLookupRecord | undefined) {
  if (!record) return "";
  if (record.name) return String(record.name);
  if (record.description) return String(record.description);
  if (record.ratePercent !== undefined && record.ratePercent !== null) return `${record.ratePercent}%`;
  return String(record.code ?? record.id ?? "");
}

function taxRateLabel(record: CommonLookupRecord | undefined) {
  if (!record) return "";
  if (record.ratePercent !== undefined && record.ratePercent !== null) return `${record.ratePercent}%`;
  return commonLookupLabel(record);
}

function taxRateValue(record: CommonLookupRecord | undefined) {
  if (!record) return 0;
  if (record.ratePercent !== undefined && record.ratePercent !== null) return numberValue(record.ratePercent);
  return numberValue(String(record.name ?? record.description ?? record.code ?? "").replace("%", ""));
}

function createPayloadForProductLookup(definitionKey: ProductLookupDefinitionKey, name: string) {
  const trimmed = name.trim();
  if (definitionKey === "hsn-codes") {
    return {
      code: trimmed,
      description: trimmed,
    };
  }
  if (definitionKey === "taxes") {
    const ratePercent = Number(trimmed.replace("%", ""));
    return {
      description: trimmed.endsWith("%") ? trimmed : `${trimmed}%`,
      ratePercent: Number.isFinite(ratePercent) ? ratePercent : 0,
    };
  }
  return {};
}

function emptyProductLookupMaps(): ProductLookupMaps {
  return {
    "product-types": new Map(),
    "hsn-codes": new Map(),
    units: new Map(),
    taxes: new Map(),
  };
}

function emptySalesProductForm(initialName: string): SalesProductForm {
  const name = initialName.trim();
  return {
    code: name ? codeFromName(name) : "",
    hsnCodeId: "",
    isActive: true,
    name,
    productTypeId: "",
    taxId: "",
    unitId: "",
  };
}

function emptySalesContactForm(initialName: string): SalesContactForm {
  const name = initialName.trim();
  return {
    addressLine1: "",
    addressLine2: "",
    addressTypeId: "",
    cityId: "",
    code: "",
    countryId: "",
    districtId: "",
    email: "",
    gstin: "",
    legalName: name ? titleCase(name) : "",
    name,
    phone: "",
    pincodeId: "",
    stateId: "",
  };
}

function salesContactFormFromContact(contact: ContactLookupRecord | null | undefined, initialName: string): SalesContactForm {
  if (!contact) return emptySalesContactForm(initialName);
  const address = contact.addressBook?.find((item) => item.isDefault) ?? contact.addressBook?.[0];
  return {
    addressLine1: address?.addressLine1 ?? "",
    addressLine2: address?.addressLine2 ?? "",
    addressTypeId: address?.addressTypeId ? String(address.addressTypeId) : "billing",
    cityId: address?.cityId ? String(address.cityId) : "",
    code: contact.code ?? "",
    countryId: address?.countryId ? String(address.countryId) : "",
    districtId: address?.districtId ? String(address.districtId) : "",
    email: contact.primaryEmail ?? "",
    gstin: contact.gstin ?? "",
    legalName: contact.legalName ?? contact.name ?? "",
    name: contact.name ?? initialName,
    phone: contact.primaryPhone ?? "",
    pincodeId: address?.pincodeId ? String(address.pincodeId) : "",
    stateId: address?.stateId ? String(address.stateId) : "",
  };
}

async function ensureCustomerContactType() {
  const records = await apiGet<CommonLookupRecord[]>("/core/common/records?definitionKey=contact-types", "tenant");
  const existing = records.find((record) => {
    const label = String(record.name ?? record.description ?? record.code ?? "").trim().toLowerCase();
    return record.isActive !== false && (label === "customer" || label === "customers");
  });
  if (existing) return String(existing.id);
  const created = await apiPost<CommonLookupRecord>("/core/common/records", {
    definitionKey: "contact-types",
    name: "Customer",
    code: "customer",
    description: "Customer contacts used in sales billing.",
  }, "tenant");
  return String(created.id);
}

function contactAddressText(contact: ContactLookupRecord, preferredKind?: "billing" | "shipping") {
  const addresses = (contact.addressBook ?? []).filter((item) => item.isActive !== false);
  const address = preferredKind
    ? addresses.find((item) => contactAddressKind(item) === preferredKind) ?? addresses.find((item) => item.isDefault) ?? addresses.find((item) => item.addressLine1 || item.addressLine2) ?? addresses[0]
    : addresses.find((item) => item.isDefault) ?? addresses.find((item) => item.addressLine1 || item.addressLine2) ?? addresses[0];
  if (!address) return "";
  return [address.addressLine1, address.addressLine2, address.cityId, address.districtId, address.stateId, address.countryId, address.pincodeId]
    .filter(Boolean)
    .join(", ");
}

function contactAddressOptions(contact: ContactLookupRecord | null, preferredKind: "billing" | "shipping") {
  if (!contact) return [];
  const addresses = (contact.addressBook ?? []).filter((address) => address.isActive !== false);
  const sorted = [...addresses].sort((left, right) => {
    const leftScore = (contactAddressKind(left) === preferredKind ? 0 : 10) + (left.isDefault ? 0 : 1);
    const rightScore = (contactAddressKind(right) === preferredKind ? 0 : 10) + (right.isDefault ? 0 : 1);
    return leftScore - rightScore;
  });
  const seen = new Set<string>();
  return sorted.flatMap((address) => {
    const label = contactAddressText({ ...contact, addressBook: [address] });
    if (!label || seen.has(label.toLowerCase())) return [];
    seen.add(label.toLowerCase());
    return [{
      value: label,
      label,
      description: address.isDefault ? "Default address" : titleCase(contactAddressKind(address)),
    }];
  });
}

function contactAddressKind(address: ContactAddressBookEntry) {
  const type = String(address.addressTypeId ?? "").trim().toLowerCase();
  if (type.includes("ship")) return "shipping";
  return "billing";
}

function matchesParentFilter(record: CommonLookupRecord, parentFilter: Record<string, string> | undefined) {
  if (!parentFilter) return true;
  const source = record as Record<string, unknown>;
  return Object.entries(parentFilter).every(([key, value]) => !value || String(source[key] ?? "") === value);
}

function optional(value: unknown) {
  const text = String(value ?? "").trim();
  return text ? text : undefined;
}

function apiErrorText(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const details = errorDetailsText(error.details);
    if (details) return `${error.message}: ${details}`;
    return error.message || error.code || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

function errorDetailsText(details: unknown): string {
  if (!details) return "";
  if (typeof details === "string") return details;
  if (Array.isArray(details)) return details.map(errorDetailsText).filter(Boolean).join(", ");
  if (typeof details === "object") {
    const flat = Object.entries(details as Record<string, unknown>)
      .map(([key, value]) => {
        const text = errorDetailsText(value);
        return text ? `${key}: ${text}` : "";
      })
      .filter(Boolean);
    return flat.join(", ");
  }
  return String(details);
}

function codeFromName(name: string) {
  const base = name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  return base ? base.slice(0, 24) : `C-${Date.now().toString().slice(-4)}`;
}

function titleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

export function SalesSettingsPage() {
  const [settings, setSettings] = useState<SalesSettingsState>(() => readSalesSettings());

  function publish() {
    saveSalesSettings(settings);
    toast.success("Sales settings published");
  }

  function toggle(id: SalesSettingId, enabled: boolean) {
    setSettings((current) => {
      const next = { ...current, layout: { ...current.layout, [id]: enabled } };
      saveSalesSettings(next);
      return next;
    });
  }

  function toggleSetting(section: "customise" | "features" | "printing", id: string, enabled: boolean) {
    setSettings((current) => {
      const next = section === "printing"
        ? { ...current, printing: { ...current.printing, settings: current.printing.settings.map((item) => item.id === id ? { ...item, enabled } : item) } }
        : { ...current, [section]: current[section].map((item) => item.id === id ? { ...item, enabled } : item) };
      saveSalesSettings(next);
      return next;
    });
  }

  function updateLetterhead(key: keyof LetterheadSettings, value: string | number) {
    setSettings((current) => {
      const next = { ...current, letterhead: { ...current.letterhead, [key]: value } };
      saveSalesSettings(next);
      return next;
    });
  }

  return (
    <WorkspacePage
      title="Sales Settings"
      description="Configure sales layout, customisation, and print controls for CODEXSUN."
      actions={<Button type="button" className="h-9 rounded-md" onClick={publish}><Save className="size-4" />Publish live</Button>}
    >
      <Tabs defaultValue="layout" className="space-y-4">
        <TabsList className="h-auto w-full justify-start rounded-md border border-border/70 bg-card px-3 py-0.5 shadow-sm">
          {["Layout", "Printing", "Customise", "Features"].map((label) => (
            <TabsTrigger key={label} value={label.toLowerCase()} className="rounded-none border-b-2 border-transparent px-4 py-3 text-sm shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="layout" className="m-0 rounded-md border border-border/70 bg-card p-4 shadow-sm">
          <div className="mb-7">
            <h2 className="text-base font-semibold">Sales Layout</h2>
            <p className="mt-1 text-sm text-muted-foreground">Toggle fields used by sales entry and print screens.</p>
          </div>
          <div className="grid gap-3">
            <label className="grid gap-2 rounded-md border border-border/70 bg-background px-4 py-3">
              <span className="text-sm font-medium">GST API mode</span>
              <WorkspaceSelect
                options={[
                  { label: "E-invoice + E-way", value: "einvoice_eway" },
                  { label: "E-way only", value: "eway_only" },
                ]}
                value={settings.gstApiMode}
                onValueChange={(gstApiMode) => setSettings((current) => ({ ...current, gstApiMode: gstApiMode === "eway_only" ? "eway_only" : "einvoice_eway" }))}
              />
            </label>
            {salesLayoutSettings.map((setting) => (
              <div key={setting.id} className="flex items-center justify-between gap-4 rounded-md border border-border/70 bg-background px-4 py-3 shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{setting.label}</span>
                    <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">Industry</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{setting.description}</p>
                </div>
                <Switch checked={settings.layout[setting.id]} onCheckedChange={(checked) => toggle(setting.id, checked)} />
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="printing" className="m-0 rounded-md border border-border/70 bg-card p-4 shadow-sm">
          <div className="mb-7">
            <h2 className="text-base font-semibold">Sales Printing</h2>
            <p className="mt-1 text-sm text-muted-foreground">Control presentation options for sales invoice printing.</p>
          </div>
          <div className="grid gap-3">
            {settings.printing.settings.map((setting) => (
              <SettingsSwitchRow key={setting.id} setting={setting} onToggle={(enabled) => toggleSetting("printing", setting.id, enabled)} />
            ))}
            <label className="grid gap-2 rounded-md border border-border/70 bg-background px-4 py-3">
              <span className="text-sm font-medium">Custom terms</span>
              <Textarea className="min-h-24 rounded-md" value={settings.printing.customTerms} onChange={(event) => {
                const customTerms = event.target.value;
                setSettings((current) => {
                  const next = { ...current, printing: { ...current.printing, customTerms } };
                  saveSalesSettings(next);
                  return next;
                });
              }} />
            </label>
            <LetterheadDesigner settings={settings.letterhead} onChange={updateLetterhead} />
          </div>
        </TabsContent>
        <TabsContent value="customise" className="m-0 rounded-md border border-border/70 bg-card p-4 shadow-sm">
          <div className="mb-7">
            <h2 className="text-base font-semibold">Billing Layout</h2>
            <p className="mt-1 text-sm text-muted-foreground">Industry-specific invoice, tax, address, and print presentation choices.</p>
          </div>
          <div className="grid gap-3">
            {settings.customise.map((setting) => (
              <SettingsSwitchRow key={setting.id} setting={setting} onToggle={(enabled) => toggleSetting("customise", setting.id, enabled)} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="features" className="m-0 rounded-md border border-border/70 bg-card p-4 shadow-sm">
          <div className="grid gap-3">
            {settings.features.map((setting) => (
              <SettingsSwitchRow key={setting.id} setting={setting} onToggle={(enabled) => toggleSetting("features", setting.id, enabled)} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </WorkspacePage>
  );
}

export function DocumentSettingsPage() {
  const [records, setRecords] = useState<DocumentNumberSetting[]>(() => readDocumentSettings());
  const salesEntriesQuery = useQuery({
    queryKey: ["tenant", "entries", "sales", "document-settings"],
    queryFn: () => apiGet<EntryRecord[]>("/core/entries/sales", "tenant"),
  });

  useEffect(() => {
    if (!salesEntriesQuery.data) return;
    setRecords((current) => {
      const next = syncDocumentSettingWithEntries(current, "sales", salesEntriesQuery.data);
      if (next === current) return current;
      saveDocumentSettings(next);
      return next;
    });
  }, [records, salesEntriesQuery.data]);

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
      description="Configure automatic document numbers for billing vouchers, cash book, and bank book."
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

function SettingsSwitchRow({ onToggle, setting }: { onToggle: (enabled: boolean) => void; setting: SettingsToggle }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border/70 bg-background px-4 py-3 shadow-sm">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{setting.label}</span>
          <span className={cn(
            "rounded-md border px-2 py-0.5 text-[11px]",
            setting.scope === "industry" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-sky-200 bg-sky-50 text-sky-700",
          )}>
            {titleCase(setting.scope)}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{setting.description}</p>
      </div>
      <Switch checked={setting.enabled} onCheckedChange={onToggle} />
    </div>
  );
}

function LetterheadDesigner({ onChange, settings }: { onChange: (key: keyof LetterheadSettings, value: string | number) => void; settings: LetterheadSettings }) {
  return (
    <div className="grid gap-3 rounded-md border border-border/70 bg-background px-4 py-3">
      <div className="flex min-h-40 items-center justify-center rounded-md border bg-white text-black shadow-sm" style={{ borderColor: settings.borderColor }}>
        <div className="text-center" style={{ color: settings.companyNameColor, fontFamily: settings.companyNameFontFamily, fontSize: settings.companyNameFontSize }}>
          CODEXSUN
        </div>
      </div>
      <div>
        <p className="text-sm font-medium">Letterhead Designer</p>
        <p className="text-xs text-muted-foreground">Used by sales, purchase, receipt, payment, stock documents, and statements.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DesignerField label="Company font" value={settings.companyNameFontFamily} onChange={(value) => onChange("companyNameFontFamily", value)} />
        <DesignerField label="Address font" value={settings.addressFontFamily} onChange={(value) => onChange("addressFontFamily", value)} />
        <DesignerField label="Company size" type="number" value={String(settings.companyNameFontSize)} onChange={(value) => onChange("companyNameFontSize", numberValue(value))} />
        <DesignerField label="Address size" type="number" value={String(settings.addressFontSize)} onChange={(value) => onChange("addressFontSize", numberValue(value))} />
        <DesignerField label="Contact size" type="number" value={String(settings.contactFontSize)} onChange={(value) => onChange("contactFontSize", numberValue(value))} />
        <DesignerField label="Tax size" type="number" value={String(settings.taxFontSize)} onChange={(value) => onChange("taxFontSize", numberValue(value))} />
        <DesignerField label="Header height mm" type="number" value={String(settings.heightMm)} onChange={(value) => onChange("heightMm", numberValue(value))} />
        <DesignerField label="Logo height mm" type="number" value={String(settings.logoHeightMm)} onChange={(value) => onChange("logoHeightMm", numberValue(value))} />
        <DesignerField label="Logo width mm" type="number" value={String(settings.logoWidthMm)} onChange={(value) => onChange("logoWidthMm", numberValue(value))} />
        <DesignerField label="Logo left mm" type="number" value={String(settings.logoLeftMm)} onChange={(value) => onChange("logoLeftMm", numberValue(value))} />
        <DesignerField label="Logo top mm" type="number" value={String(settings.logoTopMm)} onChange={(value) => onChange("logoTopMm", numberValue(value))} />
        <DesignerField label="Company color" type="color" value={settings.companyNameColor} onChange={(value) => onChange("companyNameColor", value)} />
        <DesignerField label="Address color" type="color" value={settings.addressColor} onChange={(value) => onChange("addressColor", value)} />
        <DesignerField label="Border color" type="color" value={settings.borderColor} onChange={(value) => onChange("borderColor", value)} />
      </div>
    </div>
  );
}

function DesignerField({ label, onChange, type = "text", value }: { label: string; onChange: (value: string) => void; type?: "color" | "number" | "text"; value: string }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Input className="h-9 rounded-md" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function readSalesSettings(): SalesSettingsState {
  try {
    const parsed = JSON.parse(localStorage.getItem(salesSettingsStorageKey) ?? "null") as Partial<SalesSettingsState> | null;
    return {
      customise: mergeSettings(defaultSalesSettings.customise, parsed?.customise),
      features: mergeSettings(defaultSalesSettings.features, parsed?.features),
      gstApiMode: parsed?.gstApiMode === "eway_only" ? "eway_only" : "einvoice_eway",
      letterhead: { ...defaultSalesSettings.letterhead, ...(parsed?.letterhead ?? {}) },
      layout: { ...defaultSalesSettings.layout, ...(parsed?.layout ?? {}) },
      printing: {
        customTerms: parsed?.printing?.customTerms ?? defaultSalesSettings.printing.customTerms,
        settings: mergeSettings(defaultSalesSettings.printing.settings, parsed?.printing?.settings),
      },
    };
  } catch {
    return defaultSalesSettings;
  }
}

function saveSalesSettings(settings: SalesSettingsState) {
  try {
    localStorage.setItem(salesSettingsStorageKey, JSON.stringify(settings));
  } catch {}
}

function mergeSettings(defaults: SettingsToggle[], saved: readonly SettingsToggle[] | undefined) {
  return defaults.map((setting) => {
    const existing = saved?.find((item) => item.id === setting.id);
    return existing ? { ...setting, enabled: existing.enabled } : setting;
  });
}

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
  return kind === "quotation" ? "quotation" : kind === "sales" ? "sales" : kind === "purchase" ? "purchase" : kind === "receipt" ? "receipt" : "payment";
}

function nextDocumentNoForKind(kind: EntryKind, entries: EntryRecord[]) {
  const documentKind = documentKindForEntry(kind);
  const setting = readDocumentSettings().find((record) => record.kind === documentKind) ?? defaultDocumentSettings.find((record) => record.kind === documentKind)!;
  const configuredNext = Math.max(1, numberValue(setting.nextNumber));
  const usedMax = entries
    .map((entry) => documentNumberValue(setting, entry.documentNo))
    .reduce((max, value) => Math.max(max, value), 0);
  return documentPreview({ ...setting, nextNumber: String(Math.max(configuredNext, usedMax + 1)) });
}

function isDuplicateDocumentNo(documentNo: string, entries: EntryRecord[], entryId: string | undefined) {
  const normalized = documentNo.trim().toLowerCase();
  if (!normalized) return false;
  return entries.some((entry) => entry.entryId !== entryId && entry.documentNo.trim().toLowerCase() === normalized);
}

function advanceDocumentSetting(kind: EntryKind, documentNo: string) {
  const documentKind = documentKindForEntry(kind);
  const settings = readDocumentSettings();
  const current = settings.find((setting) => setting.kind === documentKind);
  if (!current) return;
  const usedNumber = documentNumberValue(current, documentNo);
  if (usedNumber <= 0) return;
  const nextNumber = Math.max(numberValue(current.nextNumber), usedNumber + 1);
  saveDocumentSettings(settings.map((setting) => setting.kind === documentKind ? { ...setting, nextNumber: String(nextNumber) } : setting));
}

function syncDocumentSettingWithEntries(settings: DocumentNumberSetting[], kind: DocumentNumberKind, entries: EntryRecord[]) {
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

function SummaryPanel({ entry }: { entry: EntryRecord }) {
  return (
    <div className="rounded-md border border-border/70 bg-card/95 p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold">Summary</h3>
      <div className="grid gap-2 text-sm">
        <SummaryLine label="Taxable" value={money(entry.taxableTotal || entry.amount)} />
        <SummaryLine label="GST" value={money(entry.taxTotal)} />
        <SummaryLine label="Grand total" value={money(entry.grandTotal || entry.netAmount)} strong />
        <SummaryLine label="Balance" value={money(entry.balanceAmount || entry.unallocatedAmount)} />
      </div>
    </div>
  );
}

function ActivityPanel({ entry }: { entry: EntryRecord }) {
  return (
    <div className="rounded-md border border-border/70 bg-card/95 p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold">Activity</h3>
      <div className="grid gap-3">
        {entry.activities.length ? entry.activities.map((activity) => (
          <div key={`${activity.activityType}-${activity.createdAt}`} className="border-l-2 border-border pl-3 text-sm">
            <div className="font-medium">{activity.message}</div>
            <div className="text-xs text-muted-foreground">{activity.actorEmail} - {formatDateTime(activity.createdAt)}</div>
          </div>
        )) : <div className="text-sm text-muted-foreground">No activity yet.</div>}
      </div>
    </div>
  );
}

function PrintLineTable({ lines }: { lines: EntryLine[] }) {
  return (
    <table className="mt-6 w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-border bg-muted/40">
          <PrintTh>#</PrintTh>
          <PrintTh>Item</PrintTh>
          <PrintTh>HSN</PrintTh>
          <PrintTh className="text-right">Qty</PrintTh>
          <PrintTh className="text-right">Rate</PrintTh>
          <PrintTh className="text-right">GST</PrintTh>
          <PrintTh className="text-right">Total</PrintTh>
        </tr>
      </thead>
      <tbody>
        {lines.map((line, index) => (
          <tr key={line.lineId ?? index} className="border-b border-border">
            <td className="px-3 py-2">{index + 1}</td>
            <td className="px-3 py-2 font-medium">{line.productName}</td>
            <td className="px-3 py-2">{line.hsnCode || "-"}</td>
            <td className="px-3 py-2 text-right">{line.quantity}</td>
            <td className="px-3 py-2 text-right">{money(line.rate)}</td>
            <td className="px-3 py-2 text-right">{line.taxRate}%</td>
            <td className="px-3 py-2 text-right font-semibold">{money(line.lineTotal ?? lineTotal(line))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PrintAllocationTable({ allocations }: { allocations: EntryAllocation[] }) {
  return (
    <table className="mt-6 w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-border bg-muted/40">
          <PrintTh>#</PrintTh>
          <PrintTh>Document</PrintTh>
          <PrintTh>Date</PrintTh>
          <PrintTh className="text-right">Previous</PrintTh>
          <PrintTh className="text-right">Allocated</PrintTh>
          <PrintTh className="text-right">Balance</PrintTh>
        </tr>
      </thead>
      <tbody>
        {allocations.map((allocation, index) => (
          <tr key={allocation.allocationId ?? index} className="border-b border-border">
            <td className="px-3 py-2">{index + 1}</td>
            <td className="px-3 py-2 font-medium">{allocation.documentNo}</td>
            <td className="px-3 py-2">{formatDate(allocation.documentDate)}</td>
            <td className="px-3 py-2 text-right">{money(allocation.previousBalance)}</td>
            <td className="px-3 py-2 text-right">{money(allocation.allocatedAmount)}</td>
            <td className="px-3 py-2 text-right font-semibold">{money(allocation.balanceAfterAllocation ?? allocation.previousBalance - allocation.allocatedAmount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TotalsBox({ entry }: { entry: EntryRecord }) {
  return (
    <div className="rounded-md border border-border">
      <SummaryLine label="Subtotal" value={money(entry.subtotal || entry.amount)} />
      <SummaryLine label="Discount" value={money(entry.discountTotal)} />
      <SummaryLine label="Taxable" value={money(entry.taxableTotal)} />
      <SummaryLine label="GST" value={money(entry.taxTotal)} />
      <SummaryLine label="Round Off" value={money(entry.roundOff)} />
      <SummaryLine label="Grand Total" value={money(entry.grandTotal || entry.netAmount)} strong />
    </div>
  );
}

function SummaryLine({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-4 px-3 py-2 text-sm", strong && "border-t border-border font-semibold")}>
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function PrintBlock({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="text-sm">
      <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function TableHead({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={cn("border-b border-border/70 px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground", className)}>{children}</th>;
}

function PrintTh({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={cn("px-3 py-2 text-left text-xs font-semibold uppercase text-muted-foreground", className)}>{children}</th>;
}

function Field({ children, error, label, required }: { children: ReactNode; error?: string | undefined; label: string; required?: boolean | undefined }) {
  return (
    <WorkspaceFormField label={label} {...(required ? { required: true } : {})}>
      {children}
      {error ? <Helper>{error}</Helper> : null}
    </WorkspaceFormField>
  );
}

function Helper({ children }: { children: ReactNode }) {
  return <p className="text-xs font-medium text-destructive">{children}</p>;
}

function formFromEntry(kind: EntryKind, entry: EntryRecord | null): EntryForm {
  const today = localDateString();
  const usesAllocations = Boolean(entryMeta[kind].usesAllocations);
  return {
    ...(entry?.entryId ? { entryId: entry.entryId } : {}),
    documentNo: entry?.documentNo ?? "",
    documentDate: normalizeDateValue(entry?.documentDate, today),
    partyId: entry?.partyId ?? "",
    partyName: entry?.partyName ?? "",
    partyGstin: entry?.partyGstin ?? "",
    supplierBillNo: entry?.supplierBillNo ?? "",
    supplierBillDate: normalizeDateValue(entry?.supplierBillDate, ""),
    billingAddress: entry?.billingAddress ?? "",
    shippingAddress: entry?.shippingAddress ?? "",
    placeOfSupply: entry?.placeOfSupply ?? "cgst-sgst",
    referenceNo: entry?.referenceNo ?? "",
    referenceDate: normalizeDateValue(entry?.referenceDate, ""),
    dueDate: normalizeDateValue(entry?.dueDate, ""),
    ledgerName: entry?.ledgerName ?? "Cash",
    paymentMode: entry?.paymentMode ?? "cash",
    amount: String(entry?.amount ?? 0),
    tdsAmount: String(entry?.tdsAmount ?? 0),
    discountTotal: String(entry?.discountTotal ?? 0),
    roundOff: String(entry?.roundOff ?? 0),
    paidAmount: String(entry?.paidAmount ?? 0),
    status: entry?.status ?? "draft",
    paymentStatus: entry?.paymentStatus ?? "unpaid",
    notes: entry?.notes ?? "",
    terms: entry?.terms ?? defaultTerms(kind),
    irn: entry?.irn ?? "",
    ackNo: entry?.ackNo ?? "",
    ackDate: normalizeDateValue(entry?.ackDate, ""),
    signedQr: entry?.signedQr ?? "",
    ewayBillNo: entry?.ewayBillNo ?? "",
    ewayBillDate: normalizeDateValue(entry?.ewayBillDate, ""),
    transportName: entry?.transportName ?? "",
    vehicleNo: entry?.vehicleNo ?? "",
    ewayPart: entry?.ewayPart ?? "part-b",
    lines: entry?.lines?.length ? entry.lines : usesAllocations ? [] : [emptyLine()],
    allocations: entry?.allocations?.length ? entry.allocations : usesAllocations ? [emptyAllocation(entryMeta[kind].allocationDocumentType)] : [],
  };
}

function payloadFromForm(kind: EntryKind, form: EntryForm) {
  const meta = entryMeta[kind];
  const documentDate = normalizeDateValue(form.documentDate, localDateString());
  return {
    ...form,
    documentDate,
    supplierBillDate: normalizeDateValue(form.supplierBillDate, ""),
    referenceDate: normalizeDateValue(form.referenceDate, ""),
    dueDate: normalizeDateValue(form.dueDate, ""),
    partyType: kind === "purchase" || kind === "payment" ? "supplier" : "customer",
    amount: numberValue(form.amount),
    tdsAmount: numberValue(form.tdsAmount),
    discountTotal: numberValue(form.discountTotal),
    roundOff: numberValue(form.roundOff),
    paidAmount: numberValue(form.paidAmount),
    lines: meta.usesAllocations ? [] : form.lines,
    allocations: meta.usesAllocations
      ? form.allocations.map((allocation) => ({ ...allocation, documentDate: normalizeDateValue(allocation.documentDate, "") }))
      : [],
  };
}

function validateEntryForm(kind: EntryKind, form: EntryForm) {
  const errors: Record<string, string> = {};
  if (!normalizeDateValue(form.documentDate, "")) errors.documentDate = "Date is required";
  if (!form.partyName.trim()) errors.partyName = `${entryMeta[kind].partyLabel} is required`;
  if (entryMeta[kind].usesAllocations) {
    if (numberValue(form.amount) <= 0) errors.amount = "Amount must be greater than zero";
  } else if (!form.lines.some((line) => line.productName.trim())) {
    errors.lines = "At least one item line is required";
  }
  return errors;
}

function emptyLine(): EntryLine {
  return { productName: "", description: "", hsnCode: "", unit: "", quantity: 1, rate: 0, discountAmount: 0, taxRate: 0 };
}

function emptyAllocation(documentType: string): EntryAllocation {
  return { documentType, documentNo: "", documentDate: "", documentTotal: 0, previousBalance: 0, allocatedAmount: 0 };
}

function defaultTerms(kind: EntryKind) {
  if (kind === "purchase") return "Supplier bill accepted subject to goods, rate, quantity, and quality verification.";
  if (kind === "quotation" || kind === "sales") return "Goods once sold will not be taken back unless agreed in writing.";
  return "";
}

function lineTotal(line: EntryLine) {
  const taxable = Math.max(0, numberValue(line.quantity) * numberValue(line.rate) - numberValue(line.discountAmount));
  return taxable + taxable * numberValue(line.taxRate) / 100;
}

function inputClass(error?: string) {
  return cn("h-11 rounded-md", error && "border-destructive focus-visible:ring-destructive/30");
}

function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDateValue(value: unknown, fallback: string) {
  const text = String(value ?? "").trim();
  if (!text) return fallback;
  const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;
  const hasExplicitYear = /\b\d{4}\b/.test(text);
  if (!hasExplicitYear) return fallback;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? fallback : localDateString(parsed);
}

function formatDate(value: unknown) {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

function formatDateTime(value: unknown) {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function money(value: unknown) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(numberValue(value));
}

function buildSalesEinvoicePayload(form: EntryForm) {
  const isCgstSgst = form.placeOfSupply !== "igst";
  const totals = calculateSalesTotals(form.lines, form.roundOff);
  return {
    Version: "1.1",
    TranDtls: { TaxSch: "GST", SupTyp: "B2B", RegRev: "N", IgstOnIntra: "N" },
    DocDtls: { Typ: "INV", No: form.documentNo, Dt: formatGstPortalDate(form.documentDate) },
    BuyerDtls: { Gstin: form.partyGstin, LglNm: form.partyName, Pos: isCgstSgst ? "33" : "96", Addr1: firstAddressLine(form.billingAddress), Loc: "Tiruppur", Pin: 641607, Stcd: isCgstSgst ? "33" : "96" },
    ItemList: form.lines.map((line, index) => {
      const tax = salesTaxBreakup(line, isCgstSgst);
      return {
        SlNo: String(index + 1),
        PrdDesc: line.productName,
        IsServc: "N",
        HsnCd: line.hsnCode || "61091000",
        Qty: numberValue(line.quantity),
        Unit: line.unit || "NOS",
        UnitPrice: numberValue(line.rate),
        TotAmt: roundMoney(numberValue(line.quantity) * numberValue(line.rate)),
        Discount: numberValue(line.discountAmount),
        AssAmt: roundMoney(tax.taxable),
        GstRt: numberValue(line.taxRate),
        CgstAmt: roundMoney(tax.cgst),
        SgstAmt: roundMoney(tax.sgst),
        IgstAmt: roundMoney(tax.igst),
        TotItemVal: roundMoney(tax.total),
      };
    }),
    ValDtls: { AssVal: roundMoney(totals.taxable), CgstVal: isCgstSgst ? roundMoney(totals.gst / 2) : 0, SgstVal: isCgstSgst ? roundMoney(totals.gst / 2) : 0, IgstVal: isCgstSgst ? 0 : roundMoney(totals.gst), TotInvVal: roundMoney(totals.grand) },
  };
}

function buildSalesEwayPayload(form: EntryForm) {
  return {
    Irn: form.irn,
    Distance: 100,
    TransMode: "1",
    TransName: form.transportName,
    TransDocDt: formatGstPortalDate(form.documentDate),
    TransDocNo: form.documentNo,
    VehNo: form.vehicleNo,
    VehType: "R",
  };
}

function formatGstPortalDate(value: unknown) {
  const normalized = normalizeDateValue(value, localDateString());
  const [year, month, day] = normalized.split("-");
  return `${day}/${month}/${year}`;
}

function firstAddressLine(value: string) {
  return value.split(/\r?\n/).find((line) => line.trim())?.trim() || "-";
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function amountWords(value: number) {
  const rounded = Math.round(numberValue(value));
  if (rounded <= 0) return "Zero Rupees Only";
  const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const underHundred = (n: number) => n < 20 ? units[n] : [tens[Math.floor(n / 10)], units[n % 10]].filter(Boolean).join(" ");
  const underThousand = (n: number) => [n >= 100 ? `${units[Math.floor(n / 100)]} Hundred` : "", n % 100 ? underHundred(n % 100) : ""].filter(Boolean).join(" ");
  const parts = [
    [Math.floor(rounded / 10000000), "Crore"],
    [Math.floor((rounded % 10000000) / 100000), "Lakh"],
    [Math.floor((rounded % 100000) / 1000), "Thousand"],
    [rounded % 1000, ""],
  ] as const;
  return `${parts.map(([n, label]) => n ? `${underThousand(n)} ${label}`.trim() : "").filter(Boolean).join(" ")} Rupees Only`;
}
