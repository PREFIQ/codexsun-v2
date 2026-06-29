# Task 6 - Workspace Navigation And App Shell Runtime

## Purpose

This task comes after `assist/execution/task_5.md`.

Task 5 creates the reusable workspace design system, list/show/upsert patterns, and UI dependency bindings. Task 6 should make the application shell runtime real and reusable across future apps before any business logic begins.

Do not implement billing, accounting, contacts, invoices, inventory, CRM, POS, offline sync, ZERO business logic, or business module APIs in this task.

## Batch State

| Field | Value |
| --- | --- |
| Task reference | `task_6` |
| Status | `planned` |
| Depends on | Task 5 complete and verified |
| Focus | Workspace navigation, app shell runtime, route metadata, and module visibility |
| Last updated | `2026-06-29` |

## Goal

Turn the current desk and side-menu shell into a runtime-driven workspace shell that every app can reuse.

The shell should understand:

- Current desk.
- Current tenant context.
- Current app/workspace.
- Available modules.
- Sidebar menu structure.
- Top workspace switcher.
- Route/page metadata.
- Permission and activation visibility.
- Loading, error, forbidden, disabled, empty, and not-found states.

The result should let future modules register navigation and pages without hard-coding menus in every layout.

## Required Context

Read before implementing:

- `assist/execution/task_4.md`
- `assist/execution/task_5.md`
- `assist/README.md`
- `assist/blueprint/platform-foundation.md`
- `assist/architecture/module-boundaries.md`
- `assist/architecture/tenant-isolation.md`
- `assist/governance/engineering-standards.md`
- `assist/governance/quality-gates.md`
- Existing layout files under `packages/ui/src/layouts/`
- Existing side-menu files under `packages/ui/src/blocks/menu/sidemenu/`
- Existing Platform Web routes/pages under `apps/platform/web/src/`

## Work Scope

### 1. Workspace Runtime Types

Add shared runtime UI contracts in `@codexsun/ui` or `@codexsun/platform` depending on ownership.

Preferred frontend-owned location:

```text
packages/ui/src/workspace/runtime.ts
packages/ui/src/workspace/navigation.ts
packages/ui/src/workspace/routes.ts
```

Required types:

- `WorkspaceDesk`
  - `sa`
  - `admin`
  - `tenant`
- `WorkspaceApp`
  - key
  - label
  - description
  - icon
  - href
  - status
  - requiredPermission
  - requiredFeature
- `WorkspaceNavItem`
  - key
  - label
  - href
  - icon
  - children
  - requiredPermission
  - requiredFeature
  - badge
  - disabledReason
- `WorkspaceRouteMeta`
  - title
  - description
  - technicalName
  - appKey
  - navKey
  - requiredPermission
  - requiredFeature
- `WorkspaceContext`
  - desk
  - tenantId
  - tenantCode
  - user
  - currentApp
  - enabledApps
  - permissions

Acceptance:

- Layout and navigation components no longer depend on scattered hard-coded route labels.
- Future modules have one obvious route/menu metadata shape to follow.

### 2. App Shell Provider

Create a reusable shell provider:

```text
packages/ui/src/workspace/shell-provider.tsx
```

Responsibilities:

- Provide current workspace context.
- Provide current app list.
- Provide current sidebar menu.
- Provide current route metadata.
- Filter visible navigation by permission and activation status.
- Expose helpers for active route/app detection.

Platform Web may own the real data assembly for now:

```text
apps/platform/web/src/workspace/workspace-runtime.ts
apps/platform/web/src/workspace/workspace-registry.ts
```

Acceptance:

- `SuperLayout`, `AdminLayout`, and `TenantLayout` can consume the same runtime context shape.
- Current static menu behavior remains visually stable.
- No backend dependency is required for the first implementation; dummy/static runtime data is acceptable if typed and ready for API replacement.

### 3. Menu Registry

Replace scattered menu item constants with a registry pattern.

Required registries:

- Super Admin desk menu.
- Staff Admin desk menu.
- Tenant desk menu.
- Workspace app switcher items.
- User menu items.

Rules:

- Menu entries should be data, not layout code.
- Menu entries can be hidden or disabled based on permission/activation.
- Disabled entries should be visibly disabled only when useful; otherwise hide them.
- Keep active route highlighting consistent across nested routes.

Acceptance:

