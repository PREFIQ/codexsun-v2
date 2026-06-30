# Task 20 - Safe Database Migrations, Backups, Dumps, Mirroring, And Legacy Client Sync

## Command For Agent

Build a safe database migration and data movement foundation for CODEXSUN before production tenants depend on live data. The super-admin must be able to review database version state, run local-tested migrations safely, download database dumps, verify backups, monitor mirror/sync health, and manage legacy client migration mapping from older custom apps into the CODEXSUN tenant structure.

This task is serious production safety work. Do not treat database structure changes as normal code changes. Every schema change must have a version, migration record, backup checkpoint, local test restore, rollback/forward-fix plan, and tenant-aware execution path.

## Batch State

| Field | Value |
| --- | --- |
| Task reference | `task_20` |
| Status | `in progress` |
| Depends on | Existing migration runner, backup/disaster recovery docs, release/versioning policy, tenant isolation rules |
| Focus | Safe migrations, database version maintenance, dump download, backup schedule, data mirroring, legacy client table mapping and sync |
| Last updated | `2026-06-30` |

## Current Context

CODEXSUN already has:

- Platform migration runner: `apps/platform/api/src/db/migration-runner.ts`
- Master migration index: `apps/platform/api/src/db/migrations/master-index.ts`
- Migration runner tests: `apps/platform/api/src/__tests__/migration-runner.test.ts`
- Super-admin database page placeholder: `apps/platform/web/src/pages/sa/DatabaseManager.tsx`
- Super-admin migration status page: `apps/platform/web/src/pages/sa/MigrationStatus.tsx`
- Backup policy doc: `assist/operations/backup-disaster-recovery.md`
- Release checklist: `assist/operations/release-checklist.md`
- Versioning and database changelog policy: `assist/operations/versioning.md`

Task 20 must extend this into an executable production-grade workflow.

## Non-Negotiable Rules

- No production migration runs without a recent verified backup.
- No destructive migration runs directly on live data without a staged expand/migrate/contract plan.
- No manual random database structure changes in production. Every schema change must become a tracked migration.
- Every migration must be idempotent or safely skipped after it is recorded.
- Every migration must record database version, migration id, checksum, started time, finished time, status, actor, target database, and error details.
- Tenant databases must migrate separately and preserve tenant isolation.
- Super-admin migration actions must require permission, confirmation, audit logging, and environment guardrails.
- Local test must happen first using a restored dump, not only an empty database.
- Backup restore must be tested on a schedule. Untested backup is not considered safe.
- Dump download must never expose secrets casually. It must require permission and create an audit trail.
- Legacy client migration must use explicit mapping definitions. Do not import unknown old tables directly into production tables.

## Database Version Contract

Add or extend migration metadata so the system can answer:

- What app version is deployed?
- What platform database version is applied?
- What tenant database version is applied for each tenant?
- Which migrations are pending?
- Which migrations failed?
- Which migrations were skipped?
- Which migration changed which tables?
- Which backup/dump was created before migration?
- Which operator approved and executed it?

Suggested metadata tables:

```text
platform_migrations
tenant_migrations
database_versions
database_migration_runs
database_backup_runs
database_restore_tests
legacy_import_batches
legacy_import_mappings
legacy_import_row_results
```

Minimum `database_migration_runs` fields:

| Field | Purpose |
| --- | --- |
| `id` | Run id |
| `scope` | `platform` or `tenant` |
| `tenant_id` | Required for tenant scope |
| `database_name` | Target database |
| `migration_id` | Migration identifier |
| `checksum` | File/content checksum |
| `app_version` | Deployed app version |
| `database_version_before` | Version before run |
| `database_version_after` | Version after run |
| `status` | pending/running/succeeded/failed/skipped |
| `backup_run_id` | Backup checkpoint before migration |
| `started_at` | Run start |
| `finished_at` | Run finish |
| `actor_user_id` | Super-admin/operator |
| `error_message` | Failure summary |
| `log_path` | Full logs/artifacts |

