import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspacePage } from "@codexsun/ui/workspace";
import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";
import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { buildShowingLabel } from "@codexsun/ui/workspace/utils";
import { cn } from "@codexsun/ui/lib/utils";
import { ExportSalesFormPage } from "./export-sales.form";
import {
  archiveExportSalesEntry,
  commentOnExportSalesEntry,
  listExportSalesEntries,
  restoreExportSalesEntry,
  runExportSalesEntryTool,
} from "./export-sales.services";
import {
  apiErrorText,
  ExportSalesShowPage,
  entryMeta,
  formatDate,
  formatDateTime,
  money,
  statusOptions,
  TableHead,
  type ExportSalesEntryRecord,
} from "./export-sales.workspace";
import type { ExportSalesEntry } from "./export-sales.types";

type ExportSalesListView =
  | { mode: "list" }
  | { mode: "show"; entry: ExportSalesEntry }
  | { mode: "upsert"; entry: ExportSalesEntry | null };

export function ExportSalesListPage() {
  const meta = entryMeta.exportSales;
  const queryClient = useQueryClient();
  const [view, setView] = useState<ExportSalesListView>({ mode: "list" });
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const entriesQuery = useQuery({
    queryKey: ["tenant", "entries", "exportSales"],
    queryFn: listExportSalesEntries,
  });
  const archiveMutation = useMutation({
    mutationFn: archiveExportSalesEntry,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tenant", "entries", "exportSales"] });
      setView({ mode: "list" });
    },
    onError: (error) => toast.error("ExportSales archive failed", { description: apiErrorText(error, "Could not suspend export sales entry") }),
  });
  const restoreMutation = useMutation({
    mutationFn: restoreExportSalesEntry,
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["tenant", "entries", "exportSales"] });
      setView({ mode: "show", entry: result.entry });
    },
    onError: (error) => toast.error("ExportSales restore failed", { description: apiErrorText(error, "Could not restore export sales entry") }),
  });
  const commentMutation = useMutation({
    mutationFn: ({ body, entry }: { body: string; entry: ExportSalesEntry }) => commentOnExportSalesEntry(entry, body),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["tenant", "entries", "exportSales"] });
      setView({ mode: "show", entry: result.entry });
    },
    onError: (error) => toast.error("Comment failed", { description: apiErrorText(error, "Could not add comment") }),
  });
  const toolMutation = useMutation({
    mutationFn: ({ entry, tool, value }: { entry: ExportSalesEntry; tool: string; value?: string }) => runExportSalesEntryTool(entry, tool, value),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["tenant", "entries", "exportSales"] });
      setView({ mode: "show", entry: result.entry });
    },
    onError: (error) => toast.error("ExportSales tool failed", { description: apiErrorText(error, "Could not run export sales tool") }),
  });

  const entries = entriesQuery.data ?? [];
  const filtered = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    return entries.filter((entry) => {
      if (entry.entryType !== "exportSales") return false;
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
      <ExportSalesShowPage
        entry={entry as ExportSalesEntryRecord}
        kind="exportSales"
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
    return (
      <ExportSalesFormPage
        entry={view.entry as ExportSalesEntryRecord | null}
        existingEntries={entries as ExportSalesEntryRecord[]}
        onBack={() => setView(view.entry ? { mode: "show", entry: view.entry } : { mode: "list" })}
        onSaved={(entry) => setView({ mode: "show", entry: entry as ExportSalesEntry })}
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
        onFilterValueChange={(value: string) => {
          setStatusFilter(value);
          setCurrentPage(1);
        }}
        onSearchValueChange={(value: string) => {
          setSearchValue(value);
          setCurrentPage(1);
        }}
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
                  <td className="px-4 py-2">
                    <WorkspaceStatusBadge label={entry.status} tone={entry.status === "posted" ? "success" : entry.status === "cancelled" ? "danger" : "warning"} />
                  </td>
                  <td className="px-4 py-2">
                    <WorkspaceStatusBadge label={entry.paymentStatus} tone={entry.paymentStatus === "paid" ? "success" : entry.paymentStatus === "partial" ? "warning" : "neutral"} />
                  </td>
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
            {entriesQuery.isLoading ? "Loading export sales..." : "No export sales entries found."}
          </div>
        ) : null}
      </div>
      <WorkspacePagination
        page={currentPage}
        rowsPerPage={rowsPerPage}
        showingLabel={buildShowingLabel(currentPage, rowsPerPage, filtered.length)}
        singularLabel="export sales entries"
        totalCount={filtered.length}
        totalPages={totalPages}
        onNextPage={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
        onPageChange={setCurrentPage}
        onPreviousPage={() => setCurrentPage((page) => Math.max(1, page - 1))}
        onRowsPerPageChange={(rows) => {
          setRowsPerPage(rows);
          setCurrentPage(1);
        }}
      />
    </WorkspacePage>
  );
}