- Adding a future module should require adding a nav registration, not editing the layout internals.
- Sidebar active state and top app active state work from route metadata.

### 4. Route Metadata

Add route metadata to Platform Web route definitions.

Required examples:

- `/`
- `/status`
- `/login`
- `/sa`
- `/admin`
- `/tenant`
- `/design`
- `/design/common-list`
- `/design/master-list`
- `/design/entry-list`

Metadata should drive:

- top menu page title
- browser page title where possible
- sidebar active item
- page permission/feature check
- breadcrumb text

Acceptance:

- Page title and breadcrumb do not need to be repeated inside every page unless the page has record-specific title behavior.
- Unknown routes show a reusable not-found page.

### 5. Common Shell States

Create reusable shell state pages/components:

```text
packages/ui/src/workspace/states.tsx
```

Required states:

- `WorkspaceLoadingState`
- `WorkspaceErrorState`
- `WorkspaceEmptyState`
- `WorkspaceForbiddenState`
- `WorkspaceDisabledFeatureState`
- `WorkspaceNotFoundState`
- `WorkspaceComingSoonState`

Use them in Platform Web for:

- unauthorized/forbidden desk access
- missing route
- disabled module placeholder
- design template loading/error placeholders where relevant

Acceptance:

- All states match the Task 5 workspace visual language.
- States are plain, useful, and do not look like marketing hero sections.

### 6. Mobile And Responsive Navigation

Verify and harden:

- sidebar collapse
- top menu wrapping
- workspace switcher menu
- user menu
- breadcrumb truncation
- action buttons on small screens
- list template routes from Task 5 inside the shell

Acceptance:

- No overlapping text or controls on mobile.
- Header actions wrap cleanly.
- Sidebar remains usable with icon collapse and mobile drawer behavior.

### 7. Keyboard And Accessibility Pass

Required checks:

- Sidebar links are keyboard reachable.
- Dropdown menus have labels.
- Icon-only buttons have `aria-label`.
- Active nav state is visually clear.
- Disabled nav items are not focus traps.
- Escape closes dropdowns/dialogs already provided by primitives.

Acceptance:

- Workspace shell can be operated without mouse for primary navigation.
- No obvious unlabeled icon buttons remain in the shell.

### 8. Demo Routes

Create or update a workspace shell demo page if useful:

```text
/design/workspace-shell
```

It should show:

- current app switcher
- sidebar groups
- route metadata display
- allowed/disabled menu examples
- loading/error/forbidden/not-found states

Acceptance:

- Developers can inspect shell behavior without touching business modules.

## Out Of Scope

- Real business modules.
- Backend permission APIs beyond consuming existing/static contracts.
- Full RBAC editor UI.
- Tenant provisioning UI.
- Billing/accounting/contact/invoice screens.
- Offline sync navigation.
- Mobile app or desktop app shell.

## Verification Commands

Use `npm.cmd` on Windows:

```bash
npm.cmd run typecheck -w @codexsun/ui
npm.cmd run lint -w @codexsun/ui
npm.cmd run typecheck -w @codexsun/platform-web
npm.cmd run lint -w @codexsun/platform-web
```

If shared exports or package dependencies change, also run:

```bash
npm.cmd run typecheck
npm.cmd run lint
```

## Visual QA

Start Platform Web and inspect:

- desktop width
- tablet width
- mobile width
- collapsed sidebar
- expanded sidebar
- workspace switcher
- user menu
- design list template pages from Task 5
- not-found route
- forbidden/disabled state demos

Check:

- no overlap
- no clipped text in buttons
- active navigation is correct
- route title and breadcrumb are correct
- menu filtering works
- disabled modules are clear

## Documentation

Update after implementation:

- `assist/blueprint/platform-foundation.md`
- `assist/governance/engineering-standards.md`
- `assist/documentation/CHANGELOG.md`

Document:

- workspace runtime types
- navigation registry pattern
- route metadata pattern
- shell state components
- permission/activation visibility rules

## Handoff Notes

- Task 6 is still foundation work, not business work.
- Keep app shell runtime data-driven.
- Do not hard-code future module behavior in layouts.
- Keep the design from Task 5 as the visual base.
- Keep permission and activation checks separate: permission says who can access; activation says whether the tenant/app has the feature enabled.
- If a module is disabled, the UI should either hide it or show a consistent disabled-feature state.
