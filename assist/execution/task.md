# Execution Tasks

## Purpose

This file tracks the active coding batch for CODEXSUN. It turns planning notes into ordered, numbered work that humans and CODEIT can execute without losing scope.

Use it together with:

- `assist/blueprint/first-mvp.md` for baseline runtime scope.
- `assist/blueprint/framework-foundation.md` for framework boundaries.
- `assist/blueprint/platform-foundation.md` for platform boundaries.
- `assist/governance/quality-gates.md` for done criteria.

## Batch State

| Field | Value |
| --- | --- |
| Batch reference | `#2` |
| Target version | `1.0.2` |
| Status | `in_progress` |
| Focus | Platform and framework hardening after first MVP shell |
| Last updated | `2026-06-28` |

## Batch Goal

Make the platform foundation production-safe enough to build tenant-aware features next:

- Framework provides correlation IDs, health semantics, pooling, and test helpers.
- Platform package owns auth and tenant persistence.
- Platform app uses thin routes, a shared API client, and consistent web patterns.

## Out Of Scope For This Batch

- Billing, accounting, CRM, ecommerce workflows.
- Offline sync engine.
- Docker runtime stack.
- Mobile and desktop apps.
- ZERO and full CODEIT app.
- Redis queue adapters and event outbox persistence.

---

## Phase 1 — Framework Operational Glue

Owner: `@codexsun/framework`

Done when framework changes are typed, lint-clean, and covered by at least smoke tests.

### 1.1 Correlation ID middleware

- Add request hook in `createApiApp` to read or generate `x-correlation-id`.
- Attach correlation ID to the Fastify request context.
- Pass correlation ID into all `ok()` and `fail()` envelope meta fields.
- Document header behavior in `assist/governance/api-guidelines.md` if behavior changes.

### 1.2 Health route HTTP status policy

- Update `registerHealthRoute` to map aggregate health to HTTP status.
- Policy: return `503` when status is `down`; return `200` when status is `ok` or `degraded`.
- Document the policy in framework and API guidelines.

### 1.3 Database connection pool

- Add pool support to `@codexsun/framework/db` for MariaDB and mysql2 drivers.
- Expose `createDatabasePool()` with compatible `execute()` and `end()` semantics.
- Keep single-connection `connect()` for bootstrap and one-off admin tasks.

### 1.4 Graceful shutdown hooks

- Add optional shutdown hook registration in `createApiApp`.
- Ensure pools and long-lived resources can close cleanly on `SIGTERM` / `SIGINT`.
- Wire pool shutdown in `apps/platform/api`.

### 1.5 AppError adoption helpers

- Confirm `AppError` and `isAppError` cover common HTTP status cases.
- Add small factory helpers if needed for validation, auth, and not-found errors.
- Do not add business-rule errors to framework.

### 1.6 Structured request logging

- Add optional `registerRequestLogging(app)` helper.
- Log request start/end with `requestId`, `correlationId`, route, status, and duration.
- Use `createStructuredLog()` shape from `@codexsun/framework/logger`.

### 1.7 Shared envelope types for clients

- Export stable client-safe types from `@codexsun/framework/http`.
- Include `SuccessEnvelope`, `ErrorEnvelope`, and discriminated union helper types.
- Avoid pulling Fastify or Node-only code into client-facing exports.

### 1.8 Fastify inject test helpers

- Add `@codexsun/framework/testing` subpath or test helper module.
- Provide `createTestApiApp()` wrapper and envelope assertion helpers.
- Add smoke tests for envelope, health aggregation, and error handler behavior.

---

## Phase 2 — Platform Auth And Tenancy

Owner: `@codexsun/platform` + `apps/platform/api`

Done when login, session check, and logout survive API restart and tenant code resolves to the correct database.

### Hybrid auth mode (keep `JWT_SECRET`)

CODEXSUN uses a **hybrid auth strategy** per `assist/blueprint/decision-summary.md` and `foundation-blueprint.md`:

- **Web desks** (`/sa`, `/admin`, `/tenant`): secure HTTP-only cookie sessions.
- **Desktop and mobile** (later): access token + refresh token (JWT).

Keep **`JWT_SECRET`** as the single required signing secret for this batch. Do not rename it to `SESSION_SECRET` or `COOKIE_SECRET`.

