import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listSalesEntries,
  upsertSalesEntry,
} from "./sales.services";
import {
  advanceDocumentSetting,
  apiErrorText,
  SalesUpsertPage,
  type SalesEntryRecord,
} from "./sales.workspace";

type SalesFormPageProps = {
  entry?: SalesEntryRecord | null;
  existingEntries?: SalesEntryRecord[];
  onBack?: () => void;
  onSaved?: (entry: SalesEntryRecord) => void;
};

export function SalesFormPage({
  entry = null,
  existingEntries,
  onBack,
  onSaved,
}: SalesFormPageProps) {
  const queryClient = useQueryClient();
  const entriesQuery = useQuery({
    queryKey: ["tenant", "entries", "sales"],
    queryFn: listSalesEntries,
    enabled: !existingEntries,
  });
  const salesEntries = existingEntries ?? entriesQuery.data ?? [];
  const saveMutation = useMutation({
    mutationFn: upsertSalesEntry,
    onSuccess: async (result, input) => {
      if (!input.entryId) advanceDocumentSetting("sales", result.entry.documentNo);
      await queryClient.invalidateQueries({ queryKey: ["tenant", "entries", "sales"] });
      toast.success("Sales saved", { description: result.entry.documentNo });
      onSaved?.(result.entry as SalesEntryRecord);
    },
    onError: (error) => toast.error("Sales save failed", { description: apiErrorText(error, "Could not save sales") }),
  });

  return (
    <SalesUpsertPage
      entry={entry}
      existingEntries={salesEntries as SalesEntryRecord[]}
      kind="sales"
      loading={saveMutation.isPending || entriesQuery.isLoading}
      onBack={onBack ?? (() => window.history.back())}
      onSave={(form) => saveMutation.mutate(form)}
    />
  );
}
