import { billingMigrations } from "@codexsun/billing/migrations";
import type { Migration } from "../migration-runner.js";
import { migration as m001 } from "./001_tenant_foundation.js";

export const tenantMigrations: Migration[] = [
  m001,
  ...billingMigrations
];