Add a switchable auth mode so runtime behavior is explicit:

| Mode | Use |
| --- | --- |
| `cookie` | Web desk sessions only (current MVP default) |
| `jwt` | Bearer access/refresh tokens (desktop/mobile path) |
| `hybrid` | Cookie sessions for web plus JWT issuance where needed |

Implementation notes:

- `JWT_SECRET` signs cookie payloads through Fastify cookie secret **and** JWT access/refresh tokens when `jwt` or `hybrid` is active.
- Default local dev mode: `cookie` or `hybrid` with web cookie sessions enabled.
- Document `AUTH_MODE` (or equivalent) in `.env.example` alongside `JWT_SECRET`.
- Platform auth service chooses session store vs token issuer based on mode; routes stay thin.

### 2.1 Hybrid auth mode wiring

- Keep required `JWT_SECRET` env with no silent fallback.
- Add switchable `AUTH_MODE` with values `cookie`, `jwt`, or `hybrid`.
- Wire web desks to cookie sessions when mode is `cookie` or `hybrid`.
- Prepare JWT access/refresh issuance hooks for `jwt` and `hybrid` without breaking current web login.
- Document mode behavior in env examples and platform foundation notes.

### 2.2 Persistent session store

- Add session table migration in platform bootstrap path.
- Implement session repository in `@codexsun/platform/auth`.
- Replace `InMemorySessionStore` in runtime wiring.
- Preserve session fields: token, email, userType, tenantCode, createdAt, expiresAt.

### 2.3 Auth service layer

- Move login, session read, and logout orchestration out of route handlers.
- Route handlers should validate input, call service, and map results to HTTP.
- Use `AppError` for expected failures instead of inline `reply.code().send(fail())`.

### 2.4 Logout cookie cleanup

- Clear `codexsun_session` cookie on logout.
- Confirm cookie flags match login: `httpOnly`, `sameSite`, `secure`, `path`.

### 2.5 Tenant registry bootstrap

- Add master-database `tenants` table with code, name, database name, and status.
- Seed test tenant record for local development.
- Document tenant test record expectations in env notes.

### 2.6 Tenant lookup and database resolution

- Add tenant lookup service in `@codexsun/platform/tenant`.
- Resolve tenant code to tenant record and target database name.
- Reject login when tenant is missing, inactive, or mismatched.

### 2.7 Tenant-aware login flow

- Validate tenant code on tenant desk login in API and web.
- Remove hardcoded `"test"` tenant code from `LoginPage`.
- Connect tenant login to resolved tenant database instead of fixed test DB name only.

### 2.8 Auth endpoint consolidation

- Choose one session contract: keep `/auth/session` or `/auth/me`, not both.
- Update web client and docs to the chosen contract.
- Mark deprecated endpoint for removal in a later batch if temporary overlap is needed.

### 2.9 Shared database pool in platform API

- Replace per-request connect/end in auth and bootstrap paths with app-scoped pool where appropriate.
- Keep bootstrap create-database steps on admin connection path.

---

## Phase 3 — API Client And Web Standards

Owner: `apps/platform/web` + new shared client package if created

Done when web pages use one API client, TanStack Query for server state, and consistent loading/error/auth UX.

### 3.1 Shared API client package

- Create `@codexsun/api-client` or equivalent shared client module.
- Implement `apiGet`, `apiPost`, envelope parsing, and normalized API errors.
- Handle `credentials: "include"` and base URL configuration.

### 3.2 TanStack Query setup

- Add QueryClient provider in platform web entry.
- Create hooks for health and session queries.
- Replace ad hoc `useEffect` fetch patterns on status and auth flows.

### 3.3 AuthGate UX

- Add login link for blocked desk states.
- Map desk to correct login route: `/sa/login`, `/admin/login`, `/login`.
- Show explicit network/server error state when session check fails.

### 3.4 Login page hardening

- Catch network failures and show user-safe messages.
- Disable submit while loading; preserve field values on validation errors.
- Use router navigation instead of `window.location.href` after successful login.

### 3.5 Desk logout

- Add logout action in Super Admin, Staff Admin, and Tenant layouts.
- Call logout API, invalidate session query, and redirect to the correct login page.

### 3.6 Router navigation cleanup

- Replace raw `<a href>` navigation with TanStack Router `Link` where routes are internal.
- Keep full reload only where intentionally required.

