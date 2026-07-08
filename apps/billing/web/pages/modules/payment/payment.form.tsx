import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listPaymentEntries,
  upsertPaymentEntry,
} from "./payment.services";
import {
  advanceDocumentSetting,
  apiErrorText,
  PaymentUpsertPage,
  type PaymentEntryRecord,
} from "./payment.workspace";
import { apiGet } from "../../api";

type PaymentFormPageProps = {
  entry?: PaymentEntryRecord | null;
  existingEntries?: PaymentEntryRecord[];
  onBack?: () => void;
  onSaved?: (entry: PaymentEntryRecord) => void;
};

export function PaymentFormPage({
  entry = null,
  existingEntries,
  onBack,
  onSaved,
}: PaymentFormPageProps) {
  const queryClient = useQueryClient();
  const entriesQuery = useQuery({
    queryKey: ["tenant", "entries", "payment"],
    queryFn: listPaymentEntries,
    enabled: !existingEntries,
  });
  const sourceEntriesQuery = useQuery({
    queryKey: ["tenant", "entries", "purchase", "payment", "allocation-source"],
    queryFn: () => apiGet<PaymentEntryRecord[]>("/billing/entries/purchase", "tenant"),
  });
  const moduleEntries = existingEntries ?? entriesQuery.data ?? [];
  const saveMutation = useMutation({
    mutationFn: upsertPaymentEntry,
    onSuccess: async (result, input) => {
      if (!input.entryId) advanceDocumentSetting("payment", result.entry.documentNo);
      await queryClient.invalidateQueries({ queryKey: ["tenant", "entries", "payment"] });
      toast.success("Payment saved", { description: result.entry.documentNo });
      onSaved?.(result.entry as PaymentEntryRecord);
    },
    onError: (error) => toast.error("Payment save failed", { description: apiErrorText(error, "Could not save payment") }),
  });

  return (
    <PaymentUpsertPage
      entry={entry}
      existingEntries={moduleEntries as PaymentEntryRecord[]}
      kind="payment"
      loading={saveMutation.isPending || entriesQuery.isLoading}
      sourceEntries={sourceEntriesQuery.data ?? []}
      onBack={onBack ?? (() => window.history.back())}
      onSave={(form) => saveMutation.mutate(form)}
    />
  );
}
