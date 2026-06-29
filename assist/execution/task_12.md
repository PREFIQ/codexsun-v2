# Task 12 - Developer And Agent Workbench Foundation

## Purpose

This task comes after `assist/execution/task_11.md`.

Task 12 prepares CODEIT/ZERO-safe infrastructure without giving AI unrestricted business access. This is still platform foundation work.

## Batch State

| Field | Value |
| --- | --- |
| Task reference | `task_12` |
| Status | `planned` |
| Depends on | Task 11 complete and verified |
| Focus | Agent permissions, prompt/tool registry, action audit, and developer workbench shell |
| Last updated | `2026-06-29` |

## Goal

Create safe foundations for future AI-assisted work:

- agent/tool permission model
- prompt/template registry
- action audit
- task execution view
- provider/model settings shell
- tenant-safe context rules
- developer workbench shell

Do not build ZERO business assistant data tools yet.

## Required Work

### 1. Agent Permission Model

Define:

- agent key
- allowed tools
- allowed scopes
- tenant access rule
- user confirmation requirement
- audit requirement

Agents must follow user permissions and tenant isolation.

### 2. Tool Registry

Define tool metadata:

- `toolKey`
- `label`
- `description`
- `scope`
- `requiredPermission`
- `requiresConfirmation`
- `auditLevel`

No unrestricted database tools.

### 3. Prompt Template Registry

Define prompt/template records:

- template key
- purpose
- version
- allowed agent
- required context
- safety notes

### 4. Agent Action Audit

Record:

- agent key
- user
- tenant
- action
- tool key
- input summary
- output summary
- confirmation state
- correlation id
- timestamp

Do not store secrets or full sensitive business payloads.

### 5. Developer Workbench Shell

Build UI shell:

- task list
- task detail
- prompt template list
- tool registry view
- action audit view
- model/provider settings placeholder

Use Task 5 workspace components.

### 6. Provider Settings Shell

Create settings UI only:

- provider name
- model label
- enabled/disabled
- secret reference masked
- local/cloud flag

No real provider integration required.

## Tests

Add coverage for:

- tool permission check
- tenant access denied
- confirmation required actions
- audit write on agent action
- secret masking in provider settings

## Out Of Scope

- ZERO business data querying.
- Autonomous business actions.
- Model provider integration.
- Vector search.
- Training pipelines.
- Customer-facing AI chat.

## Verification

```bash
npm.cmd run typecheck
npm.cmd run lint
```

Run package-specific tests if added.

## Documentation

Update:

- `assist/agents/codeit.md`
- `assist/agents/zero.md`
- `assist/architecture/security-and-compliance.md`
- `assist/product/product-scope.md`
- `assist/documentation/CHANGELOG.md`

## Handoff Notes

- AI tools must respect tenant, role, permission, and audit boundaries.
- Use confirmation for irreversible or external actions.
- Do not expose business data to agents until explicit business-module tools are designed and reviewed.
