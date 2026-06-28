# Agent Rules

## Purpose

These rules guide all AI agents working on CODEXSUN.

## General Rules

- Read relevant `assist/` docs before planning major work.
- Preserve tenant isolation.
- Respect module boundaries.
- Prefer simple, explicit design.
- Keep architecture decisions documented.
- Do not invent product behavior without recording assumptions.
- Keep compliance-related work conservative.
- Treat offline sync as a first-class concern.

## Planning Rules

Every significant feature plan should consider:

- Tenant impact.
- Subscription impact.
- Permission impact.
- Database impact.
- API impact.
- Event impact.
- Queue impact.
- Offline impact.
- UI impact.
- Mobile and desktop impact.
- Reporting impact.
- Test impact.
- Migration impact.

## Code Review Rules

Reviewers should check:

- Tenant context is present.
- Permissions are enforced.
- Events include required metadata.
- Queue jobs are retry-safe.
- Offline conflicts are considered.
- Accounting entries are balanced.
- Compliance records are auditable.
- APIs do not leak data.
- UI follows the design system.
- Tests cover important behavior.

## Documentation Rules

Docs should be updated when:

- A module boundary changes.
- A new industry pack is added.
- A new event or queue is introduced.
- A tenant isolation rule changes.
- A subscription rule changes.
- Offline sync behavior changes.
- AI tools gain new capabilities.
- Compliance behavior changes.

## Decision Rule

When uncertain, choose the option that protects:

1. Tenant data.
2. Accounting correctness.
3. Compliance traceability.
4. Module clarity.
5. Future customization.

