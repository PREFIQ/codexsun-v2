import { useQuery } from "@tanstack/react-query";
import { listQuotationEntries } from "./quotation.services";

export function useQuotationEntries() {
  return useQuery({
    queryKey: ["tenant", "entries", "quotation"],
    queryFn: listQuotationEntries,
  });
}