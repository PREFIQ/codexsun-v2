# Task 3 - Foundation Hardening And Release Readiness Review

## Purpose

This task is the next senior-engineer handoff after `assist/execution/task_1.md` and `assist/execution/task_2.md`.

Do not expand CODEXSUN into billing, accounting, offline sync, CRM, ecommerce, mobile, desktop, ZERO, or CODEIT application features yet. The current subject is still the platform foundation: tenant identity, auth/session behavior, tenant management, route guards, audit, and release readiness.

The repository has advanced enough that Task 1 and Task 2 are mostly implemented. Task 3 should keep the architecture direction as-is and harden the remaining weak points before future tenant-aware business modules are assigned.

## Batch State

| Field | Value |
| --- | --- |
| Task reference | `task_3` |
| Status | `planned` |
| Depends on | Task 1 and Task 2 implementation present |
| Focus | Foundation hardening, validation, audit fidelity, and readiness notes |
| Last updated | `2026-06-29` |

## Current Verified State

The following checks were run from the workspace root on `2026-06-29`:

```bash
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test -w @codexsun/framework
npm.cmd run test -w @codexsun/platform-api
```

Current result:

- Workspace typecheck passes.
- Workspace lint passes.
- Framework tests pass: 26 tests.
- Platform API tests pass: 11 tests.

## What Is Already Done

### Framework Foundation

- `correlationId` has been removed from envelopes, logs, event contracts, queue contracts, and public API docs.
- API envelopes now use `requestId`, `timestamp`, and optional `tenantId`.
- `x-tenant-id` is registered through framework tenant context.
- Health route status behavior is implemented.
- Request logging exists.
- Database pool support exists.
- Graceful shutdown support exists.
- Framework test helpers and smoke tests exist.

### Platform Auth And Tenant Identity

- `AUTH_MODE` exists in API env schema with `cookie`, `jwt`, and `hybrid`.
- `JWT_SECRET` remains the required signing secret.
- Auth service supports JWT and database-backed session store paths.
- Tenant login resolves tenant code into database tenant id.
- Session/JWT payloads carry `tenantId` and `tenantCode`.
- Platform web stores tenant id after tenant login and sends `x-tenant-id` for tenant desk API calls.

### Tenant Management Foundation

- Tenant CRUD routes are split into `apps/platform/api/src/tenant/routes.ts`.
- Auth routes are focused on login, session, and logout.
- Guard helpers exist in `apps/platform/api/src/auth/guards.ts`.
- Tenant repository and service exist in `@codexsun/platform/tenant`.
- Audit repository and audit service exist in `@codexsun/platform/audit`.
- Super-admin tenant management is protected and covered by API smoke tests.

### UI And Web Shell

- Public home, login pages, SA desk, Staff Admin desk, Tenant desk, and design system page exist.
- Shared layouts and design system exports exist.
- SA tenant registry UI exists and uses the platform API.
- TanStack Query is present in platform web flow.

## Main Gaps To Close

### 1. Tenant Context Trust Boundary

Current concern:

- Framework `registerTenantContext()` echoes `x-tenant-id` when the header is syntactically present.
- The assist contract says the backend should echo tenant id only when it has a known validated tenant id.

Required work:

- Keep framework generic, but do not imply an unvalidated header is trusted.
- Either stop echoing `x-tenant-id` in the generic framework hook, or add a clear validation step that platform routes can call after auth/session tenant match.
- Ensure tenant-scoped protected routes compare `request.tenantId` with authenticated session `tenantId`.
- Add tests for untrusted tenant header behavior and protected tenant route mismatch.

Acceptance:

- `x-tenant-id` alone never creates a trusted tenant context.
- Public routes may include request meta only if this is clearly documented as request-provided context, or they should omit tenant meta until validated.
- Protected tenant-scoped routes reject missing or mismatched tenant ids.

### 2. Route Input Validation

Current concern:

- Tenant routes cast `request.body` and `request.params` directly.
- This keeps typecheck green but leaves runtime validation weaker than auth login.

Required work:

- Add Zod schemas for tenant route params and bodies.
- Validate tenant create, update, delete/read id params before service calls.
- Normalize tenant code inside service, but reject invalid route/body shapes at the route boundary.
- Return structured `AppError.validation()` failures.

Acceptance:

- Tenant routes do not use raw body casts for business input.
- Invalid status, missing tenant name/code, empty id, and wrong body shape return consistent validation errors.
- Existing SA tenant UI still works.

### 3. Tenant Delete Policy

Current concern:

- `TenantService.delete()` and `MasterDbTenantRepository.delete()` hard-delete tenant rows.
- Assist docs say tenant export, backup, restore, migration, audit, and enterprise support must be planned from the start.
- Hard delete is dangerous before tenant database lifecycle tooling exists.

Required work:

- Decide and implement the safest current behavior:
  - Preferred: change delete endpoint to archive/deactivate tenant by setting status to `inactive` or `archived`.
  - If hard delete is kept for local MVP, document it as unsafe and dev-only, and keep tests explicit.
- Do not drop tenant databases in this task.
- Update SA desk labels only if the API contract changes from delete to archive/deactivate.

Acceptance:

- Tenant management cannot accidentally destroy tenant records without an explicit product decision.
- Audit event name matches behavior: `tenant.archived`, `tenant.deactivated`, or `tenant.deleted`.

### 4. Audit Fidelity

Current concern:

- Audit event contracts include optional `requestId`, but audit writer calls do not pass request id.
- Audit failures are non-blocking, which is acceptable for this scaffold, but should be documented.

Required work:

- Pass `request.id` into auth login success/failure, logout, and tenant mutation audit calls.
- Store `request_id` in `audit_events` if the table does not already include it.
- Update repository and bootstrap schema carefully.
- Add tests that audit service receives or writes request id where practical.

Acceptance:

- Important security/admin actions can be tied back to the request log.
- Audit payloads never include passwords or secrets.
- Non-blocking audit behavior is documented.

### 5. Auth Mode Semantics

Current concern:

- Code supports `cookie`, `jwt`, and `hybrid`, but the changelog contains older JWT-only wording and the web still stores bearer tokens.
- Login route currently always sets a cookie, even when runtime mode may be JWT-only.

Required work:

- Make `AUTH_MODE` behavior explicit in routes and docs:
  - `jwt`: return bearer token, do not rely on cookie.
  - `cookie`: set HTTP-only cookie and avoid requiring local token storage.
  - `hybrid`: set cookie and return token when needed.
- Align `.env.example`, changelog, and API docs with actual behavior.
- Keep current web working; do not redesign auth UX in this task.

Acceptance:

- Runtime behavior matches `AUTH_MODE`.
- Docs no longer contradict the implementation.
- Session/logout tests cover the configured mode at least for the default local mode.

### 6. Test Coverage Expansion

Required work:

- Add platform API tests for:
  - Staff/admin cannot list, read, create, update, or delete/archive tenants.
  - Tenant user cannot access tenant management.
  - `GET /tenants/:id` requires super-admin auth.
  - Tenant route invalid bodies and invalid statuses.
  - Tenant login returns both `tenantId` and `tenantCode`.
  - Tenant login fails for missing, unknown, inactive, or unprovisioned tenant.
  - Logout invalidates database session where cookie/hybrid mode is active.
- Add framework tests for tenant header array/blank handling.

Acceptance:

- Tests protect the tenant isolation and admin authorization paths that future modules will copy.
- Database-backed tests may keep using Fastify inject and the existing local bootstrap pattern.

### 7. Documentation Cleanup

Required docs:

- `assist/blueprint/platform-foundation.md`: guard pattern, tenant repository/service, audit writer, auth mode behavior.
- `assist/governance/api-guidelines.md`: validated tenant context wording and `AUTH_MODE` session contract.
- `assist/documentation/CHANGELOG.md`: add a new entry only after code is changed and verified.
- `assist/execution/task.md`: mark stale `x-correlation-id` guidance as superseded or point readers to Task 1 and Task 3.

Acceptance:

- New agents can read the docs and not reintroduce correlation IDs, hard-delete tenants casually, or misunderstand auth mode.

## Suggested Implementation Order

1. Tenant context trust boundary cleanup and framework tests.
2. Tenant route Zod validation.
3. Tenant delete/archive policy.
4. Audit request id plumbing and schema update.
5. Auth mode route behavior alignment.
6. Platform API test expansion.
7. Documentation and changelog update.
8. Full verification.

## Out Of Scope

- Billing, accounting, POS, inventory, CRM, ecommerce, or compliance workflows.
- Full RBAC UI.
- Full tenant provisioning lifecycle.
- Tenant database deletion.
- Redis/event outbox persistence.
- Offline sync.
- Mobile or desktop clients.
- ZERO or CODEIT application features.

## Verification Commands

Use `npm.cmd` on Windows:

```bash
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test -w @codexsun/framework
npm.cmd run test -w @codexsun/platform-api
```

If database-backed tests fail because MariaDB is unavailable, record the exact command and database error in the final handoff.

## Handoff Notes For The Agent

- Work with the current dirty branch; do not reset or revert unrelated changes.
- Keep `@codexsun/framework` free of platform business rules.
- Keep route handlers thin and put reusable business behavior in platform services.
- Treat tenant id as business identity, not as a trace id.
- Do not trust `x-tenant-id` without authenticated session validation on protected routes.
- Choose conservative data behavior over convenience. Tenant hard-delete is the main risk to review.
- If a proposed enhancement does not improve tenant isolation, auth safety, auditability, or release readiness, keep it out of this task.
