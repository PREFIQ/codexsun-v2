# Task 8 - User Role And Permission UI

## Purpose

This task comes after `assist/execution/task_7.md`.

Task 8 connects the platform permission foundation to visible admin screens. It is still platform foundation work, not business module work.

## Batch State

| Field | Value |
| --- | --- |
| Task reference | `task_8` |
| Status | `planned` |
| Depends on | Task 7 complete and verified |
| Focus | Users, roles, permissions, sessions, and access UI |
| Last updated | `2026-06-29` |

## Goal

Create reusable platform access-management screens:

- platform users
- tenant users shell
- roles
- permissions
- permission matrix
- sessions
- invitations shell

## Required Work

### 1. Platform Users

Build:

- user list
- user show
- user create/edit
- suspend/activate
- reset password placeholder
- revoke sessions action

Use `WorkspaceList`, `MasterShow`, and `MasterUpsertPage`.

### 2. Tenant User Shell

Build only the platform shell for tenant users:

- list tenant users by tenant
- show basic identity/status
- invite placeholder
- suspend/activate placeholder

Do not build tenant business roles yet.

### 3. Role Management

Build:

- role list
- role show
- role create/edit
- role status
- assign permissions

Initial roles:

- `super_admin`
- `staff_admin`
- `tenant_admin`
- `tenant_user`

### 4. Permission Matrix

Build matrix UI:

- rows: permission keys
- columns: roles
- checkbox/toggle cells
- grouped by module
- read-only defaults for system roles where needed

Use Task 5 table and control patterns.

### 5. Session Management

Build:

- active sessions list
- session detail
- revoke session
- revoke all for user
- last seen / created / expires

Audit all revocations.

### 6. Forbidden And Disabled States

Use Task 6 shell states for:

- no permission
- role disabled
- module disabled
- tenant inactive

## Tests

Add coverage for:

- permission checks by role
- role update validation
- session revoke
- forbidden UI/API state
- staff cannot grant themselves higher permissions

## Out Of Scope

- Business module permissions beyond placeholders.
- Tenant business workflow roles.
- Support impersonation.
- SSO/OAuth.
- Passwordless login.

## Verification

```bash
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test -w @codexsun/platform-api
```

Run web checks if UI is changed:

```bash
npm.cmd run typecheck -w @codexsun/platform-web
npm.cmd run lint -w @codexsun/platform-web
```

## Documentation

Update:

- `assist/blueprint/platform-foundation.md`
- `assist/architecture/security-and-compliance.md`
- `assist/governance/api-guidelines.md`
- `assist/documentation/CHANGELOG.md`

