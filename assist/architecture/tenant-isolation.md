# Tenant Isolation

## Goal

Every tenant must behave like a separate customer environment even when multiple tenants share the same codebase, app servers, containers, or infrastructure.

## Isolation Levels

CODEXSUN should support multiple isolation patterns:

- Dedicated database per tenant.
- Shared infrastructure with strict tenant routing.
- Dedicated containers for high-value or regulated tenants.
- Local offline store per tenant on desktop or mobile.

The default planning assumption is one database per tenant where business isolation, backup, restore, or customization requires it.

## Tenant Context

Tenant context should include:

- Tenant ID.
- Tenant slug or code.
- Tenant database connection target.
- Active subscription.
- Active industry pack.
- Active apps and features.
- Locale and compliance settings.
- User role and permission scope.

Tenant context must be available in:

- HTTP requests.
- WebSocket events.
- Queue jobs.
- Domain events.
- Scheduled tasks.
- Sync payloads.
- Audit logs.
- AI tool calls.
- Integration calls.

Tenant context may be resolved from custom domain, subdomain, path fallback, or explicit headers depending on client and app surface. Production tenant web should primarily use custom domain or subdomain. Path fallback is reserved for development, internal tools, and Super Admin support flows. Jobs and events must always carry tenant ID explicitly.

Application tenant resolution only needs domain-to-tenant mapping. SSL certificates, DNS, Cloudflare, Nginx, and reverse proxy concerns belong to infrastructure.

## Data Access Rules

- No tenant business data access without tenant context.
- No global query should accidentally read tenant data.
- Background jobs must restore tenant context before work starts.
- Integration callbacks must resolve tenant context safely.
- Reporting must respect tenant and permission boundaries.
- AI assistants must not access data outside the current tenant or approved support scope.

## Customization Rules

Tenant customization should be stored as structured configuration:

- Enabled apps.
- Enabled features.
- UI preferences.
- Print templates.
- Numbering formats.
- Tax settings.
- Workflow settings.
- Custom fields.
- Integration credentials.

Customizations must be versioned when they affect data shape, billing logic, accounting, or compliance output.

## Backup And Restore

Each tenant should have a planned backup and restore strategy:

- Full database backup.
- File storage backup.
- Configuration backup.
- Audit trail retention.
- Restore testing.
- Point-in-time recovery where possible.

## Security Notes

- Tenant database credentials should not be exposed to clients.
- API tokens must be tenant-scoped.
- External integration credentials must be encrypted.
- Support access must be audited.
- Cross-tenant admin actions need elevated permission and logging.
