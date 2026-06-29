# Task 2 - Platform Guards, Repositories, And Audit Foundation

## Purpose

This task is the next implementation slice after `assist/execution/task_1.md`.

Task 1 makes tenant identity stable by replacing the old `correlationId` request-context path with `tenantId` and `x-tenant-id`. Task 2 must build on that foundation by moving platform API behavior out of fat route handlers and into reusable guard, repository, service, and audit patterns.

Do not start this task until Task 1 is complete and verified. If `correlationId` still exists in envelopes, logs, route meta, events, queues, or tests, stop and finish Task 1 first.

## Batch State

| Field | Value |
| --- | --- |
| Task reference | `task_2` |
| Status | `planned` |
| Depends on | `assist/execution/task_1.md` complete |
| Focus | Platform route hardening after tenant identity is stable |
| Last updated | `2026-06-29` |

## Goal

Create the foundation that future platform and business modules will reuse:

- Auth/session guards.
- User type and tenant context guards.
- Tenant repository and tenant management service.
- Route modules split by ownership.
- Audit event writer scaffold.
- Activation and permission guard placeholders.
- Clean verification around super-admin tenant management.

The point is not to build more UI. The point is to make API behavior safe, modular, and ready for future tenant-aware modules.

## Current Codebase Assessment

### Already Present Or Mostly Present

- `ModuleRegistry` exists in `packages/framework/src/modules/module.ts`.
- Platform contracts exist for permissions, activation, audit, roles, users, settings, and tenant.
- `TenantLookupService` exists in `packages/platform/src/tenant/lookup.ts`.
- SA tenant management UI exists in `apps/platform/web/src/pages/SaDesk.tsx`.
- Master database has tenant, tenant database, session, and audit tables in bootstrap.
- Platform web already uses TanStack Query for the SA tenant list flow.

### Main Gaps

- Tenant CRUD routes live inside `apps/platform/api/src/auth/routes.ts`.
- Route handlers directly run SQL and duplicate auth checks.
- There is no shared API guard helper such as `requireSession()` or `requireUserType()`.
- There is no tenant context/session matching guard for protected tenant-scoped routes.
- Tenant management SQL is not behind a repository/service layer.
- Audit table exists but auth and tenant management actions are not written to audit.
- Permission contracts exist but no route guard uses them.
- Activation contracts exist but no tenant route guard uses them.
- Module registration is not used to organize platform API runtime wiring.

## Work Scope

### 1. API Guard Foundation

Files to inspect and likely update:

- `apps/platform/api/src/auth/routes.ts`
- `apps/platform/api/src/app.ts`
- `packages/platform/src/auth/service.ts`
- `packages/platform/src/auth/session.ts`
- `packages/platform/src/auth/contracts.ts`
- `packages/platform/src/permissions/contracts.ts`

Create a small guard layer. Preferred location:

- `apps/platform/api/src/auth/guards.ts` for Fastify-specific request/reply helpers.
- Keep generic user/session types in `@codexsun/platform/auth`.

Required guard behavior:

- `requireSession(request)` resolves the active session or throws `AppError.unauthorized()`.
- `requireUserType(request, allowedTypes)` throws `AppError.forbidden()` when user type is not allowed.
- `requireSuperAdmin(request)` is a small wrapper for super-admin-only routes.
- `requireTenantMatch(request, session)` verifies `request.tenantId` matches `session.tenantId` for protected tenant-scoped routes.
- Guards must use the Task 1 `tenantId` contract, not tenant code.
- Guards must not trust `x-tenant-id` by itself.

Acceptance for this section:

- Tenant management routes use guard helpers instead of inline token/session checks.
- Future routes have one obvious guard pattern to copy.

### 2. Tenant Repository And Service

Files to inspect and likely update:

- `packages/platform/src/tenant/contracts.ts`
- `packages/platform/src/tenant/lookup.ts`
- `packages/platform/src/tenant/index.ts`
- `apps/platform/api/src/auth/routes.ts`
- `apps/platform/api/src/app.ts`
- `apps/platform/api/src/db/bootstrap.ts`

