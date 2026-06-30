# Governance Rules

## Architecture Rules

- CODEXSUN is a modular monolith unless a stronger reason exists.
- Module boundaries must be explicit.
- Cross-module writes are not allowed without an approved application service or event.
- Tenant context is mandatory for business data.
- Events and jobs must include tenant context.
- Offline sync must be designed, not improvised.
- AI assistants must use permission-aware tools.
- Enterprise split into services should happen only after module boundaries and operational pressure are proven.
- Observability must be planned for APIs, queues, events, sync, integrations, and AI tools.

## Product Rules

- Every app must belong to a tenant activation model.
- Every industry-specific feature must identify its industry pack.
- Every paid feature must connect to subscription and activation rules.
- Every user-facing workflow must consider web, desktop, and mobile impact.
- Every business-critical flow must have auditability.
- Enterprise controls should be available through configuration, not forced on every small customer.
- Permissions should follow `scope.module.resource.action`.
- High-risk activation changes require confirmation, scheduling, or Super Admin approval.

## UI Rules

- Use the centralized design system.
- Keep layouts clear, dense, and work-focused for business users.
- Use consistent form, table, filter, modal, and action patterns.
- Use the shadcn/Radix themed design-system select (`WorkspaceSelect` or `Select` from `@codexsun/ui`) for all form selects; do not use raw native `<select>` in workspace/list/upsert screens.
- Use the workspace lookup (`WorkspaceLookup`) for master/reference autocomplete fields. Use inline create for small common masters such as colour/label, and popup create for heavier masters such as contact/tenant.
- Avoid custom one-off UI unless a module has a real domain need.
- Screens should make tenant, module, status, and action context clear.
- All clickable buttons and button-like controls must show a pointer cursor; disabled actions must show a disabled/not-allowed cursor.

## Data Rules

- Tenant data is never global data.
- Financial records must be auditable.
- Compliance records must be traceable.
- Deletions should usually be soft deletes for business records.
- Numbering systems must be predictable and recoverable.
- Imports must validate before writing.
- Exports must follow permission rules.

## Integration Rules

- External credentials must be encrypted.
- Integration calls must be logged.
- Failed integration calls must be retryable where safe.
- Webhooks must verify authenticity.
- Messages sent to WhatsApp, Telegram, mail, or other channels must respect user approval and tenant policy.

## AI Rules

- AI must not become a backdoor around permissions.
- AI actions should be auditable.
- AI predictions must be labeled as estimates.
- AI-generated business actions need confirmation.
- AI development suggestions must respect `assist/` architecture notes.

## Vibe Coding Rules

- Fast changes must still preserve tenant isolation.
- CODEIT should read nearby product and architecture notes before significant work.
- Small focused changes are preferred.
- Assumptions must be stated when business rules are unclear.
- Generated code should be reviewed against quality gates before release.
