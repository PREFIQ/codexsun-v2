import { useQuery } from "@tanstack/react-query";
import { listExportSalesEntries } from "./export-sales.services";

export function useExportSalesEntries() {
  return useQuery({
    queryKey: ["tenant", "entries", "exportSales"],
    queryFn: listExportSalesEntries,
  });
}