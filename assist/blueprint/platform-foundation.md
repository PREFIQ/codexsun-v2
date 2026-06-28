# Platform Foundation

## Purpose

`@codexsun/platform` owns shared platform business concepts used by runnable apps.

Framework stays technical. Platform owns tenant, identity, subscription, activation, settings, audit, notifications, roles, and permissions language.

## Current Platform Package Scope

The first package foundation provides subpaths for:

- `@codexsun/platform/tenant`
- `@codexsun/platform/auth`
- `@codexsun/platform/users`
- `@codexsun/platform/roles`
- `@codexsun/platform/permissions`
- `@codexsun/platform/subscription`
- `@codexsun/platform/activation`
- `@codexsun/platform/audit`
- `@codexsun/platform/notifications`
- `@codexsun/platform/settings`

## Current Runtime Wiring

Platform API now consumes `@codexsun/platform/auth` for:

- Login request contract.
- Desk-to-user-type mapping.
- Password hashing and verification.
- In-memory development session store.

SQL bootstrapping and seed execution remain inside `apps/platform/api` until cxsync migrations and Platform persistence repositories are formalized.

## Boundary Rules

- Platform package may define business language and rules.
- Platform package should not own Fastify boot, generic database connectors, queues, or storage adapters.
- App route handlers may orchestrate Platform services but should not duplicate Platform business concepts.
- Shared auth user types remain separated as Super Admin, Staff, and Tenant.

## Next Platform Work

- Move SQL persistence behind Platform repositories.
- Add tenant lookup and domain resolution services.
- Add activation enforcement helpers for API route guards.
- Add permission checks and role-permission mapping.
- Add audit event writer using framework event contracts.
- Replace in-memory session store with persistent session tables.
