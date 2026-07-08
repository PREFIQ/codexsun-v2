import { useQuery } from "@tanstack/react-query";
import { listPurchaseEntries } from "./purchase.services";

export function usePurchaseEntries() {
  return useQuery({
    queryKey: ["tenant", "entries", "purchase"],
    queryFn: listPurchaseEntries,
  });
}