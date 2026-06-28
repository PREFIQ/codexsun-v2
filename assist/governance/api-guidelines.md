# API Guidelines

## API Goals

CODEXSUN APIs must be tenant-aware, permission-aware, stable, and clear for web, desktop, mobile, workers, integrations, and AI tools.

## API Rules

- Every business API must resolve tenant context.
- Every protected API must check authentication.
- Every business action must check authorization.
- API boundaries should use Zod validation.
- APIs should call application services, not database tables directly.
- API responses should avoid leaking internal implementation details.
- Validation errors should be clear and field-specific.
- Financial and compliance APIs should be especially explicit.

## API Types

### Public Client APIs

Used by web, desktop, and mobile clients.

Need:

- Stable contracts.
- Pagination.
- Filtering.
- Sorting.
- Permission-aware responses.
- Clear error formats.

### Internal APIs

Used between app runtime parts.

Need:

- Strong authentication.
- Tenant context.
- Trace IDs.
- Version awareness.

### Integration APIs

Used by external apps and customer integrations.

Need:

- API keys or OAuth where appropriate.
- Rate limits.
- Webhook verification.
- Tenant scoping.
- Audit logs.
- Versioned contracts.

### AI Tool APIs

Used by CODEIT or ZERO.

Need:

- Strict permission checks.
- Purpose-based access.
- Limited fields.
- Audited tool calls.
- Safe action confirmation.

## Shared Contracts

Backend modules should expose public API contracts from their `contracts/` folder.

Contracts may include:

- Zod schemas.
- Request types.
- Response types.
- Route contract metadata.
- Shared API error codes.

Database models should not be exposed directly as API contracts.

## Shared API Client

Frontend, desktop, mobile, CLI, and internal tools should use `@codexsun/api-client` where practical.

The API client should handle:

- Standard response envelope.
- Error normalization.
- Auth/session behavior.
- Tenant context.
- Typed calls through shared contracts.
- App-specific base URLs.

## Error Shape

Errors should include:

- Code.
- Message.
- Field errors where relevant.
- Trace ID.
- Retry hint where relevant.

Avoid exposing stack traces or database details to clients.

## Response Envelope

All APIs should return the standard CODEXSUN envelope.

Success:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "req_123",
    "timestamp": "2026-06-28T10:00:00Z"
  }
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "TENANT_NOT_FOUND",
    "message": "Tenant not found",
    "details": {}
  },
  "meta": {
    "requestId": "req_123",
    "timestamp": "2026-06-28T10:00:00Z"
  }
}
```
