# Task 4 - Framework And Platform Module Readiness

## Purpose

This task comes after `assist/execution/task_3.md`.

Task 3 restores `x-correlation-id` as the public trace contract and hardens tenant/auth/audit behavior. Task 4 should build the next backend foundation layer that every future business module will reuse.

Do not start billing, accounting, contacts, invoices, offline sync, mobile, desktop, ZERO, or frontend workspace templates in this task. Task 4 is framework and platform readiness only.

## Batch State

| Field | Value |
| --- | --- |
| Task reference | `task_4` |
| Status | `planned` |
| Depends on | Task 3 complete and verified |
| Focus | Permissions, activation, module registry, migrations, events, queues, and platform API contracts |
| Last updated | `2026-06-29` |

## Goal

Make CODEXSUN ready for real tenant-aware modules by adding reusable backend patterns for:

- Permission checks.
- Role-to-permission mapping.
- Tenant feature activation.
- Module/app registration.
- Subscription/plan guard foundation.
- Versioned migrations.
- Event and queue metadata.
- Audit and support visibility.

The result should be a platform foundation that business modules can plug into without inventing their own auth, tenant, permission, activation, trace, audit, or migration behavior.

## Required Context

Read these before implementing:

- `assist/execution/task_3.md`
- `assist/README.md`
- `assist/blueprint/framework-foundation.md`
- `assist/blueprint/platform-foundation.md`
- `assist/architecture/module-boundaries.md`
- `assist/architecture/tenant-isolation.md`
- `assist/architecture/events-and-queues.md`
- `assist/product/product-scope.md`
- `assist/governance/api-guidelines.md`
- `assist/governance/testing-strategy.md`
- `assist/governance/quality-gates.md`

## Work Scope

### 1. Framework Module Runtime Contract

Files to inspect:

- `packages/framework/src/modules/module.ts`
- `packages/framework/src/events/contracts.ts`
- `packages/framework/src/queue/contracts.ts`
- `packages/framework/src/api/create-api-app.ts`
- `packages/framework/src/db/contracts.ts`

Required work:

- Define a stable module registration contract for platform and future business modules.
- Module metadata should include:
  - `moduleKey`
  - `displayName`
  - `scope`: `platform`, `tenant`, `industry`, or `integration`
  - `version`
  - optional route registration hook
  - optional health check hook
  - optional migration hook reference
  - optional required permissions
  - optional required feature key
- Keep the framework generic. Do not put CODEXSUN business module names in framework.
- Make events and queue jobs carry:
  - `correlationId`
  - optional `tenantId`
  - optional `actorId` / `actorEmail`
  - `sourceModule`

Acceptance:

- Platform can register modules through a clear API.
- Future billing/accounting/contact modules can copy the module contract.
- Framework remains business-rule free.

### 2. Platform Module Catalog

Files to inspect:

- `packages/platform/src/activation/`
- `packages/platform/src/subscription/`
- `packages/platform/src/permissions/`
- `packages/platform/src/settings/`
- `apps/platform/api/src/app.ts`
- `apps/platform/api/src/db/bootstrap.ts`

Required work:

- Add a platform-owned module catalog service.
- Define initial platform module records:
  - `platform.tenants`
  - `platform.users`
  - `platform.roles`
  - `platform.permissions`
  - `platform.activation`
  - `platform.audit`
  - `platform.settings`
  - `platform.notifications`
- Prepare future tenant modules as catalog entries only:
  - `business.contacts`
  - `business.items`
  - `business.billing`
  - `business.accounting`
  - `business.reports`
  - `business.offline-sync`
- Do not implement those future modules yet.

Acceptance:

- Platform has one source of truth for known modules/apps/features.
- Module keys are stable and documented.
- Module registration does not activate features automatically for tenants.

### 3. Permission Foundation

Files to inspect:

- `packages/platform/src/permissions/contracts.ts`
- `apps/platform/api/src/auth/guards.ts`
- `apps/platform/api/src/tenant/routes.ts`

Required work:

- Define permission keys using a stable pattern:
  - `platform.tenant.view`
  - `platform.tenant.manage`
  - `platform.audit.view`
  - `platform.activation.manage`
  - `platform.user.view`
  - `platform.user.manage`
