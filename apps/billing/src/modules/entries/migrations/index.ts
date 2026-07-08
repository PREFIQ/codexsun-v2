import { migration as tenantEntryDocumentsMigration } from "./009_tenant_entries.js";
import { migration as tenantEntryComplianceMigration } from "./010_tenant_entry_compliance.js";

export { tenantEntryDocumentsMigration, tenantEntryComplianceMigration };

export const entriesMigrations = [
  tenantEntryDocumentsMigration,
  tenantEntryComplianceMigration,
];
