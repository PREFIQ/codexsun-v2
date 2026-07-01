# CODEXSUN

Software makes simple.

CODEXSUN is a fresh monorepo foundation for a multi-tenant business application
platform. The first scaffold includes the Platform API, Platform web shell,
shared UI package, master database bootstrap, and version/changelog tooling.

## Start

```bash
npm install
npm run dev:platform
```

Platform API: <http://127.0.0.1:5510>

Platform web: <http://127.0.0.1:5520>

## Workspace

```text
apps/platform/api
apps/platform/web
packages/ui
tools/version
assist
```

## Strict UI/Form Guardrails

Before changing tenant/common/master forms, relation lookups, switch cards, placeholders, or shared form controls, read:

```text
assist/devops/ui-form-regression-guardrails.md
```

Required commands:

```bash
npm run verify:tenant-ui
npm run verify:platform-ui
```

Use `verify:tenant-ui` while developing form changes. Use `verify:platform-ui` before finishing shared UI, lookup, common module, or master module work.
