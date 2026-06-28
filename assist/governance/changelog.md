# Changelog

This file records early assist planning notes that predate the application scaffold.

The active release changelog lives at:

```text
assist/documentation/CHANGELOG.md
```

Future implementation and versioned release entries must follow `assist/operations/versioning.md`.

## 0.1.0 - 2026-06-28

### Added

- Created initial CODEXSUN assist knowledge pack.
- Added product overview and scope.
- Added domain map.
- Added roadmap.
- Added modular monolith and DDD architecture principles.
- Added tenant isolation guidance.
- Added module boundary guidance.
- Added data strategy notes.
- Added security and compliance notes.
- Added event and queue planning notes.
- Added offline sync planning notes.
- Added deployment model notes.
- Added industry model notes.
- Added CODEIT agent instructions.
- Added ZERO assistant instructions.
- Added general AI agent rules.
- Added tech stack notes.
- Added API guidelines.
- Added testing strategy.
- Added versioning pattern.
- Added release checklist.
- Added governance rules.

## 0.2.0 - 2026-06-28

### Added

- Added enterprise scope and enterprise readiness checklist.
- Added customer segment strategy.
- Added enterprise reference architecture.
- Added integration strategy.
- Added vibe coding guide for CODEIT-assisted development.
- Added CODEIT workflow notes.
- Added engineering standards.
- Added quality gates.
- Added environment strategy.
- Added observability guidance.
- Added SLA and support notes.
- Added backup and disaster recovery notes.
- Added data lifecycle notes.
- Added performance and capacity planning notes.

### Changed

- Expanded main README with enterprise standard and vibe coding standard.
- Updated recommended reading order for agents.

## 0.3.0 - 2026-06-28

### Added

- Added foundation blueprint based on pre-coding Q&A.
- Added decision summary for captured architecture choices.
- Added monorepo structure decision.
- Added Framework, Platform, Core responsibility split.
- Added package subpath pattern.
- Added Platform three-desk model with `/sa`, `/admin`, and `/` route groups.
- Added separate auth user types for Super Admin, Staff, and Tenant users.
- Added master database and tenant database naming pattern.
- Added Platform, cxdeploy, and cxsync tenant provisioning responsibility split.
- Added tenant provisioning event flow.

### Changed

- Updated README recommended reading order to include blueprint documents first.

## 0.4.0 - 2026-06-28

### Added

- Added npm workspaces as the package management decision.
- Added Turborepo as the monorepo task orchestration decision.
- Added Fastify as the backend API framework decision.
- Added Kysely as the MariaDB query layer decision.
- Added concurrently as an allowed local multi-process development helper.
- Added Umzug + Kysely migration strategy wrapped inside cxsync.
- Added Vite + React as the frontend framework decision.
- Added TanStack Router as the frontend routing decision.
- Added `@codexsun/ui` as the shared UI framework and design system package.
- Added Tailwind CSS, shadcn/ui style patterns, and Mantine-inspired UI direction.
- Added hybrid auth/session strategy for web, desktop, and mobile.
- Added MFA policy requiring MFA for `/sa` and `/admin`, with optional tenant MFA.
- Added permission naming pattern: `scope.module.resource.action`.
- Added system roles plus dynamic custom roles decision.
- Added layered activation model from tenant subscription to app, module, feature, limits, and provider config.
- Added activation change control with confirmation, scheduling, and Super Admin approval for high-risk changes.
- Added standard DDD-style module folder structure.
- Added standard API response envelope decision.
- Added Zod validation strategy for system boundaries.
- Added shared API contract strategy using module `contracts/` folders.
- Added `@codexsun/api-client` shared API client decision.
- Added hybrid tenant context resolution strategy.
- Added custom domain and subdomain as primary production tenant resolution, with path fallback for dev/internal/Super Admin use.
- Added tenant domain mapping responsibility split from SSL/cert infrastructure.
- Added structured JSON logging standard with request and correlation tracking.
- Added lean logging rule to avoid unnecessary blob payloads.
- Added switchable queue backend strategy with BullMQ + Redis for cloud and database-backed queue for local/dev.
- Added database outbox plus queue dispatcher event strategy.
- Added switchable file storage strategy with local filesystem, S3-compatible storage, MinIO, and FileBrowser.org support.
- Added strict local-cloud deployment parity rule.
- Updated storage utility deployment direction so MinIO and FileBrowser.org can run together in one custom container.
- Added single `.env` environment configuration rule with `.env.example` and Zod validation.
- Added strict TypeScript compiler standard.
- Added ESLint, Prettier, and Knip formatting/linting/dead-code hygiene decision.
- Added Playwright for E2E tests and Vitest + Fastify inject for API tests.

### Changed

- Updated open blueprint questions after selecting monorepo and backend database tooling.
