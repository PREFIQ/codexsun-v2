import type { Migration } from "../migration-runner.js";
import { migration as m001 } from "./001_master_foundation.js";
import { migration as m002 } from "./002_master_audit_sessions.js";
import { migration as m003 } from "./003_master_platform_catalog.js";
import { migration as m004 } from "./004_master_settings_files_notifications.js";
import { migration as m005 } from "./005_database_operations_safety.js";
import { migration as m006 } from "./006_platform_registry.js";
import { migration as m007 } from "./007_platform_registry_drilldown.js";
import { migration as m008 } from "./008_platform_media_assets.js";

export const masterMigrations: Migration[] = [
  m001,
  m002,
  m003,
  m004,
  m005,
  m006,
  m007,
  m008
];