Add tenant persistence behind a repository/service boundary.

Preferred shape:

- `packages/platform/src/tenant/repository.ts`
- `packages/platform/src/tenant/service.ts`

Repository responsibilities:

- `listTenants()`
- `getTenantById(id)`
- `findTenantByCode(code)`
- `createTenant(input)`
- `updateTenant(id, input)`
- `deleteTenant(id)` or `archiveTenant(id)` if deletion is unsafe
- `resolveTenantDatabase(tenantId)`

Service responsibilities:

- Validate tenant code/name/status.
- Prevent duplicate tenant code.
- Normalize tenant code casing if product rules require it.
- Keep full provisioning out of scope unless it already exists.
- Return stable DTOs for API responses.

Important safety note:

- Hard delete of a tenant is dangerous. If current UI says delete, the service should either keep current behavior with tests and a warning note, or switch to `status = 'inactive'` only if agreed by existing product direction. Do not silently drop tenant databases.

Acceptance for this section:

- API routes no longer contain raw tenant CRUD SQL.
- Tenant lookup and tenant management share compatible DTOs.
- Existing SA desk tenant list/create/edit/delete still works through the same API contracts.

### 3. Route Module Split

Files to inspect and likely update:

- `apps/platform/api/src/auth/routes.ts`
- `apps/platform/api/src/app.ts`
- `packages/framework/src/modules/module.ts`

Split route ownership:

- `apps/platform/api/src/auth/routes.ts` should contain auth routes only.
- Add `apps/platform/api/src/tenants/routes.ts` for tenant management routes.
- Optional: add `apps/platform/api/src/modules/register-platform-routes.ts` if route registration needs one clear entry point.

Use `ModuleRegistry` only if it helps without over-abstraction. A simple app-level route registration function is acceptable for this task.

Acceptance for this section:

- Auth routes do not contain tenant CRUD routes.
- `createApp()` has readable registration order.
- Framework remains generic and does not import platform business code.

### 4. Audit Event Writer Scaffold

Files to inspect and likely update:

- `packages/platform/src/audit/contracts.ts`
- `packages/platform/src/audit/index.ts`
- `apps/platform/api/src/db/bootstrap.ts`
- `apps/platform/api/src/auth/routes.ts`
- `apps/platform/api/src/tenants/routes.ts`

Add the smallest useful audit writer.

Preferred shape:

- `packages/platform/src/audit/repository.ts`
- `packages/platform/src/audit/service.ts`

Audit events to write:

- `auth.login.success`
- `auth.login.failed`
- `auth.logout`
- `tenant.created`
- `tenant.updated`
- `tenant.deleted` or `tenant.archived`

Audit event fields:

- `actorType`
- `actorEmail`
- `tenantId` when relevant
- `eventName`
- `payload`
- `requestId` if available after Task 1

Acceptance for this section:

- Failed login attempts are audited without leaking passwords.
- Tenant management mutations are audited.
- Audit failure must not expose sensitive internals to users.
- Decide whether audit failure blocks the main action. Default: log audit failure and continue for this scaffold unless the action is security-critical.

### 5. Permission And Activation Guard Placeholders

Files to inspect and likely update:

- `packages/platform/src/permissions/contracts.ts`
- `packages/platform/src/permissions/index.ts`
- `packages/platform/src/activation/contracts.ts`
- `packages/platform/src/activation/index.ts`
- `apps/platform/api/src/auth/guards.ts`

Add minimal guard APIs for future modules.

Required behavior:

- Add `requirePermission(session, permission)` shape, even if super-admin passes and other roles are denied for now.
- Add `requireActiveTenant(session)` or equivalent placeholder for tenant status.
- Add `requireFeatureEnabled(tenantId, featureKey)` placeholder that currently allows by default and is easy to replace later.
- Do not build full RBAC UI or subscription UI in this task.