- Add role-to-permission mapping for current user types:
  - `super_admin`: all platform permissions.
  - `staff`: limited platform read permissions only.
  - `tenant`: no platform admin permissions.
- Replace placeholder-only `requirePermission()` with a real check against this mapping.
- Keep full RBAC UI out of scope.

Acceptance:

- Tenant management routes call named permissions, not only user type checks.
- Staff and tenant users are denied platform management actions.
- Permission denial produces structured API errors.

### 4. Activation And Subscription Guards

Files to inspect:

- `packages/platform/src/activation/contracts.ts`
- `packages/platform/src/subscription/contracts.ts`
- `packages/platform/src/tenant/contracts.ts`
- `apps/platform/api/src/auth/guards.ts`

Required work:

- Define activation records for tenant modules:
  - `tenantId`
  - `moduleKey`
  - `status`: `enabled`, `disabled`, `trial`, `expired`, `suspended`
  - optional limits payload
  - optional provider/config payload
- Add guard functions:
  - `requireActiveTenant(session)`
  - `requireFeatureEnabled(session, moduleKey)`
  - `requireSubscriptionAllowed(session, moduleKey)`
- For this task, storage can be minimal, but the contract must be real and testable.
- Do not build billing-plan pricing.

Acceptance:

- Future tenant APIs can call one guard stack:
  - session required
  - tenant match
  - active tenant
  - permission
  - feature enabled
- Disabled tenant modules are blockable.

### 5. Versioned Migration Runner

Files to inspect:

- `apps/platform/api/src/db/bootstrap.ts`
- `packages/framework/src/db/contracts.ts`
- `assist/operations/environments.md`
- `assist/operations/release-checklist.md`

Required work:

- Introduce a small versioned migration runner for master database and tenant databases.
- Track applied migrations in:
  - `platform_migrations`
  - `tenant_migrations`
- Migrations must be ordered, repeatable, and safe to run on startup.
- Keep current first-boot bootstrap compatible.
- Add a clear place for future module migrations.

Acceptance:

- Platform bootstrap no longer grows as one large schema script forever.
- Future modules know where to register migrations.
- Migration failures surface in health as degraded or down according to policy.

### 6. Support And Observability API Stubs

Required work:

- Add read-only platform endpoints for:
  - registered modules
  - enabled tenant modules
  - recent audit events
  - migration status
  - health summary
- Protect all with super-admin permission.
- Keep UI work out of this task.

Acceptance:

- Super admin APIs can inspect foundation state.
- No sensitive secrets are returned.
- Responses include `correlationId` and follow envelope rules.

### 7. Tests

Required tests:

- Permission mapping:
  - super admin allowed.
  - staff denied for manage permissions.
  - tenant denied for platform admin permissions.
- Tenant activation guard:
  - enabled module allowed.
  - disabled/suspended module denied.
- Module catalog returns stable module keys.
- Migration runner records and skips applied migrations.
- Support endpoints require super admin.
- Events/jobs preserve `correlationId` and separate `tenantId`.

## Out Of Scope

- Frontend workspace/list design system.
- Full RBAC screens.
- Subscription pricing.
- Billing/accounting/contact/invoice module implementation.
- Redis queue adapter.
- Event outbox persistence.
- Offline sync.
- Mobile/desktop apps.

## Verification Commands

Use `npm.cmd` on Windows:

```bash
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test -w @codexsun/framework
npm.cmd run test -w @codexsun/platform-api
```

Add package-specific platform tests if platform package unit tests are introduced.

## Documentation

Update after implementation:

- `assist/blueprint/framework-foundation.md`
- `assist/blueprint/platform-foundation.md`
- `assist/architecture/module-boundaries.md`
- `assist/governance/api-guidelines.md`
- `assist/documentation/CHANGELOG.md`

## Handoff Notes

- Task 4 is the backend gate before business modules.
- Keep framework generic.
- Keep platform business language in `@codexsun/platform`.
- Keep tenant identity, correlation trace, permissions, activation, and audit separate.
- Prefer conservative contracts that future modules can reuse without rewrites.
