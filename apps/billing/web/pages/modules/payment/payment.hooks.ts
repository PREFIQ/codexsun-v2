import { useQuery } from "@tanstack/react-query";
import { listPaymentEntries } from "./payment.services";

export function usePaymentEntries() {
  return useQuery({
    queryKey: ["tenant", "entries", "payment"],
    queryFn: listPaymentEntries,
  });
}