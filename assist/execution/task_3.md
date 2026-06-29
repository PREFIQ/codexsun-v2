# Task 3 - Restore Correlation ID And Harden Platform Foundation

## Purpose

This task is the next senior-engineer handoff after `assist/execution/task_1.md` and `assist/execution/task_2.md`.

Important correction: `correlationId` and `tenantId` are different concepts and must both remain separate.

- `correlationId` is a technical trace value used to connect API requests, logs, jobs, events, and support debugging.
- `tenantId` is a business identity used to identify the tenant/customer context.
- `requestId` may still exist as Fastify's internal per-request id, but the public trace contract should use `x-correlation-id` and envelope `meta.correlationId`.
- `tenantId` must never replace `correlationId`.

Do not expand CODEXSUN into billing, accounting, offline sync, CRM, ecommerce, mobile, desktop, ZERO, or CODEIT application features yet. This task is only about platform foundation correctness: trace context, tenant context, auth/session behavior, tenant management, route guards, audit, and release readiness.

## Batch State

| Field | Value |
| --- | --- |
| Task reference | `task_3` |
| Status | `planned` |
| Depends on | Task 1 and Task 2 implementation present |
| Focus | Restore correlation trace contract and harden platform foundation |
| Last updated | `2026-06-29` |

## Current Verified State

The following checks were run from the workspace root on `2026-06-29` before this task was written:

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

## Current Codebase Assessment

### Already Present

- Framework API bootstrap, health route, request logging, database pool, graceful shutdown, and test helpers exist.
- Tenant context currently exists through `x-tenant-id`.
- Auth service supports JWT and database-backed session-store paths.
- Tenant login resolves tenant code into database tenant id.
- Session/JWT payloads carry `tenantId` and `tenantCode`.
- Tenant CRUD routes are split into `apps/platform/api/src/tenant/routes.ts`.
- Guard helpers exist in `apps/platform/api/src/auth/guards.ts`.
- Tenant repository/service exist in `@codexsun/platform/tenant`.
- Audit repository/service exist in `@codexsun/platform/audit`.
- Platform web stores tenant id after tenant login and sends `x-tenant-id` for tenant desk API calls.

### Incorrect Direction To Fix

- The previous task direction removed public `x-correlation-id`.
- Current envelopes and docs favor `requestId` instead of `correlationId`.
- Some notes imply `tenantId` replaced correlation behavior.

This must be corrected. Restore correlation as its own trace concept.

## Target Context Contract

Use this contract unless a human changes the product decision again.

| Item | Contract |
| --- | --- |
| Request trace header | `x-correlation-id` |
| Response trace header | Echo `x-correlation-id` for every API response |
| Envelope trace meta | Include `correlationId` in every success and error envelope |
| Internal request id | Keep Fastify `request.id` available as `requestId` only if useful internally |
| Tenant request header | `x-tenant-id` |
| Envelope tenant meta | Include `tenantId` only when known and valid for the request |
| Auth rule | `x-tenant-id` alone never authenticates or authorizes a request |
| Tenant rule | Protected tenant-scoped routes must match `x-tenant-id` against authenticated session tenant context |

Important:

- `correlationId` may be generated when the caller does not send `x-correlation-id`.
- `tenantId` must not be generated.
- `tenantId` must not be used as a fallback trace id.
- Jobs, events, audit rows, and logs should carry `correlationId` for tracing and `tenantId` for tenant context when relevant.

## Work Scope

### 1. Restore Framework Correlation ID

Files to inspect and update:

- `packages/framework/src/api/create-api-app.ts`
- `packages/framework/src/api/request-logging.ts`
- `packages/framework/src/api/tenant-context.ts`
- `packages/framework/src/api/health-route.ts`
- `packages/framework/src/http/envelope.ts`
- `packages/framework/src/logger/logger.ts`
- `packages/framework/src/events/contracts.ts`
- `packages/framework/src/queue/contracts.ts`
- `packages/framework/src/__tests__/`

Required changes:

- Read `x-correlation-id` on every request.
- Generate a correlation id when the header is missing or blank.
- Decorate request context with `correlationId`.
- Echo `x-correlation-id` on every response.
- Include `correlationId` in envelope meta.
- Keep `tenantId` separate and optional.
- Request logs should include `correlationId`, `requestId`, route, status, duration, and optional `tenantId`.
- Domain events and queue jobs should support `correlationId` and optional `tenantId`.
- Do not put platform business rules into framework.

Tests to add/update:

- Request without `x-correlation-id` gets generated correlation id in response header and envelope.
- Request with `x-correlation-id` echoes the same value.
- Error envelope includes `correlationId`.
- Health response includes `correlationId`.
- `tenantId` remains separate from `correlationId`.
- Blank or array tenant headers are handled safely.

### 2. Tenant Context Trust Boundary

Current concern:

- `x-tenant-id` is business context, not a trusted identity by itself.

Required changes:

- Keep framework tenant parsing generic.
- Avoid wording or behavior that treats raw `x-tenant-id` as authenticated tenant identity.
- Protected tenant-scoped routes must call a guard that compares request tenant id with session/JWT tenant id.
- Public routes may ignore tenant id or include it only as untrusted request context if documented.

Acceptance:

- `x-tenant-id` alone never creates authorization.
- Tenant-scoped protected routes reject missing or mismatched tenant ids.
- `tenantId` never appears where a correlation trace value is expected.

### 3. Platform Auth And Route Meta Alignment

Files to inspect and update:

