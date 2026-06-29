# Task 9 - Settings And Configuration Foundation

## Purpose

This task comes after `assist/execution/task_8.md`.

Task 9 creates shared settings and configuration surfaces before business modules use them.

## Batch State

| Field | Value |
| --- | --- |
| Task reference | `task_9` |
| Status | `planned` |
| Depends on | Task 8 complete and verified |
| Focus | Platform settings, tenant settings, feature flags, templates, and integration config shells |
| Last updated | `2026-06-29` |

## Goal

Create one safe configuration model for platform and tenant-level settings:

- global platform settings
- tenant settings
- feature flags
- numbering settings shell
- print/template settings shell
- integration settings shell
- config audit

## Required Work

### 1. Settings Contract

Define settings records:

- `scope`: `platform` or `tenant`
- `tenantId`
- `namespace`
- `key`
- `value`
- `schemaVersion`
- `isSecret`
- `updatedBy`
- `updatedAt`

Secret values must never be returned raw.

### 2. Settings Repository And Service

Add:

- get settings by namespace
- update setting
- validate setting payload
- audit setting changes
- mask secrets

### 3. Platform Settings UI

Build screens for:

- environment/runtime info
- auth settings summary
- mail/integration placeholders
- system defaults
- support settings

### 4. Tenant Settings UI

Build screens for:

- tenant profile settings
- enabled feature flags
- workspace preferences
- print/template placeholders
- numbering placeholders

No business numbering logic yet.

### 5. Feature Flag UI

Build:

- feature flag list
- enable/disable per tenant
- feature status
- reason/notes
- audit trail

### 6. Config Editor Pattern

Create reusable config editor components:

- text setting
- number setting
- boolean setting
- select setting
- JSON setting with validation
- secret setting with masked display

## Tests

Add coverage for:

- setting validation
- secret masking
- tenant isolation
- audit event on change
- feature flag enable/disable
- forbidden users blocked

## Out Of Scope

- Business module settings behavior.
- Real mail provider setup.
- Real payment/compliance integration.
- Invoice numbering logic.
- Print template builder.

## Verification

```bash
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test -w @codexsun/platform-api
```

Run web checks if UI is changed.

## Documentation

Update:

- `assist/blueprint/platform-foundation.md`
- `assist/architecture/security-and-compliance.md`
- `assist/documentation/CHANGELOG.md`

