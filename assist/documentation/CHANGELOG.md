# Changelog

## Version State

Current version: 1.0.5

Release tag: v-1.0.5

Changelog label: v 1.0.5

Historical changelog entries are immutable. A version bump may update this Version State block and add a new entry, but it must not rewrite old entry labels.

New changelog entries must keep database-facing work and application code work separate:

#### Database Changes

Records schema, migration, seed, tenant provisioning, and data compatibility changes.

#### App Codebase Changes

Records UI, API, service logic, tooling, and documentation changes.

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
