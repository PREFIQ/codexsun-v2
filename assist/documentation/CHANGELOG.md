# Changelog

## Version State

Current version: 1.0.13

Release tag: v-1.0.13

Changelog label: v 1.0.13

Historical changelog entries are immutable. A version bump may update this Version State block and add a new entry, but it must not rewrite old entry labels.

New changelog entries must keep database-facing work and application code work separate:

#### Database Changes

Records schema, migration, seed, tenant provisioning, and data compatibility changes.

#### App Codebase Changes

Records UI, API, service logic, tooling, and documentation changes.

## v-1.0.13

### [v 1.0.13] 2026-06-30 11:48 am - Super Admin Apps And Industries DB Backing

#### Database Changes

- Database update: Yes.
- Extended the existing platform catalog migration with persisted `platform_modules` status/default flags and a new `platform_industries` table.
- Added bootstrap repair so existing local master databases receive Apps and Industry tables/columns during preflight.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.13`.
- Added DB-backed `/admin/platform-apps` list/create/update APIs for the Apps module.
- Added DB-backed `/admin/industries` list/create/update APIs for the Industry module.
- Rewired Super Admin Apps and Industry pages to load, save, update, refresh, show, and persist through API/database only.
- Removed frontend seed records from Apps and Industry module configs.
- Added API tests for Apps and Industry persistence.
- Added Playwright coverage for Apps and Industry list + show + upsert persistence after refresh.

## v-1.0.12

### [v 1.0.12] 2026-06-30 11:35 am - Super Admin Master Workspace Modules

#### Database Changes

- Database update: Yes.
- Added fresh master foundation support for `tenant_subscriptions` and `subscription_plans`.
- Added bootstrap repair for subscription and plan tables so existing local master databases can self-heal during preflight.
- Kept existing migration files rewritten in-place for fresh migration flow, avoiding extra patch migrations for this foundation stage.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.12`.
- Reviewed current module readiness: Tenant, Domain, Plan, and Subscription are DB/API-backed; Apps and Industry remain shared workspace-module screens and can move next unless DB-backed boundaries are requested.
- Added Domain DB-backed list/show/upsert with tenant lookup, landing app, primary switch, status, and permanent force-delete confirmation.
- Added Subscription DB-backed list/show/upsert with tenant lookup, Plan autocomplete/create, billing cycle, seats, amount, currency, start date, renewal date, notes, and status.
- Added dedicated Plan module with reusable plan records and Subscription autocomplete binding.
- Removed generic `Owner` field/column/show value from shared Super Admin module forms; retained explicit `Owner team` fields where module configs intentionally define them.
- Added reusable workspace `DatePicker` using shadcn-style popover/calendar/select controls with month/year selection.
- Improved workspace lookup clear behavior so dropdown remains usable immediately after clear without requiring blur/focus.
- Added e2e coverage for Domain create/persist/force-delete, Subscription plan/tenant lookup/date picker persistence, and Super Admin sidebar visibility.

## v-1.0.11

### [v 1.0.11] 2026-06-29 5:30 pm - Platform Super Admin Closure And App Boundary Verification

#### Database Changes

- Database update: No schema changes.
- Removed `business.master-data` module key from `platformModuleCatalog`; added `core.contact`, `core.company`, `core.product` keys.
- Removed `business.master-data.view` and `business.master-data.manage` permissions from role-permission map.

#### App Codebase Changes

- **Task 14 artifact removal**: Deleted `packages/platform/src/master-data/` (contracts, service, repository, index), `apps/platform/api/src/master-data/routes.ts`, and `apps/platform/api/src/__tests__/master-data.test.ts`.
- **app.ts cleanup**: Removed all master-data imports, service instantiation, Fastify decoration, and route registration from `apps/platform/api/src/app.ts`.
- **Platform package**: Removed `master-data` export from `packages/platform/src/index.ts`. Updated permission types in `packages/platform/src/permissions/contracts.ts`.
- **Tenant Domains API**: Added `GET/POST/DELETE /admin/tenants/:tenantId/domains` routes in `apps/platform/api/src/admin/routes.ts` for CRUD against existing `tenant_domain_mappings` table.
- **Migration Runner API**: Added `POST /admin/migrations/run` endpoint to trigger pending master migrations.
- **Tenant Database API**: Added `GET /admin/databases` endpoint to list tenant database records.
- **Super Admin UI**: Created 9 new SA page components under `apps/platform/web/src/pages/sa/`: `TenantDomains` (domain CRUD with tenant selector), `Subscriptions` (plan scaffold), `Industries` (vertical scaffold), `QueueManager` (job queue scaffold), `DatabaseManager` (migration status + tenant DB list), `DevDocs` (architecture reference with sidebar nav), `Support` (helpdesk scaffold), `ZetroSetup` (AI assistant scaffold), `GstSetup` (tax compliance scaffold).
- **Admin Desk**: Enhanced `AdminDesk.tsx` with 4 nav views (Dashboard, Support Queue, Activation Review, Helpdesk).
- **SA Desk**: Extended `SaDesk.tsx` nav with Domains, Subscriptions, Industries, DB Manager, Queue, Support, Dev Docs, ZETRO, GST entries — 22 total navigation items.
- **Tenant Desk**: Removed obsolete master-data and master-records nav items from `TenantDesk.tsx`; kept Contacts, Item Categories, Units, Tax Categories.
- **Core Route Tests**: Created `apps/platform/api/src/__tests__/core-routes.test.ts` with 28 tests covering `/core/common/*` definitions/records, `/core/contacts/*`, `/core/companies/*`, and `/core/products/*` CRUD and archive/restore.
- **Boundary Review**: Updated `assist/architecture/module-boundaries.md` with comprehensive app boundary table, table ownership, package dependency direction, migration verification, Task 14 artifact cleanup checklist, and 8 boundary decisions.
- Updated catalog test to reflect new module key names (`core.contact`, `core.company`, `core.product`).
- All 10 workspace packages pass typecheck and lint; **102 API tests + 30 framework tests + 11 platform tests = 143 total passing**.

