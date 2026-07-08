import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listReceiptEntries,
  upsertReceiptEntry,
} from "./receipt.services";
import {
  advanceDocumentSetting,
  apiErrorText,
  ReceiptUpsertPage,
  type ReceiptEntryRecord,
} from "./receipt.workspace";
import { apiGet } from "../../api";

type ReceiptFormPageProps = {
  entry?: ReceiptEntryRecord | null;
  existingEntries?: ReceiptEntryRecord[];
  onBack?: () => void;
  onSaved?: (entry: ReceiptEntryRecord) => void;
};

export function ReceiptFormPage({
  entry = null,
  existingEntries,
  onBack,
  onSaved,
}: ReceiptFormPageProps) {
  const queryClient = useQueryClient();
  const entriesQuery = useQuery({
    queryKey: ["tenant", "entries", "receipt"],
    queryFn: listReceiptEntries,
    enabled: !existingEntries,
  });
  const sourceEntriesQuery = useQuery({
    queryKey: ["tenant", "entries", "sales", "receipt", "allocation-source"],
    queryFn: () => apiGet<ReceiptEntryRecord[]>("/billing/entries/sales", "tenant"),
  });
  const moduleEntries = existingEntries ?? entriesQuery.data ?? [];
  const saveMutation = useMutation({
    mutationFn: upsertReceiptEntry,
    onSuccess: async (result, input) => {
      if (!input.entryId) advanceDocumentSetting("receipt", result.entry.documentNo);
      await queryClient.invalidateQueries({ queryKey: ["tenant", "entries", "receipt"] });
      toast.success("Receipt saved", { description: result.entry.documentNo });
      onSaved?.(result.entry as ReceiptEntryRecord);
    },
    onError: (error) => toast.error("Receipt save failed", { description: apiErrorText(error, "Could not save receipt") }),
  });

  return (
    <ReceiptUpsertPage
      entry={entry}
      existingEntries={moduleEntries as ReceiptEntryRecord[]}
      kind="receipt"
      loading={saveMutation.isPending || entriesQuery.isLoading}
      sourceEntries={sourceEntriesQuery.data ?? []}
      onBack={onBack ?? (() => window.history.back())}
      onSave={(form) => saveMutation.mutate(form)}
    />
  );
}
