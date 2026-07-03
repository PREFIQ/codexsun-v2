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

- Use the centralized design system and follow `assist/documentation/design-system-helper.md` before creating or changing workspace modules.
- Keep layouts clear, dense, and work-focused for business users.
- Use the shared workspace list, table, pagination, show, upsert, banner, autocomplete, select, date, tab, toast, and status components from `@codexsun/ui`.
- Use the shadcn/Radix themed design-system select (`WorkspaceSelect` or `Select` from `@codexsun/ui`) for all form selects; do not use raw native `<select>` in workspace/list/upsert screens.
- Use the workspace lookup (`WorkspaceLookup`) for master/reference autocomplete fields. Use inline create for small common masters such as colour/label, and popup create for heavier masters such as contact/tenant.
- Lookup/autocomplete options must come from API/database data and must refresh after creating a new option.
- Upsert forms must use shared required markers, `WorkspaceFormBanner`, and frontend validation before submit.
- Required-field banners must not be shown as passive info. Show the error banner only after save/update validation fails, and mark each invalid input, select, or autocomplete with a red border plus helper text.
- Normal master/common upsert forms must keep Active/Status inside the Details section instead of a separate Status card unless status has multiple business-specific controls.
- Lists must use database-backed data, shared table headers, shared status badges, shared row actions, and shared pagination.
- Show pages must use shared detail cards and include record activity where the backend supports it.
- Avoid custom one-off UI unless a module has a real domain need.
- Screens should make tenant, module, status, and action context clear.
- All clickable buttons and button-like controls must show a pointer cursor; disabled actions must show a disabled/not-allowed cursor.

## Data Rules

- Tenant data is never global data.
- Super Admin modules must be DB/API-backed; do not use hardcoded business records, frontend seed rows, localStorage module data, or assumptions as final behavior.
- Backend validation is required for required fields, duplicate records, status values, relationship references, safe delete blockers, and tenant/platform boundaries.
- Frontend validation must mirror required backend checks enough to show clear missing-field banners before submit.
- Every create, update, delete, force delete, suspend, restore, enable, disable, and high-risk lifecycle action must be audited.
- Show pages should expose activity/history for the selected record.
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
