# App Bundle Structure

## Purpose

CODEXSUN is developed as one codebase with many app bundles. Each business app should be owned separately in source code, while deployable containers can bind the required apps, shared packages, backend runtime, frontend runtime, and workers together.

This keeps Billing, Ecommerce, CRM, Sites, and future apps independent enough to develop, test, package, and deploy separately without losing the shared platform foundation.

## Standard App Folder Shape

Use this structure for platform and business apps:

```text
apps/
  platform/
    api/              # Auth, tenant, RBAC, app registry, gateway/composition
    web/              # Main shell: login, SA desk, tenant desk, navigation

  core/
    src/              # Contacts, companies, products, common masters, shared tenant records
    web/              # Core frontend: common/master screens, lookups, reusable tenant data UI

  billing/
    src/              # Billing backend domain/app/contracts/routes/migrations/workers
    web/              # Billing frontend routes/screens/forms

  accounts/
    src/              # Accounts backend domain/app/contracts/routes/migrations/workers
    web/              # Accounts frontend routes/screens/forms

  ecommerce/
    src/              # Ecommerce backend domain/app/contracts/routes/migrations/workers
    web/              # Ecommerce storefront/admin frontend

  crm/
    src/              # CRM backend domain/app/contracts/routes/migrations/workers
    web/              # CRM frontend routes/screens/forms

  sites/
    src/              # Sites backend domain/app/contracts/routes/migrations/workers
    web/              # Sites/frontend builder screens and public-site app code
```

## `src` Versus `api`

For business apps, use `src`, not `api`.

`src` is the meaningful name because a business app is more than HTTP routes. It owns domain rules, application use cases, contracts, infrastructure, migrations, events, queues, workers, sync behavior, tests, and interface adapters.

Use `api` only for a runnable API process whose job is composition or gateway behavior.

Correct:

```text
apps/billing/src
apps/billing/web
apps/ecommerce/src
apps/ecommerce/web
```

Special platform runtime:

```text
apps/platform/api
apps/platform/web
```

## Frontend Ownership

`apps/platform/web` is the shell and composer. It should own login, super-admin desk, admin desk, tenant desk layout, global navigation, app activation, and route composition.

Business UI belongs to the app that owns the business meaning:

```text
apps/core/web       # Common/master tenant UI
apps/billing/web    # Billing entries, billing settings, billing reports
apps/accounts/web   # Accounts vouchers, ledgers, financial reports
apps/ecommerce/web  # Catalog, cart, orders, storefront/admin
apps/crm/web        # Leads, customers, pipeline, activities
apps/sites/web      # Site builder, pages, themes, public site tools
```

Shared UI primitives stay in `packages/ui`. Do not move business rules or business-specific forms into `packages/ui`.

App web packages should export routes, menus, and screens that the platform shell can compose based on tenant activation and bundle configuration.

## Backend Ownership

Each business app backend owns its own business rules, tables, migrations, events, workers, and public contracts.

Examples:

- Billing owns quotations, sales, export sales, purchase, receipt, payment, cash book, bank book, billing document settings, and billing-specific compliance fields.
- Ecommerce owns catalog sales flow, storefront/admin ecommerce behavior, cart, ecommerce orders, and ecommerce-specific settings.
- Core owns contacts, companies, products, common modules, and shared tenant master records.
- Platform owns tenant identity, auth, roles, permissions, activation, subscription, audit, settings, files, notifications, and app registry behavior.

When one app needs another app to react, prefer contracts and events instead of direct cross-module table writes.

Example:

```text
Ecommerce order confirmed
  -> publish ecommerce.order.confirmed
  -> Billing creates invoice or proforma through Billing rules
```

## Module File Pattern

Inside `apps/{app}/src/modules/{module}/`, use one folder with module-prefixed files. Do not create deep boundary folders for each concern.

Required pattern:

```text
apps/billing/src/modules/quotation/
  quotation.module.ts       # Module definition and registration
  quotation.service.ts      # Use cases and business operations
  quotation.repository.ts   # Database adapter
  quotation.routes.ts       # HTTP/interface layer
  quotation.events.ts       # Event names and handlers
  quotation.migration.ts    # Quotation-specific migrations
  quotation.worker.ts       # Background jobs and queue registration
  quotation.seed.ts         # Default data
  quotation.sync.ts         # Offline sync rules
  quotation.test.ts         # Tests
  quotation.types.ts        # Public types and contracts
  index.ts                  # Exports
```

Follow the same pattern for every module:

```text
apps/{app}/src/modules/{module}/{module}.module.ts
apps/{app}/src/modules/{module}/{module}.service.ts
apps/{app}/src/modules/{module}/{module}.repository.ts
apps/{app}/src/modules/{module}/{module}.routes.ts
apps/{app}/src/modules/{module}/{module}.events.ts
apps/{app}/src/modules/{module}/{module}.migration.ts
apps/{app}/src/modules/{module}/{module}.worker.ts
apps/{app}/src/modules/{module}/{module}.seed.ts
apps/{app}/src/modules/{module}/{module}.sync.ts
apps/{app}/src/modules/{module}/{module}.test.ts
apps/{app}/src/modules/{module}/{module}.types.ts
apps/{app}/src/modules/{module}/index.ts
```

This is strict for new modules and for module cleanup work. It keeps modules compact, readable, and close to the NestJS mental model without requiring NestJS itself.

## Bundle Model

Deployable bundles are product assemblies. A bundle decides which apps are included in that container or deployment.

Examples:

```text
billing-suite
  shared packages
  framework
  platform
  core
  billing
  accounts

ecommerce-suite
  shared packages
  framework
  platform
  core
  billing
  ecommerce

crm-suite
  shared packages
  framework
  platform
  core
  crm

sites-suite
  shared packages
  framework
  platform
  sites
```

The codebase is developed app-by-app. Containers bind the selected apps and shared packages together.

## Docker Direction

Each product bundle may have its own backend, frontend, and worker container:

```text
docker/
  billing/
    api.Dockerfile
    web.Dockerfile
    worker.Dockerfile

  ecommerce/
    api.Dockerfile
    web.Dockerfile
    worker.Dockerfile

  crm/
    api.Dockerfile
    web.Dockerfile
    worker.Dockerfile

  sites/
    api.Dockerfile
    web.Dockerfile
```

Containers can include their required shared packages and app packages, but tenant context, permission checks, activation checks, audit context, and feature flags must remain active in every runtime.

## Build Output Rule

All build outputs should land under the root `dist/` folder using the same source structure:

```text
dist/apps/platform/api
dist/apps/platform/web
dist/apps/core
dist/apps/core/web
dist/apps/billing
dist/apps/billing/web
dist/apps/accounts
dist/apps/accounts/web
dist/apps/ecommerce/web
dist/apps/crm/web
dist/apps/sites/web
dist/packages/framework
dist/packages/platform
dist/packages/ui
```

Do not rely on app-local build output as the final artifact location. Root `dist/` is the packaging surface for Docker and release collection.

## Turbo Cache Rule

App-local `.turbo` folders should not be kept under `apps/`. Root build and dev workflows should clean app-local Turbo folders so the workspace stays easy to inspect and package.

## Working Rule

Platform activates and composes apps. Core supplies common business foundation. Each app owns its own backend and frontend. Containers bind selected apps into product bundles.