- `apps/platform/api/src/auth/routes.ts`
- `apps/platform/api/src/tenant/routes.ts`
- `apps/platform/api/src/auth/guards.ts`
- `packages/platform/src/auth/service.ts`
- `packages/platform/src/auth/jwt.ts`
- `packages/platform/src/auth/session.ts`

Required changes:

- Route responses should use framework envelope/meta helpers instead of hand-rolled meta where practical.
- Auth login/session/logout responses must include `correlationId` in envelope meta.
- Tenant login should continue returning `tenantId` and `tenantCode`.
- Do not write tenant code into `tenantId`.
- Logout should preserve traceability through `correlationId`.
- `AUTH_MODE` behavior must match implementation:
  - `jwt`: bearer-token path.
  - `cookie`: HTTP-only cookie session path.
  - `hybrid`: both where needed.

Acceptance:

- API response meta has stable `correlationId`.
- API response meta includes `tenantId` only when appropriate.
- Auth routes do not confuse tenant code, tenant id, request id, or correlation id.

### 4. Tenant Route Input Validation

Current concern:

- Tenant routes cast `request.body` and `request.params` directly.

Required changes:

- Add Zod schemas for tenant route params and bodies.
- Validate tenant create, update, read, and delete/archive inputs before service calls.
- Return structured `AppError.validation()` failures.
- Keep tenant code normalization in the service.

Acceptance:

- Tenant routes do not use raw casts for business input.
- Invalid status, missing tenant name/code, empty id, and wrong body shape return consistent validation errors.
- Existing SA tenant UI still works.

### 5. Tenant Delete Policy

Current concern:

- Current tenant delete behavior can hard-delete tenant rows.

Required changes:

- Prefer archive/deactivate over hard delete.
- Do not drop tenant databases.
- If hard delete is intentionally kept for MVP/dev use, document the risk clearly and test it explicitly.
- Audit event name must match actual behavior: `tenant.archived`, `tenant.deactivated`, or `tenant.deleted`.

Acceptance:

- Tenant management cannot accidentally destroy tenant records without an explicit product decision.
- Tenant lifecycle behavior is documented.

### 6. Audit Fidelity

Current concern:

- Audit events should be traceable through `correlationId`.

Required changes:

- Add `correlationId` to audit event contract and persistence.
- Pass correlation id into:
  - `auth.login.success`
  - `auth.login.failed`
  - `auth.logout`
  - `tenant.created`
  - `tenant.updated`
  - `tenant.deleted` / `tenant.archived`
- Keep optional `tenantId` for tenant context.
- Do not log passwords, tokens, or secrets.
- Document non-blocking audit behavior.

Acceptance:

- Important security/admin actions can be tied to request logs by `correlationId`.
- Audit payloads remain safe.
- Audit rows keep tenant context separately when relevant.

### 7. API Client And Web Header Handling

Files to inspect and update:

- `packages/platform/src/api-client/client.ts`
- `apps/platform/web/src/api.ts`
- `apps/platform/web/src/components/AuthGate.tsx`

Required changes:

- API client should send `x-correlation-id` when a caller provides one or generate one per request if the client owns that concern.
- Tenant desk calls should continue sending `x-tenant-id` only after tenant login/session gives a real tenant id.
- SA/admin calls should not accidentally reuse tenant id.
- `credentials: "include"` behavior should remain where needed.

Acceptance:

- Trace header and tenant header are separate.
- Tenant id is never used as a correlation id.

### 8. Test Coverage Expansion

Required tests:

- Framework correlation id generation and echo.
- Framework tenant id stays separate from correlation id.
- Platform API response meta contains correlation id.
- Staff/admin cannot list, read, create, update, or delete/archive tenants.
- Tenant user cannot access tenant management.
- `GET /tenants/:id` requires super-admin auth.
- Tenant route invalid bodies and invalid statuses.
- Tenant login returns both `tenantId` and `tenantCode`.
- Tenant login fails for missing, unknown, inactive, or unprovisioned tenant.
- Logout invalidates database session where cookie/hybrid mode is active.

Acceptance:

- Tests protect the trace, tenant isolation, and admin authorization paths future modules will copy.

### 9. Documentation Cleanup

Files to update:

- `assist/governance/api-guidelines.md`
- `assist/blueprint/framework-foundation.md`
- `assist/blueprint/platform-foundation.md`
- `assist/documentation/CHANGELOG.md`
- `assist/execution/task.md`
- `assist/execution/task_1.md`
- `assist/execution/task_2.md` if their wording now conflicts with this decision

Required docs:

- Document `x-correlation-id` as the public trace header.
- Document `correlationId` as separate from `tenantId`.
- Document `requestId` as internal Fastify request id, not the public trace contract.
- Document `x-tenant-id` as tenant context, never auth by itself.
- Remove wording that says correlation id was replaced by tenant id.
- Add changelog entry only after implementation and verification.

## Suggested Implementation Order

1. Restore framework correlation id contract.
2. Update framework tests.
3. Align envelope meta and route response helpers.
4. Add correlation id to logs, events, queues, and audit.
5. Tighten tenant context guard behavior.
6. Add tenant route validation.
7. Decide tenant delete/archive behavior.
8. Expand platform API tests.
9. Update docs and changelog.
10. Run full verification.

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
- Treat `correlationId` as trace context.
- Treat `tenantId` as business tenant context.
- Never substitute one for the other.
- Do not trust `x-tenant-id` without authenticated session validation on protected routes.
- Choose conservative data behavior over convenience. Tenant hard-delete is the main risk to review.
- If a proposed enhancement does not improve traceability, tenant isolation, auth safety, auditability, or release readiness, keep it out of this task.