### 3.7 Home page entry points

- Link Super Admin and Staff Admin login routes from the public home page.
- Keep Tenant Login and API Status links.

### 3.8 Remove or dev-gate demo workspace route

- Remove `/workspace` demo route from production route tree, or guard it behind development-only flag.
- Avoid shipping shadcn demo dashboard as part of MVP surface.

### 3.9 Env documentation

- Add `VITE_PLATFORM_API_URL` to `.env.example`.
- Document relationship between web origin, API origin, and CORS settings.

---

## Phase 4 — Migrations, Tests, And Quality Gates

Owner: `apps/platform` + `@codexsun/framework`

Done when schema changes are versioned and the batch has smoke coverage for auth, health, and bootstrap failure paths.

### 4.1 Versioned migration runner

- Introduce numbered migration files for master and tenant databases.
- Track applied migrations in existing `platform_migrations` and `tenant_migrations` tables.
- Keep first boot compatible with current bootstrap behavior.

### 4.2 Bootstrap failure policy

- Decide whether API should refuse auth routes when database bootstrap is not ready.
- Surface degraded bootstrap clearly on `/health` and status page.
- Document local recovery steps for common MariaDB auth errors.

### 4.3 Framework smoke tests

- Envelope helpers.
- Health status aggregation.
- Error handler mapping for `AppError` and unknown errors.

### 4.4 Platform API smoke tests

- Login success and invalid credentials.
- Session check for each desk user type.
- Logout destroys session and clears cookie.
- Health returns degraded when database bootstrap fails.

### 4.5 Platform web smoke tests

- Login form error rendering.
- AuthGate blocked and allowed states.
- Health page loading and refresh behavior.

### 4.6 Naming consistency pass

- Document mapping for Software Admin, Staff Admin, desk key `admin`, and userType `staff`.
- Align env names, UI labels, and API enums in one glossary note if full rename is deferred.

---

## Phase 5 — Platform Module Wiring

Owner: `@codexsun/platform` + `apps/platform`

Done when platform contracts begin to drive runtime behavior beyond auth.

### 5.1 Module registration pattern

- Register platform modules through `ModuleRegistry` or equivalent app bootstrap function.
- Keep framework free of business rules.

### 5.2 Users and roles read models

- Expose read-only user/session context needed by desk shells.
- Prepare role and permission contracts for route guards without full RBAC UI yet.

### 5.3 Audit event writer scaffold

- Use framework event contracts to record auth login, logout, and failed login events.
- Persist audit events in master database through platform adapter.

### 5.4 Activation and subscription guard placeholders

- Add no-op or minimal enforcement hooks for inactive tenant and missing subscription.
- Wire guard into tenant desk routes before business modules land.

### 5.5 Super Admin tenant management shell

- Add first SA desk screen for tenant list and tenant status visibility.
- Read from master `tenants` table only; no full provisioning workflow yet.

---

## Execution Order

Run phases in order unless a dependency note says otherwise.

1. Phase 1 — Framework Operational Glue
2. Phase 2 — Platform Auth And Tenancy
3. Phase 3 — API Client And Web Standards
4. Phase 4 — Migrations, Tests, And Quality Gates
5. Phase 5 — Platform Module Wiring

Recommended first slice for implementation:

- `1.1` Correlation ID middleware
- `1.2` Health route HTTP status policy
- `2.3` Auth service layer
- `2.4` Logout cookie cleanup
- `3.1` Shared API client package

## Task Status Legend

| Status | Meaning |
| --- | --- |
| `planned` | Not started |
| `in_progress` | Active work |
| `blocked` | Waiting on dependency or decision |
| `done` | Completed and verified |
| `deferred` | Moved out of this batch |

## Completion Checklist

Before closing Batch `#2`:

- [ ] All Phase 1 tasks marked `done`
- [ ] All Phase 2 tasks marked `done`
- [ ] All Phase 3 tasks marked `done`
- [ ] All Phase 4 tasks marked `done`
- [ ] Phase 5 tasks either `done` or explicitly `deferred` with reason
- [ ] `assist/documentation/CHANGELOG.md` updated under correct Database Changes / App Codebase Changes sections
- [ ] Version bump performed only as an explicit release task
- [ ] Quality gates from `assist/governance/quality-gates.md` checked for build and review
