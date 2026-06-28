# Framework Foundation

## Purpose

`@codexsun/framework` is the shared technical backbone for CODEXSUN apps.

It must stay business-rule free. Platform, Core, business apps, and industry packs own product behavior.

## Current Framework Scope

The first framework package provides:

- Fastify API app bootstrap.
- Cookie and CORS registration convention.
- Standard response envelope helpers.
- App error type and API error handler.
- Environment loading through Zod.
- Structured log shape helper.
- MySQL/MariaDB connection contract.
- Module registry.
- Domain event contract and in-memory development publisher.
- Queue job contract and in-memory development adapter.
- Storage adapter contract.
- Runtime health check runner and health route helper.

## Package Subpaths

```text
@codexsun/framework
@codexsun/framework/api
@codexsun/framework/config
@codexsun/framework/db
@codexsun/framework/env
@codexsun/framework/errors
@codexsun/framework/events
@codexsun/framework/health
@codexsun/framework/http
@codexsun/framework/logger
@codexsun/framework/modules
@codexsun/framework/queue
@codexsun/framework/storage
```

## Boundary Rules

- Framework may enforce technical conventions.
- Framework must not contain tenant, subscription, billing, accounting, industry, or permission business rules.
- App modules should use framework contracts instead of direct queue, event, storage, or API boot implementations.
- Platform-specific migrations and seeders remain outside framework.

## Next Framework Work

- Add test helpers for Fastify inject.
- Add request correlation ID middleware.
- Add tenant context request type helpers after Platform tenant resolution is formalized.
- Add Kysely connection wrapper after database schema types are introduced.
- Add real queue adapters after local Docker/Redis stage.
- Add outbox helpers after event persistence tables are introduced.
