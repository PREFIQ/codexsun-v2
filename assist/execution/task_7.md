# Task 7 - Platform Admin Console

## Purpose

This task comes after `assist/execution/task_6.md`.

Task 7 builds the Super Admin operational console using the platform foundation and workspace design system. It must not implement tenant business modules or edit tenant business data.

## Batch State

| Field | Value |
| --- | --- |
| Task reference | `task_7` |
| Status | `planned` |
| Depends on | Task 6 complete and verified |
| Focus | Super Admin console for platform operations |
| Last updated | `2026-06-29` |

## Goal

Create a real platform administration surface for inspecting and managing platform foundation state:

- tenants
- tenant modules
- module activation
- users/sessions overview
- audit events
- migrations
- system health
- support-safe inspection

## Required Work

### 1. Console Home

Create a Super Admin console overview page with:

- tenant count
- active/suspended tenant count
- enabled module count
- recent audit count
- migration health
- API/database health
- quick links to platform sections

Use Task 5 `WorkspaceList`/panel patterns.

### 2. Tenant Registry Screens

Build platform tenant screens using the reusable design system:

- tenant list
- tenant show
- tenant create/edit
- tenant suspend/restore
- tenant database binding view
- enabled modules tab
- audit tab

Do not create tenant business records.

### 3. Module Activation Screens

Build read/manage screens for:

- platform module catalog
- tenant-enabled modules
- activation status
- limits/config payload preview
- enable/disable placeholder actions

Activation must respect Task 4 guards and audit every mutation.

### 4. Audit Viewer

Build read-only audit viewer:

- search
- filter by actor
- filter by event name
- filter by tenant
- filter by date
- show event payload safely
- show `correlationId`

Never show secrets, tokens, or passwords.

### 5. Migration Status Viewer

Build read-only migration viewer:

- platform migrations
- tenant migrations
- applied at
- status
- failed migration details where safe

### 6. Health And Support View

Build support-safe health screens:

- API health
- database bootstrap status
- registered module health
- degraded/down indicators
- support notes area if already available

Do not expose DB passwords, JWT secrets, or private config.

## Tests

Add coverage for:

- super admin can access console APIs/screens
- staff and tenant users cannot access platform admin console
- audit viewer hides sensitive fields
- tenant activation mutations write audit events
- health/migration screens handle empty/degraded states

## Out Of Scope

- Full RBAC editor.
- Tenant business module screens.
- Billing/accounting/contact/invoice logic.
- Tenant database deletion.
- Support impersonation.

## Verification

```bash
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test -w @codexsun/platform-api
```

Run Platform Web checks if UI is changed:

```bash
npm.cmd run typecheck -w @codexsun/platform-web
npm.cmd run lint -w @codexsun/platform-web
```

## Documentation

Update:

- `assist/blueprint/platform-foundation.md`
- `assist/operations/observability.md`
- `assist/documentation/CHANGELOG.md`