## v-1.0.10

### [v 1.0.10] 2026-06-29 11:15 am - Core App Common And Master Module Foundation

#### Database Changes

- Database update: No (in-memory repositories; DB-backed pending future task).
- Added `core` module key to `platformModuleCatalog` in `packages/platform/src/catalog/contracts.ts`.
- Added `corePermissions` (8 permission keys) to `packages/platform/src/permissions/contracts.ts`, assigned to `super_admin` and `tenant` user types.

#### App Codebase Changes

- Bumped root workspace pattern to include `apps/*` so single-level app packages are recognised.
- Created `apps/core` (`@codexsun/core`) with subpath exports for common, master/*, shared, api, and testing modules.
- **Common Definition Registry** (`apps/core/src/common/contracts.ts`): 30 definition types (countries, states, districts, cities, pincodes, contact groups/types, address types, bank names, product groups/categories/types, units, HSN codes, tax categories, brands, colours, sizes, styles, currencies, priorities, payment terms, accounting years, months, sales account types, order types, transports, warehouses, destinations, stock rejection types) with scope, seedable flag, fields, permissions, and feature key. 30+ default seed records for countries, contact types, address types, units, bank names, currencies, payment terms, months, priorities, accounting years.
- **Common Record Service** (`apps/core/src/common/service.ts`): `CoreDefinitionService` and `CoreRecordService` with CRUD, archive/restore, duplicate-code detection, seedDefaults.
- **In-Memory Repository** (`apps/core/src/common/repository.ts`): `CoreRecordRepository` interface + `InMemoryCoreRecordRepository` with tenant-scoped filter, archive/restore.
- **Contact Master Module** (`apps/core/src/master/contacts/`): `ContactProfile` with phone/email/address/social/bank/tax child blocks, CRUD, archive/restore.
- **Company Master Module** (`apps/core/src/master/companies/`): `CompanyProfile` with legal/trade name, addresses, bank accounts, tax identities, CRUD, archive/restore.
- **Product/Item Master Module** (`apps/core/src/master/products/`): `ProductItem` with code/name/group/category/type/unit/HSN/tax/attributes, CRUD, archive/restore.
- **Shared Blocks** (`apps/core/src/shared/`): `AddressBlock`, `PhoneBlock`, `EmailBlock`, `BankAccountBlock`, `TaxIdentityBlock` reusable value-object types.
- **Core API Routes** (`apps/core/src/api/`): 26+ endpoints under `/core/common/*`, `/core/contacts/*`, `/core/companies/*`, `/core/products/*` with session, tenant context, active tenant, feature activation (`core`), permission (`core.*.view`/`core.*.manage`), and audit guards (correlationId in response meta and audit events).
- **Route Registration** (`apps/core/src/api/index.ts`): `registerAllCoreRoutes()` accepts a `CoreRouteContext` for injecting platform guard functions, enabling loose coupling between core routes and platform API.
- **Platform API Wiring** (`apps/platform/api/src/app.ts`): Core services (`CoreDefinitionService`, `CoreRecordService`, `CoreContactService`, `CoreCompanyService`, `CoreProductService`) created, decorated on FastifyInstance, and routes registered via `registerAllCoreRoutes` with `requireSession`, `requireActiveTenant`, `requireFeatureEnabled`, `requirePermission` from existing guards.
- **Fastify Augmentation**: Added `@codexsun/framework/api` import in core api module for `correlationId`/`tenantId` request properties; custom `auditRecordEvent()` helper casts through `(app as any)` to avoid type conflicts with platform's `AuditService`.
- **Existing Task 14 master-data** (platform-owned) retained for backward compatibility; core routes use separate `/core/*` prefix with enhanced definitions (30 vs 11) and richer child blocks.
- All 7 workspace packages pass typecheck, lint, build, and 129 tests (30 framework + 74 existing API + 25 master-data).

## v-1.0.9

### [v 1.0.9] 2026-06-29 10:30 am - Foundation Closure Audit And Business Readiness Gate

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Bumped workspace version to 1.0.9.
- Completed Task 13 (Foundation Closure Audit & Business Readiness Gate).
- Performed comprehensive foundation coverage audit across all 13 task files, 11 core documentation files, and the actual codebase.
- Updated task statuses: tasks 7-13 changed from `planned` to `done`; batch root `task.md` changed from `in_progress` to `complete`.
- Fixed documentation inconsistency in `api-guidelines.md`: `x-correlation-id` was marked "Removed" but has been restored since v1.0.4; updated to reflect current state with `correlationId` in envelope meta.
- Verified all 5 workspace packages pass typecheck, lint, and 74 integration tests.
- Produced foundation readiness decision: **READY FOR BUSINESS MODULES**.
- Created `assist/handoff/task_13_handoff.md` with full checklist, remaining blockers, deferred items, and recommended next task.
- All six workspace packages pass typecheck and lint cleanly.

## v-1.0.8

### [v 1.0.8] 2026-06-29 10:20 am - Settings, Files, Notifications, Activity, And Agent Workbench Foundation

#### Database Changes

- Database update: Yes (auto-check).
- Added `004_master_settings_files_notifications` migration with 7 new tables: `platform_settings`, `platform_feature_flags`, `file_metadata`, `notification_records`, `agent_action_audits`, `activity_timeline`, `comments`.

#### App Codebase Changes

- Bumped workspace version to 1.0.8.
- Implemented Task 9 (Settings & Configuration Foundation), Task 10 (Document File & Print Template Foundation), Task 11 (Notification, Mail & Activity Foundation), and Task 12 (Developer & Agent Workbench Foundation).
- **Settings (Task 9):** Created `SettingsService` + `MasterDbSettingsRepository` in `packages/platform/src/settings/` for CRUD, secret masking, feature flag management, and console setting sections.
- **Files (Task 10):** Created `FileService` + `InMemoryFileRepository` in `packages/platform/src/files/` for file metadata CRUD, tenant isolation, and storage adapter wiring.
- **Templates (Task 10):** Created `TemplateService` + `InMemoryTemplateRepository` in `packages/platform/src/templates/` for print template registry with seeded defaults (invoice, quote, receipt).
- **Notifications (Task 11):** Created `NotificationService` + `InMemoryNotificationRepository` in `packages/platform/src/notifications/` for notification CRUD, mail template list, and mail queue job placeholder.
- **Activity (Task 11):** Created `ActivityService` + `InMemoryActivityRepository` in `packages/platform/src/activity/` for activity timeline and comment system with tenant isolation.
- **Agents (Task 12):** Created `AgentService` + `InMemoryAgentRepository` in `packages/platform/src/agents/` for agent permission model, tool registry, prompt template registry, agent action audit, and provider settings.
- Added generic `recordEvent()` method to `AuditService` for custom audit events.
- Added subpath exports in `@codexsun/platform/package.json` for activity, agents, files, and templates modules.
- Created 9 new route files (settings, activity, files, notifications, templates, agents) with 30+ endpoints covering all foundation modules.
- Added `004_master_settings_files_notifications.ts` migration with 7 new tables.
- Wired all 7 new services in `apps/platform/api/src/app.ts` with Fastify decoration and route registration.
- Created 3 new UI pages: `PlatformSettings.tsx` (runtime, auth, mail, system defaults, support), `FeatureFlags.tsx` (enable/disable per tenant with audit), `WorkbenchPage.tsx` (4-tab shell: Tool Registry, Prompt Templates, Action Audit, Provider Settings).
- Added 31 integration tests for all foundation endpoints; total 74 tests pass across 4 test files.
- All six workspace packages pass typecheck and lint cleanly.

## v-1.0.7

### [v 1.0.7] 2026-06-29 10:05 am - Platform Admin Console And User Role & Permission UI

#### Database Changes

- Database update: No schema changes.

#### App Codebase Changes

- Bumped workspace version to 1.0.7.
- Implemented Task 7 (Platform Admin Console) and Task 8 (User Role & Permission UI).
- Created `UserService` with `MasterDbUserRepository` in `packages/platform/src/users/service.ts` for CRUD, suspend, activate on super_admin_users and staff_users.
- Created `RoleService` with `InMemoryRoleRepository` in `packages/platform/src/roles/service.ts` for role CRUD, permission matrix, system role definitions.
- Extended `SessionStore` interface and both implementations (`InMemorySessionStore`, `DatabaseSessionStore`) with `listAsync()`.
- Added `getSessionStore()` to `AuthService`.
- Rewrote `apps/platform/api/src/admin/routes.ts` with 20+ admin endpoints: console dashboard, tenant CRUD + suspend/restore, module catalog + enable/disable, audit viewer, migration status, health check, platform users CRUD, role management, permission matrix, session list + revoke.
- Wired `userService`, `roleService` in api `app.ts`; seeded system roles from contracts.
- Created 10 admin sub-pages under `apps/platform/web/src/pages/sa/` using `@codexsun/ui` components and TanStack Query: ConsoleHome, TenantList, ModuleActivation, AuditViewer, MigrationStatus, HealthView, UserList, RoleList, PermissionMatrix, SessionList.
- Refactored `SaDesk.tsx` with state-based page routing and navigation bar.
- Fixed BigInt serialization with `toNumber()` helper for MariaDB COUNT/SUM.
- Fixed `audit_events` INSERT to omit `tenant_id` column (schema compatibility).
- Added 25 admin integration tests; all 43 tests pass (18 existing + 25 new).
- All six workspace packages pass typecheck and lint cleanly.

## v-1.0.6

### [v 1.0.6] 2026-06-29 6:25 pm - Workspace Design System And Reusable List Patterns

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Bumped workspace version to 1.0.6.
- Created reusable workspace building blocks in `@codexsun/ui/src/workspace/`: page, panel, header, actions, field, section, status, table, filters, pagination, row-actions, show, upsert, line-table, totals, print, motion, autocomplete, editor, drag-drop, types, utils.
- Created workspace presets in `@codexsun/ui/src/workspace/presets/`: common-list, master-list, entry-list.
- Wrapped third-party UI libraries (framer-motion, @tiptap, react-hook-form, @hookform/resolvers) behind CODEXSUN workspace wrappers.
- Added subpath exports to `@codexsun/ui/package.json` for workspace, presets, components, and lib paths.
- Created three template pages with dummy data in Platform Web: CommonListTemplatePage (Tenant Domains), MasterListTemplatePage (Contacts), EntryListTemplatePage (Invoices).
- Added three design routes: `/design/common-list`, `/design/master-list`, `/design/entry-list`.
- Built one reusable workspace list/show foundation; CommonList, MasterList, EntryList use the same base blocks.
- Implemented list -> show -> upsert flow for all three templates with local dummy state.
- Added print preview for entry (Invoice) flow.
- Added line-table with editable sub-table rows and totals calculation for entry upsert.
- Removed unused imports across template pages to satisfy strict lint rules.
- All six workspace packages pass typecheck and lint cleanly.

## v-1.0.5

### [v 1.0.5] 2026-06-29 8:54 am - Framework And Platform Module Readiness

#### Database Changes

- Database update: Yes (auto-check).
- Extracted monolithic bootstrap into versioned MigrationRunner with ordered migrations.
- Created `platform_modules` and `tenant_module_activation` tables for module catalog and feature activation.

#### App Codebase Changes

- Bumped workspace version to 1.0.5.
- Redesigned `ModuleRegistry` with rich `ModuleContract` (moduleKey, displayName, scope, version, requiredPermissions, requiredFeatureKey, migrationKey).
- Added `sourceModule`, `actorEmail` to `DomainEvent` and `QueueJob` contracts.
- Created platform module catalog (`@codexsun/platform/catalog`) with `ModuleCatalogService` and stable module keys for platform and future tenant modules.
- Defined permission keys (`platform.tenant.profile.view`, `platform.audit.activity.view`, `platform.user.profile.manage`, etc.) and role-to-permission mapping (`super_admin`, `staff`, `tenant`, `system`).
- Replaced placeholder `requirePermission()` with real check against `userTypeHasPermission()`.
- Created `PermissionService` at `@codexsun/platform/permissions`.
- Created `ActivationService` with DB-backed `isEnabled`, `requireEnabled`, `isTenantActive`, `requireTenantActive` checks.
- Created `SubscriptionService` with `requireSubscriptionAllowed` placeholder.
- Created `MigrationRunner` at `apps/platform/api/src/db/migration-runner.ts` for ordered, repeatable, startup-safe migrations.
- Split bootstrap schema into versioned migration files: `001_master_foundation`, `002_master_audit_sessions`, `003_master_platform_catalog`.
- Added read-only admin support endpoints: `GET /admin/modules`, `GET /admin/modules/:tenantId`, `GET /admin/audit`, `GET /admin/migrations`.
- Added 11 platform package unit tests for permissions, catalog contracts, and migration runner.
- Framework tests remain at 30 passing, platform tests at 15 passing (30 + 11 + 5 = 46 total).

## v-1.0.4

### [v 1.0.4] 2026-06-29 8:54 am - Restore Correlation ID And Harden Platform Foundation

#### Database Changes

- Database update: Yes (auto-check).
- Added `correlation_id` column to `audit_events` table.

#### App Codebase Changes

- Bumped workspace version to 1.0.4.
- Restored `correlationId` to framework envelope (`ResponseMeta`, `createMeta`, `ok`, `fail`) at `packages/framework/src/http/envelope.ts`.
- Restored `correlationId` to `StructuredLog` at `packages/framework/src/logger/logger.ts`.
- Restored `correlationId` to `DomainEvent` contract at `packages/framework/src/events/contracts.ts`.
- Restored `correlationId` to `QueueJob` contract at `packages/framework/src/queue/contracts.ts`.
- Restored `correlationId` to `FastifyRequest` decoration and `x-correlation-id` header read/echo at `packages/framework/src/api/tenant-context.ts`.
- Restored `correlationId` propagation in `create-api-app.ts` error handler and root route.
- Restored `correlationId` to structured request logging at `packages/framework/src/api/request-logging.ts`.
- Restored `correlationId` to health route meta at `packages/framework/src/api/health-route.ts`.
- Added `correlationId` to `AuditEvent` contract at `packages/platform/src/audit/contracts.ts`.
- Wired `correlationId` through all `AuditService` methods (auth login/logout, tenant lifecycle).
- Stored `correlation_id` in `MasterDbAuditRepository` insert at `packages/platform/src/audit/repository.ts`.
- Changed tenant `delete` to archive (set status=inactive) in `TenantService` and `MasterDbTenantRepository`.
- Added `correlationId` propagation in auth routes and tenant routes audit calls.
- Updated framework envelope tests to verify `correlationId` presence/absence.
- Updated error handler tests to verify `x-correlation-id` echo and auto-generation.
- Updated health route tests to verify `correlationId` in health meta.
- Updated platform API tests with archive verification, duplicate-archive rejection, and `x-correlation-id` echo test.

## v-1.0.3

### [v 1.0.3] 2026-06-29 8:54 am - JWT-only auth, preflight probe, lint clean

#### Database Changes

- Database update: Yes (auto-check).
- Added `tenant_id` column to `audit_events` table.

#### App Codebase Changes

- Bumped workspace version to 1.0.3.
- Added guard helpers: `requireSession`, `requireUserType`, `requireSuperAdmin`, `requireTenantMatch` (`apps/platform/api/src/auth/guards.ts`).
- Added permission/activation guard placeholders: `requirePermission`, `requireActiveTenant`, `requireFeatureEnabled`.
- Created `MasterDbTenantRepository` (`packages/platform/src/tenant/repository.ts`) with list/getById/findByCode/create/update/delete/resolveDatabase.
- Created `TenantService` (`packages/platform/src/tenant/service.ts`) with validation, duplicate detection, and DTO mapping.
- Created `MasterDbAuditRepository` (`packages/platform/src/audit/repository.ts`) and `AuditService` (`packages/platform/src/audit/service.ts`).
- Wired audit events for `auth.login.success`, `auth.login.failed`, `auth.logout`, `tenant.created`, `tenant.updated`, `tenant.deleted`.
- Split tenant CRUD routes out of auth routes into dedicated `apps/platform/api/src/tenant/routes.ts`.
- Updated tenant routes to use guard helpers and tenant service instead of raw SQL.
- Added 9 tenant management API tests covering list, create (success/duplicate/missing fields), read, update, and auth guards.
- Removed AUTH_MODE entirely; switched from cookie/hybrid to JWT-only auth with no fallback.
- Created JWT utilities at `packages/platform/src/auth/jwt.ts` using Node built-in `crypto.createHmac` (HMAC-SHA256, zero extra dependencies).
- Simplified `AuthService` constructor to `(jwtSecret, tenantLookup, userFinder)` — `jwtSecret` is now required, `DatabaseSessionStore` dependency removed.
- Updated login and session routes to always return/expect a Bearer JWT token; removed all cookie-related branches.
- Added per-desk JWT token storage in `apps/platform/web/src/api.ts` with separate `localStorage` keys (`codexsun_session_sa`, `codexsun_session_admin`, `codexsun_session_tenant`).
- Rewired `AuthGate` to validate JWT client-side (decode payload, check `exp` + `userType`) instead of making a network round-trip.
- Created `TenantLayout` at `packages/ui/src/layouts/tenant-layout.tsx` matching the SuperLayout/AdminLayout pattern.
- All three desks (SaDesk, AdminDesk, TenantDesk) now share the same composition pattern.
- Created `tools/env-jwt-secret.mjs` for generating a random 32-byte hex `JWT_SECRET`; added `npm run env:jwt-secret`.
- Synced `.env` and `.env.example` with all 22 schema variables plus `PLATFORM_WEB_PORT`, `VITE_PLATFORM_API_URL`, `VITE_TENANT_NAME`, and `CODEXSUN_DEV_PORT_POLICY`.
- Updated ESLint config (`eslint.config.js`) to allow empty catch blocks and underscore-prefixed unused parameters, keeping lint clean across all 6 packages.
- Replaced unreliable `netstat`-only port check in `tools/preflight.mjs` with a `net.createServer` probe (`probePort`) that directly tests whether the port can be bound, eliminating `EADDRINUSE` race conditions on restart.
- Hardened platform API dev startup so preflight checks the configured host, stops watcher child trees on Windows, and registers graceful shutdown before listening.
- Fixed the preflight probe handoff by waiting for the temporary socket to close before launching the API watcher, preventing Windows `EADDRINUSE` races.
- Removed loose tenant route database casts so `@codexsun/platform-api` lint runs without warnings.

### [v 1.0.2] 2026-06-28 9:47 pm - sidebar trigger bar icon

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace version to 1.0.2.
- Changed the shared sidebar trigger icon from the panel glyph to the bar menu glyph used by the workspace top bar.
- Replaced the workspace switcher active mark with the shared Lucide check icon.
- Converted the inset sidebar/topbar shell into a reusable role-driven dashboard template.
- Wired Super Admin, Staff Admin, and Tenant desks to the shared template with dynamic menu, submenu, workspace switcher, branding, and user footer data.
- Cleaned framework strict optional typing so uncached type checks remain green under the current TypeScript settings.
- Wired framework correlation IDs through request context, response headers, envelopes, and structured request logs.
- Added explicit `AUTH_MODE` support for cookie, bearer, and hybrid web/API session flows.
- Removed the hidden tenant-code default from auth validation and login form state.
- Tightened platform service, tenant lookup, session store, API client, and test helper types to keep framework/platform lint clean.

## v-1.0.1

### [v 1.0.1] 2026-06-28 11:15 pm - dynamic browser page title

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Changed the Platform Web fallback browser title to `Codexsun | Dashboard`.
- Added route-aware document title updates so the text after `|` follows the open page.
- Added `VITE_TENANT_NAME` so the title prefix can come from the tenant display name.

### [v 1.0.1] 2026-06-28 11:05 pm - branded billing desk shell

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Wired the platform web app to the stored CODEXSUN logo, dark logo, and favicon assets.
- Added a Billing Desk top menu with sidebar toggle, workspace switcher dropdown, and right-side desk actions.
- Reworked the inset sidemenu branding, version footer, and signed-in user dropdown to match the super-admin desk references.
- Added the Billing Desk overview card above the dashboard content.

### [v 1.0.1] 2026-06-28 10:45 pm - consistent sidebar gutter

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Fixed inset sidebar collapsed width so the sidebar-to-workspace gutter remains consistent while toggling.
- Made the sidebar rail indicator transparent by default and removed the native rail tooltip title.

### [v 1.0.1] 2026-06-28 10:35 pm - matched inset panel surfaces

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Matched the inset sidemenu and workspace panel border, radius, and shadow treatments.
- Moved inset sidemenu panel styling into the shared sidebar primitive so shell surfaces stay consistent.

### [v 1.0.1] 2026-06-28 10:25 pm - shadcn b26 default theme

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Generated the shadcn b26 Vite preset with `npx shadcn@latest init --preset b26 --template vite` in a scratch folder.
- Reset `@codexsun/ui` theme tokens to the b26 default OKLCH neutral palette.
- Updated chart and sidebar token references to support direct OKLCH CSS variables.
- Aligned `components.json` with the b26 preset metadata.
- Added an assist rule requiring agents to ask before changing technology choices when commands are doubtful or conflicting.

### [v 1.0.1] 2026-06-28 10:15 pm - clearer neutral shell borders

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Darkened the shared neutral border tokens for clearer sidebar and workspace separation.
- Added an inset workspace panel border so it visually matches the bordered sidemenu.

### [v 1.0.1] 2026-06-28 10:10 pm - medium sidemenu radius

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Rounded the visible inset sidemenu panel corners with the design system medium radius.

### [v 1.0.1] 2026-06-28 10:05 pm - bordered inset sidemenu

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Added a border around the visible inset sidemenu panel in both expanded and collapsed states.

### [v 1.0.1] 2026-06-28 9:55 pm - inset sidemenu rail toggle

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Made the sidemenu default to the inset sidebar variant.
- Restored `SidebarRail` so the inset sidemenu can collapse and expand from the sidebar edge.

### [v 1.0.1] 2026-06-28 9:45 pm - inset workspace shell

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Changed the workspace `AppLayout` sidebar usage from floating to inset while preserving icon collapse.
- Removed the sidemenu boundary rail so the workspace no longer shows the rail hover tooltip target.

### [v 1.0.1] 2026-06-28 9:35 pm - icon-collapsing sidemenu

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Rebuilt the sidemenu block from the temp shadcn reference into the active `AppSidebar`.
- Added a `sidemenu/sub` renderer for grouped menu sections with collapsible submenu support.
- Changed the floating app sidebar to collapse into an icon rail instead of hiding off-canvas.
- Removed raw temp sidemenu sample files with unresolved `@/` imports from the compiled UI package.

### [v 1.0.1] 2026-06-28 9:20 pm - floating app sidebar layout

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Changed `AppLayout` to use the shadcn floating sidebar shell with a 19rem sidebar width.
- Replaced the app header title with a sidebar trigger, separator, and workspace breadcrumb.
- Kept the workspace dashboard content composition unchanged while updating the surrounding shell.

### [v 1.0.1] 2026-06-28 9:05 pm - warning-free dev preflight

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Updated the root npm package manager metadata to npm 11.17.0.
- Removed the Windows shell-based dev process launch from `tools/preflight.mjs` to clear Node DEP0190 startup warnings.
- Made the preflight launcher prefer workspace-local CLI binaries so Platform Web starts with its declared Vite version.

### [v 1.0.1] 2026-06-28 8:55 pm - quiet protected route session check

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Added `/auth/session` as a non-error session probe for protected frontend desks.
- Updated `AuthGate` to use the quiet session endpoint so expected unauthenticated visits no longer emit `/auth/me` 401 console noise.

### [v 1.0.1] 2026-06-28 8:45 pm - Tailwind v4 styling foundation

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Migrated Platform Web styling to Tailwind v4 using the `@tailwindcss/vite` plugin.
- Replaced the old Tailwind/PostCSS config-driven setup with CSS-first theme tokens in `@codexsun/ui/styles.css`.
- Removed Tailwind v3 `tailwind.config.cjs`, PostCSS config files, and unused PostCSS/autoprefixer dependencies.
- Updated sidebar utilities to Tailwind v4 custom-property shorthand and restored `--spacing` based layout sizing.
- Aligned Platform Web to the current Vite toolchain and removed unused Vite tooling from `@codexsun/ui`.

### [v 1.0.1] 2026-06-28 8:20 pm - named ui layouts

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Replaced the generic `AppShell` layout with named UI layouts: `WebLayout`, `AuthLayout`, `AppLayout`, `AdminLayout`, and `SuperLayout`.
- Centralized the shadcn dashboard sidebar frame inside `AppLayout` and simplified the workspace dashboard to content-only composition.
- Moved dashboard metric cards back into the sidemenu dashboard block and removed stale layout exports.
- Wired public, auth, tenant, admin, and super-admin pages to their specific layout modules.
- Replaced placeholder sidebar menu links with real app routes.

### [v 1.0.1] 2026-06-28 8:05 pm - ui layouts folder

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Moved shared shell/layout files from `@codexsun/ui` components into `src/layouts`.
- Rewired dashboard workspace imports to consume `SiteHeader` and `SectionCards` from the layouts folder.
- Kept public `@codexsun/ui` exports stable while separating primitive components from page/layout composition.

### [v 1.0.1] 2026-06-28 7:55 pm - shadcn component foundation

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Installed the available shadcn component primitives into `@codexsun/ui` under `src/components`.
- Rewired generated component imports to package-local paths and exported the component set from `@codexsun/ui`.
- Removed duplicated reusable component copies from the dashboard block folder, leaving only block-specific sidemenu files.
- Kept CODEXSUN compatibility behavior on shared `Button`, `Card`, and `Field` while preserving shadcn component APIs.
- Moved generated component dependencies onto the `@codexsun/ui` workspace package and kept the root package dependency list clean.

### [v 1.0.1] 2026-06-28 7:35 pm - shadcn dashboard block

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Added shadcn `dashboard-01` under `@codexsun/ui` at `blocks/menu/sidemenu`.
- Added the provided dashboard table data as the block data source.
- Exported the dashboard block from `@codexsun/ui` and mounted it at Platform Web `/workspace`.
- Added standard shadcn aliases and a root TypeScript config for shadcn CLI workspace resolution.
- Moved reusable shadcn primitives into shared `@codexsun/ui` components and rewired the sidemenu block to consume them.
- Split dashboard-heavy frontend vendor chunks so the Platform Web production build stays warning-free.

### [v 1.0.1] 2026-06-28 7:20 pm - npm install cleanup

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Aligned internal workspace dependency versions to `1.0.1` so npm install resolves local packages instead of querying the public registry.
- Approved expected esbuild install scripts used by Vite and tsx so npm install runs without allow-scripts warnings.

### [v 1.0.1] 2026-06-28 7:15 pm - dev port preflight

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Added a dev preflight launcher that checks configured Platform API and Web ports before startup.
- Automatically stops existing local listener processes on dev ports unless `CODEXSUN_DEV_PORT_POLICY=abort` is set.
- Wired Platform API and Web dev scripts through the preflight launcher to avoid `EADDRINUSE` restarts.

### [v 1.0.1] 2026-06-28 7:05 pm - env driven seed auth

#### Database Changes

- Database update: Yes.
- Changed first user seeding to read optional `SUPER_ADMIN_*`, `SOFTWARE_ADMIN_*`, and `TENANT_ADMIN_*` values from environment configuration.
- Existing seeded user rows are updated only when their matching environment values are present.

#### App Codebase Changes

- Replaced `SESSION_SECRET` with required `JWT_SECRET` with no code fallback.
- Removed hardcoded seeded login credentials from the Platform Web login forms.
- Updated environment examples and MVP notes so live deployments can leave seed users blank.

### [v 1.0.1] 2026-06-28 6:55 pm - mariadb auth recovery

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Changed Platform API database bootstrap to start in degraded mode instead of crashing when MariaDB rejects the configured account.
- Added explicit `auth_gssapi_client` diagnostics in the API health details.
- Added `npm run db:create-user` helper to create a normal password-based `codexsun_app` MariaDB user when an admin login is available.
- Updated Framework env loading to find the root `.env` when workspace dev commands run from nested app folders.
- Updated environment example to prefer the dedicated app database user instead of `root`.

### [v 1.0.1] 2026-06-28 6:11 pm - root dist and shadcn ui wiring

#### Database Changes

- Database update: Yes (auto-check).

#### App Codebase Changes

- Bumped workspace version to 1.0.1.

## v-1.0.0

### [v 1.0.0] 2026-06-28 6:35 pm - root dist and shadcn ui wiring

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Routed Platform API build output to root `dist/apps/platform/api`.
- Routed Platform Web build output to root `dist/apps/platform/web`.
- Added root build cleanup and package output collection into `dist/packages/...`.
- Added Tailwind CSS, PostCSS, shadcn-compatible configuration, and `components.json`.
- Reworked `@codexsun/ui` primitives around Tailwind and shadcn-style variants while keeping the existing app component API.
- Wired Platform Web to consume the shared `@codexsun/ui/styles.css` Tailwind entrypoint.

### [v 1.0.0] 2026-06-28 6:20 pm - platform package foundation

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Added `@codexsun/platform` package with tenant, auth, users, roles, permissions, subscription, activation, audit, notifications, and settings subpaths.
- Moved Platform auth request contract, desk user-type mapping, password hashing, verification, and development session store into `@codexsun/platform/auth`.
- Rewired Platform API login, session, and seed hashing to use Platform package auth primitives.
- Added Platform foundation documentation and updated the agent reading order.

### [v 1.0.0] 2026-06-28 6:10 pm - mariadb driver compatibility

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Added MariaDB native connector support in `@codexsun/framework/db`.
- Defaulted Platform API database connections to the MariaDB driver to avoid `mysql2` failing on `auth_gssapi_client` authentication.
- Kept `mysql2` connector support available through `DB_DRIVER=mysql2` for compatible database users.
- Added `DB_DRIVER=mariadb` to `.env.example`.

### [v 1.0.0] 2026-06-28 6:00 pm - github helper workflow

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Added changelog parsing helper for latest versioned entry commit subjects.
- Added old-style `github:now` helper with changed-file review, optional version bump, commit message review, pull with rebase/autostash, add, commit, and push.
- Replaced `version:bump` script with the command-style version bump helper that updates root and workspace package versions, package lock state, and the active changelog.
- Added `check:versions` to verify package versions and changelog Version State alignment.

### [v 1.0.0] 2026-06-28 5:00 pm - fresh platform scaffold

#### Database Changes

- Database update: Yes.
- Added first automatic master database bootstrap for `codexsun_master_db`.
- Added first automatic tenant test database bootstrap for `tenant_test_001_db`.
- Added foundation seed users for Super Admin, Staff Admin, and test Tenant Admin.

#### App Codebase Changes

- Added `@codexsun/framework` with API boot, env loading, response envelopes, app errors, health checks, module registry, structured log shape, database connector, event, queue, and storage contracts.
- Rewired Platform API to use Framework bootstrap, health route, response envelope, env loading, and database connector.
- Updated Platform web status page for the framework health response shape.
- Added framework foundation documentation and updated the agent reading order.
- Started fresh from zero while keeping the `assist/` knowledge base.
- Added npm workspaces, Turborepo, strict TypeScript, ESLint, Prettier, and environment example.
- Added Platform API scaffold with health endpoint, auth endpoints, cookie sessions, database bootstrap, migrations, and seeders.
- Added Platform web scaffold with public home, status page, separate auth pages, Super Admin Desk, Staff Admin Desk, and Tenant Desk.
- Added `@codexsun/ui` as the first shared design system package.
- Added manual version and changelog tooling under `tools/version`.