## Safe Migration Strategy

Use expand/migrate/contract:

1. Expand
   - Add nullable columns, new tables, indexes, or compatibility structures.
   - Keep old code paths working.
   - Avoid dropping/renaming existing columns immediately.

2. Migrate
   - Backfill data in batches.
   - Record progress and allow resume.
   - Validate row counts, checksums, and business totals.
   - Keep writes compatible while backfill runs.

3. Contract
   - Remove old columns/tables only after code is deployed, data is verified, and rollback window is closed.
   - Require separate approval for destructive cleanup.

Migration file rules:

- Use ordered names such as `005_add_tenant_database_versions.ts`.
- Never edit an already-applied migration. Add a new corrective migration.
- Include a clear description.
- Include affected tables in metadata.
- Include validation SQL where possible.
- Include expected runtime and risk level in comments or metadata.
- For large tenant data, use batch migration workers instead of one long blocking transaction.

## Super-Admin Database Tools

Build or extend super-admin screens/APIs for:

- Database overview:
  - platform database version
  - tenant database versions
  - pending migrations
  - last backup time
  - last restore-test time
  - mirror lag/status

- Migration status:
  - pending/applied/failed/skipped migrations
  - platform and per-tenant filters
  - migration details and logs
  - preflight result
  - backup checkpoint link

- Migration execution:
  - preflight check
  - dry run where supported
  - run on local/restored database first
  - run platform migration
  - run selected tenant migration
  - run all tenants with batch limits
  - pause/resume tenant batch
  - retry failed migration after fix

- Dump download:
  - download platform database dump
  - download selected tenant dump
  - download schema-only dump
  - download data-only dump
  - download compressed encrypted dump where supported
  - audit every download

- Backup and restore:
  - run backup now
  - view scheduled backups
  - view backup retention
  - run restore test into sandbox
  - mark backup verified only after restore validation passes

## Migration Preflight Checklist

Before running migration:

- Confirm current app version.
- Confirm target migration list and checksums.
- Confirm database connection points to intended environment.
- Confirm migration is allowed in the current environment.
- Confirm recent backup exists and is restorable.
- Confirm enough disk space for backup and logs.
- Confirm no long-running import/sync job conflicts.
- Confirm tenant count and estimated rows.
- Confirm migration has been tested locally on a restored dump.
- Confirm release checklist database section is updated.
- Confirm rollback or forward-fix plan is written.

## Local Test First Workflow

Every database migration must be tested locally before production:

1. Download or create a recent dump from a safe environment.
2. Restore into a local database.
3. Run migration preflight.
4. Run pending migrations.
5. Run application tests.
6. Run API smoke tests for affected modules.
7. Run data validation SQL.
8. Export post-migration schema snapshot.
9. Compare row counts and important totals.
10. Record result in `storage/verification` or migration run logs.

Required commands/scripts to add:

```text
npm run db:migrations:list
npm run db:migrations:preflight
npm run db:migrations:run
npm run db:migrations:test-local
npm run db:dump:create
npm run db:dump:download
npm run db:restore:test
npm run db:backup:verify
```

These can wrap environment-specific tools, but the project must expose stable commands for agents and operators.

## Backup Schedule

Baseline schedule:

| Backup Type | Frequency | Retention | Notes |
| --- | --- | --- | --- |
| Platform full backup | Daily | 30 days | Include metadata, users, tenants, config |
| Tenant full backup | Daily | 30 days | Per tenant database or tenant schema |
| High-volume tenant incremental/PITR | 15 min to 1 hour | 7 to 30 days | Depends on hosting support |
| File storage backup | Daily | 30 days | Align with database backup |
| Pre-migration backup | Before every production migration | Keep through rollback window | Required |
| Monthly archive backup | Monthly | 1 year or compliance policy | Encrypted |
| Restore test | Weekly for platform, monthly per tenant sample | Record result | Backup is unsafe until restore tested |

Backup requirements:

- Encrypt dumps at rest.
- Store backups away from the primary server.
- Keep access restricted to authorized super-admin/ops roles.
- Log backup creation, download, restore, and deletion.
- Include checksum and size.
- Monitor backup failure and alert immediately.

## Mirroring And Disaster Recovery

Add a mirror/replication plan for a different server:

- Primary database server handles live writes.
- Secondary server receives replicated data or scheduled encrypted dumps.
- Monitor mirror lag.
- Alert if lag exceeds agreed threshold.
- Do not allow both servers to accept writes unless a proper multi-primary design exists.
- Test failover in a controlled sandbox.
- Document DNS/application cutover steps.

Suggested mirror health fields:

```text
server_name
source_database
target_database
last_sync_at
last_success_at
lag_seconds
status
error_message
checked_at
```

Minimum disaster recovery targets:

- Define RPO for normal tenants.
- Define RPO for enterprise/high-volume tenants.
- Define RTO for platform outage.
- Define single-tenant restore process.
- Define full platform restore process.

## Legacy Client Migration And Sync

This project must support old client apps built with different codebases and table structures. Build a controlled import/sync pipeline.

### Legacy Intake

For each old client app collect:

- old database engine and version
- old schema dump
- old sample data dump
- table list and row counts
- primary keys and unique keys
- relationship map
- files/storage paths
- business modules used by the client
- data quality issues
- timezone, currency, tax/GST assumptions
- active users and roles
- cutover date and freeze window

### Mapping Definitions

Create explicit mapping files per legacy source:

```text
assist/migrations/legacy/<client-key>/source-inventory.md
assist/migrations/legacy/<client-key>/mapping.md
assist/migrations/legacy/<client-key>/validation.md
assist/migrations/legacy/<client-key>/cutover.md
```

Mapping must define:

- source table
- source column
- target CODEXSUN module
- target table
- target column
- transform rule
- required/default value
- lookup dependency
- conflict rule
- validation rule

Example:

| Source | Target | Rule |
| --- | --- | --- |
| `customers.name` | `masters_contacts.name` | trim, required |
| `customers.mobile` | `contact_phones.phone_number` | normalize phone, mark primary |
| `products.gst` | `common_taxes.rate_percent` | map or create tax record |
| `orders.order_no` | `masters_orders.code` | preserve if unique, otherwise prefix legacy source |

### Import Pipeline

Build the legacy pipeline in stages:

1. Extract old data into a staging database or staging tables.
2. Profile source data and report missing/invalid fields.
3. Transform into CODEXSUN staging format.
4. Validate references and required fields.
5. Dry-run import and produce row-level results.
6. Import into a sandbox tenant.
7. User verifies data in UI.
8. Run final import during cutover window.
9. Run delta sync for changes after initial import if needed.
10. Lock old app or switch it to read-only after cutover.

### Sync Modes

Support these modes:

- One-time migration: old app stops, CODEXSUN starts.
- Initial import plus delta sync: old app continues during transition.
- Read-only archive sync: old app data remains available for reference.
- Module-by-module migration: contacts/products first, transactions later.

Sync safety rules:

- Every imported row stores legacy source id.
- Imports must be idempotent by source system and source id.
- Conflicts must be reported, not silently overwritten.
- Deletes from old system should not hard-delete CODEXSUN records automatically.
- Sync jobs must be tenant-scoped.
- Sync logs must show counts: read, created, updated, skipped, failed.

## API And Service Requirements

Add backend services/routes for:

- list migration state
- run migration preflight
- run migration batch
- get migration logs
- create backup job
- list backup jobs
- download dump with permission check
- run restore test
- list mirror health
- list legacy import batches
- create legacy import mapping
- run legacy import dry-run
- run legacy import into sandbox tenant
- run final legacy import with approval

All routes must:

- require super-admin permission
- audit actor, tenant, action, IP/session where available
- return structured validation errors
- never leak database credentials

## Frontend Requirements

Super-admin should provide clear pages for:

- Database Manager
- Migration Status
- Backup And Dumps
- Mirror Health
- Legacy Migration

The UI must show danger clearly but calmly:

- Environment badge: local/staging/production.
- Production actions require confirmation.
- Failed migrations show error summary and logs.
- Backup freshness is visible before migration.
- Tenant migration progress is visible per tenant.
- Legacy import dry-run results are downloadable.

## Testing Requirements

Add tests for:

- migration runner records applied and pending migrations
- migration runner records failed migration status
- checksum mismatch is blocked or flagged
- migration preflight blocks missing backup in production
- tenant migration runs only for selected tenant
- backup job records checksum, size, and status
- dump download requires permission and is audited
- restore test records success/failure
- legacy mapping validates required target fields
- legacy import dry-run is idempotent
- legacy import preserves source id mapping
- sync conflict is reported

Local verification must include:

```text
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test -w @codexsun/platform-api
npm.cmd run db:migrations:test-local
npm.cmd run db:restore:test
```

If database tools need real MySQL/PostgreSQL locally, document exact environment variables and safe sample data.

## Documentation Updates

Update:

- `assist/operations/backup-disaster-recovery.md`
- `assist/operations/release-checklist.md`
- `assist/operations/versioning.md`
- `assist/architecture/data-strategy.md`
- `assist/documentation/CHANGELOG.md`

Create:

- `assist/operations/database-migration-runbook.md`
- `assist/operations/database-backup-runbook.md`
- `assist/operations/legacy-client-migration-runbook.md`

Docs must explain:

- how to create a migration
- how to test migration locally with restored dump
- how to run migration in production
- how to download a dump safely
- how to restore and verify backup
- how mirroring works
- how to map old client tables
- how to run dry-run and final import
- how to handle failed migration or sync conflict

## Acceptance Criteria

- Super-admin can see platform and tenant database version status.
- Super-admin can see pending, applied, failed, and skipped migrations.
- Migration run records include actor, timestamps, status, checksum, backup id, and target database.
- Production migration preflight blocks when verified backup is missing.
- Local restored-dump migration test workflow exists and is documented.
- Dump create/download workflow exists with permission checks and audit logs.
- Backup schedule and restore-test schedule are documented and represented in the database/API plan.
- Mirror health status can be recorded and viewed.
- Legacy client mapping format exists.
- Legacy import dry-run reports row-level success/failure.
- Legacy import is idempotent by source system and source id.
- Tests cover migration safety, backup verification, dump permission, and legacy mapping/import behavior.
- Documentation/runbooks are complete enough for another agent/operator to execute without guessing.

## Completion Checklist

- [x] Existing migration runner reviewed and extended safely.
- [x] Migration metadata tables added.
- [x] Database version tracking added for platform and tenants.
- [x] Migration checksum tracking added.
- [x] Failed migration status and logs added.
- [x] Migration preflight service added.
- [x] Production backup requirement enforced.
- [ ] Local restored-dump migration test command added.
- [x] Super-admin Database Manager updated.
- [x] Super-admin Migration Status updated.
- [x] Backup job metadata added.
- [x] Dump create/download flow added.
- [x] Restore-test workflow added.
- [ ] Backup schedule documented.
- [x] Mirror health metadata/API/UI added.
- [ ] Legacy source inventory template added.
- [x] Legacy mapping template added.
- [ ] Legacy import staging plan added.
- [x] Legacy import dry-run implemented.
- [ ] Legacy import row result logging added.
- [ ] Legacy sync conflict rules added.
- [x] API tests added.
- [ ] Local migration/restore verification performed.
- [ ] Runbooks created.
- [ ] Changelog updated.

## Completion Criteria

Task 20 is complete only when a future database change can be created, tested on a restored local dump, backed up, run safely for platform and tenant databases, audited from super-admin, restored from backup in a test environment, and documented with version status. Legacy client migration is complete only when an old client schema can be mapped, dry-run into staging, validated row by row, and imported or synced into a tenant without losing source identity or tenant isolation.