Acceptance for this section:

- Future route modules have a clear place to call permission/activation guards.
- Super-admin tenant management routes use a named permission where practical, such as `platform.tenant.profile.manage`.

### 6. Tests

Files to inspect and likely update:

- `apps/platform/api/src/__tests__/auth.test.ts`
- Add `apps/platform/api/src/__tests__/tenants.test.ts` if missing.
- Add platform package unit tests only if repository/service logic can be tested without a live DB.

Required test coverage:

- Super admin can list tenants.
- Super admin can read tenant by id.
- Staff/admin cannot list tenants.
- Tenant user cannot list tenants.
- Unauthenticated request cannot list/read/create/update/delete tenants.
- Create tenant validates required fields.
- Duplicate tenant code returns conflict.
- Tenant update validates status.
- Tenant mutation writes audit event or calls audit writer.
- Auth login success/failure writes audit event or calls audit writer.

If DB-backed tests cannot run locally:

- Keep injectable repositories/services so unit tests can cover logic.
- Record the exact skipped or failing DB command in the final handoff.

### 7. Documentation

Files to inspect and update:

- `assist/blueprint/platform-foundation.md`
- `assist/governance/api-guidelines.md`
- `assist/governance/quality-gates.md` only if standards change.
- `assist/documentation/CHANGELOG.md` after implementation.

Required docs:

- Document the platform guard pattern.
- Document route ownership: auth routes vs tenant management routes.
- Document audit event names introduced in this task.
- Add changelog entries after verified implementation.

## Out Of Scope

- Billing, accounting, CRM, ecommerce, inventory, or compliance workflows.
- Full RBAC screens.
- Full tenant provisioning workflow.
- Deleting tenant databases.
- Redis/event outbox persistence.
- Offline sync.
- ZERO or CODEIT application features.
- Mobile or desktop app behavior.

## Suggested Implementation Order

1. Confirm Task 1 is complete.
2. Add guard helpers and update existing tenant routes to use them.
3. Move tenant SQL into repository/service.
4. Split tenant routes out of auth routes.
5. Add audit writer scaffold and wire auth/tenant mutation events.
6. Add permission/activation placeholder guards.
7. Add tests.
8. Update docs and changelog.
9. Run verification commands.

## Acceptance Criteria

- `auth/routes.ts` contains auth behavior only.
- Tenant CRUD is served by a tenant route module.
- Tenant CRUD SQL is behind a repository/service.
- All tenant management routes require super-admin session.
- Protected tenant-scoped guard checks compare authenticated `tenantId` to request `tenantId`.
- Audit events are written for login success/failure, logout, and tenant mutations.
- Permission and activation guard placeholders exist and are documented.
- No framework file imports platform business logic.
- Existing SA tenant registry UI still works.
- Typecheck, lint, and relevant tests pass.

## Verification Commands

Use `npm.cmd` on Windows if PowerShell blocks `npm.ps1`.

```bash
npm.cmd run typecheck -w @codexsun/platform
npm.cmd run lint -w @codexsun/platform

npm.cmd run typecheck -w @codexsun/platform-api
npm.cmd run test -w @codexsun/platform-api
npm.cmd run lint -w @codexsun/platform-api

npm.cmd run typecheck -w @codexsun/platform-web
npm.cmd run lint -w @codexsun/platform-web
```

Run framework checks only if framework files are touched:

```bash
npm.cmd run typecheck -w @codexsun/framework
npm.cmd run test -w @codexsun/framework
npm.cmd run lint -w @codexsun/framework
```

## Handoff Notes For The Agent

- Treat this as a backend foundation task first.
- Keep route handlers thin.
- Keep platform business rules out of `@codexsun/framework`.
- Do not trust tenant headers without authenticated session validation.
- Prefer small service/repository classes over large route files.
- Work with the current dirty branch; do not revert unrelated user or agent work.
- If Task 1 is incomplete, do not continue this task. Finish Task 1 first.

