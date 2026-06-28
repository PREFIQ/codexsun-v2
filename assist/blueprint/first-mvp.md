# First MVP

## Purpose

This file locks the fresh coding baseline for CODEXSUN after starting the repository from zero.

The `assist/` folder remains the planning source of truth. Application code starts fresh from the monorepo foundation.

## First Coding Batch

Build these together:

- Monorepo tooling foundation.
- Platform API.
- Platform web app.
- Shared `@codexsun/ui` package.
- Manual version and changelog tooling.

## Runtime Scope

The first runtime scope is intentionally small:

- Public Platform home page.
- Platform status page.
- Platform API root endpoint.
- Platform API health endpoint.
- Separate login pages for Super Admin, Staff Admin, and Tenant users.
- Super Admin Desk shell.
- Staff Admin Desk shell.
- Tenant Desk shell.

## Database Scope

Use MariaDB.

The first server boot must:

- Create `codexsun_master_db` if it does not exist.
- Create the first test tenant database if it does not exist.
- Run foundation migrations automatically.
- Seed Super Admin in the master database.
- Seed Staff Admin in the master database for local staff-desk testing.
- Seed Tenant Admin in the test tenant database.

Seed users:

```text
Super Admin
Name: SUNDAR
Email: sundar@sundar.com
Password: Kalarani1@@

Staff Admin
Email: admin@codexsun.com
Password: admin@123

Tenant Admin
Tenant code: test
Email: admin@tenant.com
Password: admin@123
```

The first database order is:

1. Master database.
2. Tenant database.

## Docker Scope

Do not require Docker in the first scaffold.

Prepare for Docker after this first stage is complete. The later Docker stage should add local MariaDB, Redis, API, web, and optional storage utility services.

## Out Of Scope

Do not build these in the first scaffold:

- Billing workflows.
- Accounting workflows.
- CRM workflows.
- Ecommerce workflows.
- Offline sync engine.
- Docker runtime.
- Mobile app.
- Desktop app.
- ZERO business assistant.
- Full CODEIT app.
- Marketplace or plugin store.
