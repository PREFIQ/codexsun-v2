import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listExportSalesEntries,
  upsertExportSalesEntry,
} from "./export-sales.services";
import {
  advanceDocumentSetting,
  apiErrorText,
  ExportSalesUpsertPage,
  type ExportSalesEntryRecord,
} from "./export-sales.workspace";

type ExportSalesFormPageProps = {
  entry?: ExportSalesEntryRecord | null;
  existingEntries?: ExportSalesEntryRecord[];
  onBack?: () => void;
  onSaved?: (entry: ExportSalesEntryRecord) => void;
};

export function ExportSalesFormPage({
  entry = null,
  existingEntries,
  onBack,
  onSaved,
}: ExportSalesFormPageProps) {
  const queryClient = useQueryClient();
  const entriesQuery = useQuery({
    queryKey: ["tenant", "entries", "exportSales"],
    queryFn: listExportSalesEntries,
    enabled: !existingEntries,
  });
  const moduleEntries = existingEntries ?? entriesQuery.data ?? [];
  const saveMutation = useMutation({
    mutationFn: upsertExportSalesEntry,
    onSuccess: async (result, input) => {
      if (!input.entryId) advanceDocumentSetting("exportSales", result.entry.documentNo);
      await queryClient.invalidateQueries({ queryKey: ["tenant", "entries", "exportSales"] });
      toast.success("ExportSales saved", { description: result.entry.documentNo });
      onSaved?.(result.entry as ExportSalesEntryRecord);
    },
    onError: (error) => toast.error("ExportSales save failed", { description: apiErrorText(error, "Could not save export sales") }),
  });

  return (
    <ExportSalesUpsertPage
      entry={entry}
      existingEntries={moduleEntries as ExportSalesEntryRecord[]}
      kind="exportSales"
      loading={saveMutation.isPending || entriesQuery.isLoading}
      onBack={onBack ?? (() => window.history.back())}
      onSave={(form) => saveMutation.mutate(form)}
    />
  );
}
