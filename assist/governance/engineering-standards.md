# Engineering Standards

## Purpose

These standards keep CODEXSUN clean while allowing fast development.

## Code Organization

Code should be organized by product meaning and module ownership.

Recommended conceptual structure:

- Platform core.
- Domain modules.
- Industry packs.
- Shared UI.
- Shared types.
- Infrastructure adapters.
- Desktop shell.
- Mobile app.
- Agent tools.

## Naming Standards

Use names that match business language.

Good names:

- `Invoice`
- `Ledger`
- `StockMovement`
- `TenantActivation`
- `SyncConflict`
- `GarmentSizeMatrix`

Avoid vague names:

- `DataManager`
- `CommonHelper`
- `ProcessThing`
- `ModuleUtil`
- `CustomLogic`

## TypeScript Standards

- Prefer explicit domain types.
- Avoid `any` unless there is a documented reason.
- Use validation at API boundaries.
- Keep shared types stable.
- Do not expose database models directly to clients.
- Keep command and query shapes clear.
- Use strict TypeScript from day one.
- Enable `noUncheckedIndexedAccess`.
- Enable `exactOptionalPropertyTypes`.

## Lint And Format Standards

- Use ESLint for code quality rules.
- Use Prettier for formatting.
- Use Knip to detect unused dependencies, files, and exports.
- CI should fail on lint, format, type, or Knip violations once the foundation is active.

## Backend Standards

- Routes should be thin.
- Application services should orchestrate use cases.
- Domain logic should not live in route handlers.
- Infrastructure adapters should hide provider details.
- Queue jobs must be idempotent where possible.
- Events must include tenant context.
- Errors should be structured.

## Frontend Standards

- Use the central design system.
- Use TanStack Query for server state.
- Use TanStack Table for serious data grids.
- Keep forms predictable.
- Show loading, empty, error, and permission states.
- Keep business screens dense and scannable.
- Buttons and button-like controls must use `cursor: pointer`; disabled actions must use a disabled/not-allowed cursor.
- Do not place business rules only in frontend.

## Database Standards

- Migrations must be ordered and immutable.
- Indexes should support common filters.
- Financial data should preserve history.
- Soft delete business records unless permanent deletion is justified.
- Audit fields are required for important records.
- Tenant-specific databases must follow the same migration contract.

## Event Standards

Events should contain:

- Event name.
- Event version.
- Tenant context.
- Actor context where available.
- Correlation ID.
- Occurred timestamp.
- Payload.

Events should not contain unnecessary sensitive data.

## Queue Standards

Jobs should contain:

- Job name.
- Tenant context.
- Retry policy.
- Idempotency key where useful.
- Correlation ID.
- Clear failure reason.

Long-running jobs should expose progress where useful.

## Documentation Standards

Update docs when:

- A domain rule changes.
- A module contract changes.
- A new event is added.
- A new integration is added.
- A sync rule changes.
- An enterprise rule changes.
- A user-facing workflow changes significantly.
