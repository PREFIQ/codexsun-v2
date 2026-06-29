import type { Migration } from "../migration-runner.js";
import { migration as m001 } from "./001_master_foundation.js";
import { migration as m002 } from "./002_master_audit_sessions.js";
import { migration as m003 } from "./003_master_platform_catalog.js";

export const masterMigrations: Migration[] = [
  m001,
  m002,
  m003
];
