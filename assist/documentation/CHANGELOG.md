# Changelog

## Version State

Current version: 1.0.1

Release tag: v-1.0.1

Changelog label: v 1.0.1

Historical changelog entries are immutable. A version bump may update this Version State block and add a new entry, but it must not rewrite old entry labels.

New changelog entries must keep database-facing work and application code work separate:

#### Database Changes

Records schema, migration, seed, tenant provisioning, and data compatibility changes.

#### App Codebase Changes

Records UI, API, service logic, tooling, and documentation changes.

## v-1.0.1

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
