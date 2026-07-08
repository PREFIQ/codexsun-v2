import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listQuotationEntries,
  upsertQuotationEntry,
} from "./quotation.services";
import {
  advanceDocumentSetting,
  apiErrorText,
  QuotationUpsertPage,
  type QuotationEntryRecord,
} from "./quotation.workspace";

type QuotationFormPageProps = {
  entry?: QuotationEntryRecord | null;
  existingEntries?: QuotationEntryRecord[];
  onBack?: () => void;
  onSaved?: (entry: QuotationEntryRecord) => void;
};

export function QuotationFormPage({
  entry = null,
  existingEntries,
  onBack,
  onSaved,
}: QuotationFormPageProps) {
  const queryClient = useQueryClient();
  const entriesQuery = useQuery({
    queryKey: ["tenant", "entries", "quotation"],
    queryFn: listQuotationEntries,
    enabled: !existingEntries,
  });
  const moduleEntries = existingEntries ?? entriesQuery.data ?? [];
  const saveMutation = useMutation({
    mutationFn: upsertQuotationEntry,
    onSuccess: async (result, input) => {
      if (!input.entryId) advanceDocumentSetting("quotation", result.entry.documentNo);
      await queryClient.invalidateQueries({ queryKey: ["tenant", "entries", "quotation"] });
      toast.success("Quotation saved", { description: result.entry.documentNo });
      onSaved?.(result.entry as QuotationEntryRecord);
    },
    onError: (error) => toast.error("Quotation save failed", { description: apiErrorText(error, "Could not save quotation") }),
  });

  return (
    <QuotationUpsertPage
      entry={entry}
      existingEntries={moduleEntries as QuotationEntryRecord[]}
      kind="quotation"
      loading={saveMutation.isPending || entriesQuery.isLoading}
      onBack={onBack ?? (() => window.history.back())}
      onSave={(form) => saveMutation.mutate(form)}
    />
  );
}
