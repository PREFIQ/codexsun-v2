import { useQuery } from "@tanstack/react-query";
import { listReceiptEntries } from "./receipt.services";

export function useReceiptEntries() {
  return useQuery({
    queryKey: ["tenant", "entries", "receipt"],
    queryFn: listReceiptEntries,
  });
}