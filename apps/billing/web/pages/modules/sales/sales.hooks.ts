import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getSalesSettings,
  listSalesEntries,
  persistSalesSettings,
} from "./sales.services";
import type { SalesSettings } from "./sales.types";

export function useSalesEntries() {
  return useQuery({
    queryKey: ["tenant", "entries", "sales"],
    queryFn: listSalesEntries,
  });
}

export function useSalesSettingsState() {
  const [settings, setSettingsState] = useState<SalesSettings>(() => getSalesSettings());

  function setSettings(updater: SalesSettings | ((current: SalesSettings) => SalesSettings)) {
    setSettingsState((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      persistSalesSettings(next);
      return next;
    });
  }

  function publish() {
    persistSalesSettings(settings);
  }

  return { publish, setSettings, settings };
}
