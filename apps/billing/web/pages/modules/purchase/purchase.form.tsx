import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listPurchaseEntries,
  upsertPurchaseEntry,
} from "./purchase.services";
import {
  advanceDocumentSetting,
  apiErrorText,
  PurchaseUpsertPage,
  type PurchaseEntryRecord,
} from "./purchase.workspace";

type PurchaseFormPageProps = {
  entry?: PurchaseEntryRecord | null;
  existingEntries?: PurchaseEntryRecord[];
  onBack?: () => void;
  onSaved?: (entry: PurchaseEntryRecord) => void;
};

export function PurchaseFormPage({
  entry = null,
  existingEntries,
  onBack,
  onSaved,
}: PurchaseFormPageProps) {
  const queryClient = useQueryClient();
  const entriesQuery = useQuery({
    queryKey: ["tenant", "entries", "purchase"],
    queryFn: listPurchaseEntries,
    enabled: !existingEntries,
  });
  const moduleEntries = existingEntries ?? entriesQuery.data ?? [];
  const saveMutation = useMutation({
    mutationFn: upsertPurchaseEntry,
    onSuccess: async (result, input) => {
      if (!input.entryId) advanceDocumentSetting("purchase", result.entry.documentNo);
      await queryClient.invalidateQueries({ queryKey: ["tenant", "entries", "purchase"] });
      toast.success("Purchase saved", { description: result.entry.documentNo });
      onSaved?.(result.entry as PurchaseEntryRecord);
    },
    onError: (error) => toast.error("Purchase save failed", { description: apiErrorText(error, "Could not save purchase") }),
  });

  return (
    <PurchaseUpsertPage
      entry={entry}
      existingEntries={moduleEntries as PurchaseEntryRecord[]}
      kind="purchase"
      loading={saveMutation.isPending || entriesQuery.isLoading}
      onBack={onBack ?? (() => window.history.back())}
      onSave={(form) => saveMutation.mutate(form)}
    />
  );
}
