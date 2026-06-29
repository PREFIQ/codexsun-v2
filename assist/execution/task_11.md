# Task 11 - Notification Mail And Activity Foundation

## Purpose

This task comes after `assist/execution/task_10.md`.

Task 11 prepares shared communication and activity infrastructure before business workflows start sending real notifications or mail.

## Batch State

| Field | Value |
| --- | --- |
| Task reference | `task_11` |
| Status | `planned` |
| Depends on | Task 10 complete and verified |
| Focus | Notifications, mail shell, comments, assignments, tags, and activity timeline |
| Last updated | `2026-06-29` |

## Goal

Create reusable foundation for:

- notification center
- mail template shell
- activity timeline
- comments
- assignments
- tags
- watch/follow pattern
- send confirmation pattern

## Required Work

### 1. Activity Contract

Define activity records:

- `activityId`
- `tenantId`
- `moduleKey`
- `recordType`
- `recordId`
- `actorEmail`
- `activityType`
- `message`
- `payload`
- `correlationId`
- `createdAt`

### 2. Activity Timeline UI

Build reusable:

- activity list
- comment composer
- system event item
- audit-linked item
- empty state
- loading/error states

### 3. Notification Foundation

Define notification records:

- recipient user
- tenant
- module
- title/body
- status
- priority
- action href
- read/unread

Build notification center shell.

### 4. Mail Foundation

Build mail shell only:

- mail template list
- template preview
- send confirmation dialog
- recipient picker placeholder
- queued/sent/failed status placeholder

Do not connect real SMTP/provider yet unless already available.

### 5. Assign Tags Watch

Build reusable UI and contracts:

- assign user
- tags
- watchers
- mention placeholder
- audit event on change

### 6. Queue Integration Placeholder

Use framework queue contracts:

- notification job
- mail send job
- retry metadata
- `correlationId`
- optional `tenantId`

In-memory adapter is acceptable for first foundation.

## Tests

Add coverage for:

- notification tenant isolation
- activity creation
- comments do not leak across tenant
- mail send placeholder creates queued job
- audit/correlation metadata preserved

## Out Of Scope

- Real SMTP provider setup.
- WhatsApp/Telegram integration.
- Business workflow notifications.
- AI-generated summaries.

## Verification

```bash
npm.cmd run typecheck
npm.cmd run lint
```

Run package-specific tests if added.

## Documentation

Update:

- `assist/architecture/events-and-queues.md`
- `assist/product/product-scope.md`
- `assist/blueprint/platform-foundation.md`
- `assist/documentation/CHANGELOG.md`

