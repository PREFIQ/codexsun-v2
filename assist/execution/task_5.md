# Task 5 - Workspace Design System And Reusable List Patterns

## Purpose

This task comes after `assist/execution/task_4.md`.

Task 5 is frontend-focused. It should turn the current desk and side-menu shell into a reusable workspace design system for all CODEXSUN apps.

The goal is to build a clean reusable set of UI blocks for:

- Workspace page frame.
- Base panel/card surfaces.
- Page header and action bar.
- Buttons and icon actions.
- Filters and column controls.
- Data lists and tables.
- Pagination.
- Show/detail pages.
- Upsert forms.
- Popup forms.
- Print preview surfaces.
- Entry forms with sub tables.

The implementation should use dummy data first and show three working template flows:

- `CommonList`: List + Show + Upsert in either popup or dedicated page, with the Tenant Domains demo using the dedicated page design shown in the reference screenshots.
- `MasterList`: List + Show + Upsert dedicated page.
- `EntryList`: List + Show page with print preview + Upsert page with sub tables.

Important consolidation rule:

- Do not build three separate list engines.
- Build one reusable workspace list/show foundation.
- Expose `CommonList`, `MasterList`, and `EntryList` as presets/wrappers over the same foundation.
- Only the upsert surfaces should differ by workflow.

## UX Source

Read from the older workspace before implementing:

- `E:\Workspace\cxsun\docs\architecture\design-system.md`
- `E:\Workspace\cxsun\apps\frontend\src\components\blocks\lists\common-list.tsx`
- `E:\Workspace\cxsun\apps\frontend\src\components\blocks\lists\master-list.tsx`
- `E:\Workspace\cxsun\apps\frontend\src\features\tenant\interface\pages\tenant-list-page.tsx`
- `E:\Workspace\cxsun\apps\frontend\src\features\contact\contact-page.tsx`
- `E:\Workspace\cxsun\apps\frontend\src\features\stock\inward\purchase-receipt\purchase-receipt-page.tsx`
- `E:\Workspace\cxsun\apps\frontend\src\features\stock\inward\purchase-receipt\main-print-template.tsx`

Observed UX direction from `cxsun`:

- Use a workspace page frame with title, description, technical name, and right actions.
- Put search, filters, column visibility, and local actions in one compact toolbar panel.
- Put tables inside clean bordered panels.
- Keep pagination as a separate compact bottom panel.
- Use row action menu with View, Edit, Suspend/Restore.
- Use show pages with Back/Edit/Print actions at the top.
- Use upsert pages with tabs/sections and consistent footer actions.
- Use popup upsert only for smaller common/config records.
- Use dedicated upsert pages for larger master and entry records.
- Use print preview only for entry/document flows.

## Screenshot Design Contract

The attached Tenant Domains screenshots are the visual target for Task 5. If the older `cxsun` files conflict with these screenshots, follow the screenshots.

### List Screen Layout

Use this exact structure:

1. Page header on the left:
   - Large title.
   - One short muted description line.
   - No card around the title.
2. Header actions on the right:
   - `Refresh` outline button.
   - Primary black `New ...` button.
   - Actions align to the page title row and wrap on small screens.
3. Toolbar panel:
   - One clean bordered panel below the header.
   - Search input left.
   - Filter button right.
   - Optional column button may sit next to filter when needed.
4. Table panel:
   - Separate bordered panel below the toolbar.
   - Header row with light muted background.
   - Empty state centered in the table body.
   - Table min-height should keep the empty state visually stable.
5. Pagination panel:
   - Separate bordered panel below the table.
   - Left side: total count and rows-per-page selector.
   - Right side: showing label and previous/current/next controls.
6. Page width:
   - Content sits inside the existing workspace shell.
   - Use the same left/right alignment as the screenshot.
   - Do not create a floating page card around the whole screen.

### Upsert Screen Layout

Use this exact structure:

1. Page header on the left:
   - Large title, such as `New Tenant Domain`.
   - One short muted description line.
   - No card around the title.
2. Back action on the right:
   - Small outline `Back` button with left arrow icon.
3. Form panel:
   - One large bordered panel below the header.
   - Panel header includes section title and description.
   - Body has generous but not oversized spacing.
   - Fields use consistent labels and input height.
   - Two-column grid on desktop, single-column on mobile.
   - Switch rows span full width when they describe a setting.
   - Horizontal separators may divide logical groups.
4. Footer actions:
   - Save and Cancel sit at the bottom-right inside the form panel.
   - Primary save button is black.
   - Cancel is outline.
   - Footer remains visually tied to the form panel, not floating outside.

These screenshots should define the default `CommonList` visual language. `MasterList` and `EntryList` should extend it without changing the basic spacing, borders, button treatment, or page rhythm.

## Batch State

| Field | Value |
| --- | --- |
| Task reference | `task_5` |
| Status | `planned` |
| Depends on | Task 4 complete enough for frontend contracts |
| Focus | Reusable workspace UI patterns and dummy templates |
| Last updated | `2026-06-29` |

## Target Package Structure

Create reusable workspace modules inside `@codexsun/ui`.

```text
packages/ui/src/workspace/
  index.ts
  page.tsx
  panel.tsx
  header.tsx
  actions.tsx
  field.tsx
  status.tsx
  list.tsx
  show.tsx
  upsert.tsx
  table.tsx
  filters.tsx
  pagination.tsx
  print.tsx
  editor.tsx
  autocomplete.tsx
  drag-drop.tsx
  types.ts
  utils.ts

packages/ui/src/workspace/presets/
  common-list.tsx
  master-list.tsx
  entry-list.tsx

apps/platform/web/src/pages/templates/
  CommonListTemplatePage.tsx
  MasterListTemplatePage.tsx
  EntryListTemplatePage.tsx
  template-data.ts
```

Export the reusable blocks from `packages/ui/src/index.ts`.

App code must import workspace UI from `@codexsun/ui`, not from raw third-party packages and not from `packages/ui/src` paths.

Preferred imports:

```tsx
import {
  WorkspaceList,
  WorkspaceShow,
  CommonList,
  MasterList,
  EntryList,
  CommonUpsertPage,
  CommonUpsertDialog,
  MasterUpsertPage,
  EntryUpsertPage
} from "@codexsun/ui";
```

## Shared Design Rules

- Use the existing desk shell and side menu.
- Keep panels clean: 8px radius or less.
- Do not nest cards inside cards.
- Prefer icons for repeated actions.
- Tables must be dense, readable, and horizontally scrollable when needed.
- Header actions must stay on the right on desktop and wrap cleanly on mobile.
- Search/filter/column tools must use stable heights and must not shift layout.
- Forms must use the same field, section, footer, and validation layout everywhere.
- Print preview must be hidden from normal list view unless the entry show page is active.
- Use dummy data only in template pages.
- Do not wire real APIs in this task.
- Do not duplicate toolbar/table/pagination/show logic between Common, Master, and Entry patterns.
- Keep dependency bindings in `@codexsun/ui`; application packages should consume CODEXSUN wrappers.

## UI Dependency Binding

Install required UI libraries into `@codexsun/ui` and expose them through CODEXSUN workspace components.

Current useful packages already present in `@codexsun/ui` include Radix primitives, `cmdk`, `@tanstack/react-table`, `@dnd-kit/*`, `sonner`, `recharts`, `react-day-picker`, `react-resizable-panels`, and `zod`. Verify versions and install missing packages needed for the complete workspace system.

Required dependency groups:

- Motion:
  - `framer-motion`
  - Bind through `packages/ui/src/workspace/motion.tsx` or inside workspace components.
  - Use for tabs, panel transitions, row reveal, command/autocomplete reveal, and drawer/dialog transitions.
- Rich text:
  - `@tiptap/react`
  - `@tiptap/starter-kit`
  - `@tiptap/extension-placeholder`
  - Optional only if needed: `@tiptap/extension-link`, `@tiptap/extension-table`, `@tiptap/extension-text-align`.
  - Bind through `packages/ui/src/workspace/editor.tsx`.
  - Use for notes, terms, comments, long descriptions, and document text fields.
- Tables:
  - `@tanstack/react-table`
  - Bind through `packages/ui/src/workspace/table.tsx`.
  - App pages pass columns/data/actions; they should not directly set up TanStack table instances unless the design-system wrapper exposes that escape hatch.
- Drag and drop:
  - `@dnd-kit/core`
  - `@dnd-kit/sortable`
  - `@dnd-kit/modifiers`
  - `@dnd-kit/utilities`
  - Bind through `packages/ui/src/workspace/drag-drop.tsx`.
  - Use for line-item reorder, column order, kanban/orderable lists, attachments, and form section ordering.
- Autocomplete and command:
  - `cmdk`
  - Radix `Popover`, `Command`, `ScrollArea`
  - Bind through `packages/ui/src/workspace/autocomplete.tsx`.
  - Provide reusable single-select, multi-select, async-search, create-new, and keyboard navigation behavior.
- Forms and validation:
  - `zod`
  - If a form helper is needed, install `react-hook-form` and `@hookform/resolvers`.
  - Bind form sections and errors through `WorkspaceField`, `WorkspaceSection`, and upsert components.
- Dates and numbers:
  - Keep `date-fns` if used by shared calendar/date controls.
  - Keep formatting helpers inside `packages/ui/src/workspace/utils.ts` only for display formatting; business calculations stay outside UI.
- Charts and dashboards:
  - Keep `recharts` behind chart components exported by `@codexsun/ui`.
- Notifications:
  - Keep `sonner` behind app-level/toaster wrappers where possible.

Dependency rule:

- Do not scatter frontend library usage across apps.
- If a third-party UI library is needed by multiple apps, install it in `@codexsun/ui`, wrap it, export the wrapper, and use that wrapper from apps.
- App-level packages may keep router/query/API dependencies, but visual controls belong in `@codexsun/ui`.

Suggested install command:

```bash
npm.cmd install -w @codexsun/ui framer-motion @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-link @tiptap/extension-table @tiptap/extension-text-align react-hook-form @hookform/resolvers
```

Only install packages that are not already present. Keep package versions in `package-lock.json` and do not manually edit dependency versions unless required.

After installation:

- Move reusable motion usage from app code into `@codexsun/ui` wrappers.
- Keep TanStack Query and TanStack Router in app packages.
- Prefer moving `framer-motion` out of app package dependencies if it becomes used only through `@codexsun/ui`.
- Verify `@codexsun/platform-web` still builds after consuming the new `@codexsun/ui` exports.

## Reusable Building Blocks

### 1. Workspace Base

Create these reusable pieces:

- `WorkspacePage`
  - title
  - description
  - technicalName
  - actions
  - children
- `WorkspacePanel`
  - header title
  - description
  - action
  - compact mode
- `WorkspaceHeader`
  - back button
  - title
  - subtitle
  - status badge
  - right actions
- `WorkspaceActionBar`
  - icon buttons
  - primary action
  - secondary actions
- `WorkspaceField`
  - label
  - help text
  - error text
  - consistent input layout
- `WorkspaceSection`
  - title
  - fields grid
  - optional summary/action

### 2. Consolidated List And Show Foundation

Build these once in `packages/ui/src/workspace/list.tsx`, `packages/ui/src/workspace/show.tsx`, `packages/ui/src/workspace/table.tsx`, `packages/ui/src/workspace/filters.tsx`, and `packages/ui/src/workspace/pagination.tsx`.

Reusable pieces:

- `WorkspaceList`
  - page header
  - header actions
  - toolbar
  - search
  - filters
  - column visibility
  - table
  - empty/loading/error slots
  - pagination
  - row action menu
- `WorkspaceShow`
  - back/edit/print/action header
  - main detail panels
  - side panels
  - activity/tools slots
- `WorkspaceTable`
  - TanStack Table binding
  - stable column definitions
  - sorting hooks
  - visible column state
  - horizontal scroll
  - empty state
- `WorkspaceFilters`
  - filter button/menu
  - column chooser
  - search field
  - optional date/status filters
- `WorkspacePagination`
  - total count
  - rows per page
  - showing label
  - previous/current/next controls
- `WorkspaceRowActions`
  - view
  - edit
  - suspend/delete
  - restore
  - custom actions

This is the only list/show engine. `CommonList`, `MasterList`, and `EntryList` must reuse this foundation.

### 3. Upsert Foundation

Build upsert surfaces separately in `packages/ui/src/workspace/upsert.tsx`.

Reusable pieces:

- `WorkspaceUpsertPage`
  - page header
  - back action
  - form panel
  - body
  - footer actions
- `WorkspaceUpsertDialog`
  - dialog shell for compact create/edit
  - mobile-safe body scrolling
  - footer actions
- `WorkspaceFormPanel`
  - section title/description
  - bordered panel
  - body spacing
  - footer slot
- `WorkspaceFormGrid`
  - one/two/three column layouts
  - responsive collapse
- `WorkspaceFormFooter`
  - save/cancel/delete actions
  - loading/disabled states
- `WorkspaceLineTable`
  - editable sub-table for entry lines
  - add/remove/reorder rows
  - dnd-kit integration
- `WorkspaceTotalsPanel`
  - subtotal/tax/round-off/total display
- `WorkspacePrintPreview`
  - print-safe document preview slot

### 4. Common List Preset

`CommonList` is a preset over `WorkspaceList` and `WorkspaceShow`. It supports both popup upsert and dedicated upsert pages. The Tenant Domains demo must use the dedicated page variant shown in the screenshots.

Use for:

- tenant status/config style records
- small lookup/config records
- simple records that can be created in a popup without leaving the list/show flow
- simple records that need a dedicated page because the form has multiple grouped fields

Preset exports:

- `CommonList`
- `CommonShow`
- `CommonUpsertDialog`
- `CommonUpsertPage`

### 5. Master List Preset

`MasterList` is a preset over `WorkspaceList`, `WorkspaceShow`, and `WorkspaceUpsertPage` for larger master records.

Preset exports:

- `MasterList`
- `MasterShowPage`
- `MasterUpsertPage`
- `MasterShowLayout`
- `MasterUpsertLayout`
- `MasterFormTabs`
- `MasterFormFooter`

Use for:

- contacts
- customers
- vendors
- ledgers
- items
- companies
- employees

### 6. Entry List Preset

`EntryList` is a preset over `WorkspaceList`, `WorkspaceShow`, `WorkspaceUpsertPage`, `WorkspaceLineTable`, and `WorkspacePrintPreview` for transaction/document records.

Preset exports:

- `EntryList`
- `EntryShowPage`
- `EntryUpsertPage`
- `EntryPrintPreview`
- `EntryLineTable`
- `EntryTotalsPanel`
- `EntryToolPanel`
- `EntryActivityPanel`

Use for:

- invoices
- purchase receipts
- sales orders
- payment vouchers
- stock entries
- compliance documents

## Required Template Pages With Dummy Data

### Template 1: CommonList - Tenant Domains

Name:

- Component: `CommonListTemplatePage`
- Demo route: `/design/common-list`
- Record label: Tenant Domain

Flow:

```text
List -> Show panel/page -> Dedicated upsert page -> Save -> List/Show refresh
```

Dummy data:

```ts
[
  { id: "dom_001", domain: "billing.aaran.test", tenant: "Aaran Textiles", label: "Primary storefront", primary: true, status: "active", updatedAt: "2026-06-29" },
  { id: "dom_002", domain: "retail.bluepeak.test", tenant: "Blue Peak Retail", label: "Retail desk", primary: false, status: "active", updatedAt: "2026-06-28" },
  { id: "dom_003", domain: "prints.kovai.test", tenant: "Kovai Prints", label: "Local billing", primary: false, status: "suspended", updatedAt: "2026-06-27" }
]
```

Wire:

```text
Tenant Domains                                             [Refresh] [New domain]
Master list for public domains and local hosts mapped to platform tenants.

[Search domain, label, tenant, or status........................] [Filters]
+----------------------------------------------------------------------------+
| #   Domain                 Tenant          Label       Primary Status Action |
| 1   billing.aaran.test     Aaran Textiles  Storefront  Yes     Active ...    |
+----------------------------------------------------------------------------+
[Total domains: 3] [Rows per page 100]       [Showing 1 to 3 of 3] [1] [Next]

Show:
+ Domain profile -----------------------+ + Mapping ----------------------+
| domain, label, status, primary        | | tenant, app, industry         |
+---------------------------------------+ +-------------------------------+

Upsert:
[Back] New Tenant Domain
+ Domain mapping ------------------------------------------------------------+
| Tenant [select]                      Domain [example.com]                  |
| Label [Primary storefront]           Status [Active]                       |
| Primary domain [switch row spanning full width]                            |
| Landing mode [Tenant] Landing app [Billing] Industry [Select industry]     |
| Companies [CODEXSUN] [switch]                                             |
|                                                   [Cancel] [Save domain]   |
+----------------------------------------------------------------------------+
```

Acceptance:

- Upsert opens as a dedicated page for this Tenant Domains template.
- `CommonListUpsertDialog` still exists for smaller common records, but this demo uses `CommonListUpsertPage`.
- Table supports search, status filter, columns, pagination, row actions.
- The list screen and upsert screen match the attached screenshots in spacing, panel structure, and action placement.

### Template 2: MasterList - Contact

Name:

- Component: `MasterListTemplatePage`
- Demo route: `/design/master-list`
- Record label: Contact

Flow:

```text
List -> Show page -> Dedicated upsert page -> Save -> Show page
```

Dummy data:

```ts
[
  { id: "con_001", name: "Kumar Fabrics", type: "Customer", phone: "9876543210", city: "Coimbatore", gstin: "33AAACK1234A1Z5", status: "active" },
  { id: "con_002", name: "Sri Devi Suppliers", type: "Supplier", phone: "9840011122", city: "Tiruppur", gstin: "33AAACS2222B1Z8", status: "active" },
  { id: "con_003", name: "Metro Logistics", type: "Transport", phone: "9000012345", city: "Chennai", gstin: "", status: "inactive" }
]
```

Wire:

```text
Contact List
[Search contacts.......................] [Type] [Columns] [Refresh] [New contact]
+----------------------------------------------------------------------------+
| Contact              Type       Phone        City          GSTIN      ...  |
| Kumar Fabrics        Customer   9876543210   Coimbatore    33AA...    ...  |
+----------------------------------------------------------------------------+

Show Page:
[Back] Kumar Fabrics                                      [Edit] [Suspend]
+ Profile ------------------------------+ + Contact methods -------------+
| type, GSTIN, status, notes            | | phones, emails, addresses    |
+---------------------------------------+ +------------------------------+

Upsert Page:
[Back] New/Edit Contact
Tabs: [Profile] [Address] [Tax] [Notes]
Footer: [Save contact] [Cancel]
```

Acceptance:

- Upsert is a full page, not a dialog.
- Form layout is reusable and sectioned.
- Show page uses reusable show cards.
- No contact-specific layout should be hard-coded into list primitives.

### Template 3: EntryList - Invoice

Name:

- Component: `EntryListTemplatePage`
- Demo route: `/design/entry-list`
- Record label: Invoice

Flow:

```text
List -> Show page with print preview -> Dedicated upsert page with sub table -> Save -> Show page
```

Dummy data:

```ts
[
  {
    id: "inv_001",
    number: "INV-2026-001",
    date: "2026-06-29",
    party: "Kumar Fabrics",
    status: "posted",
    total: 18500,
    lines: [
      { item: "Cotton Fabric", qty: 25, rate: 500, amount: 12500 },
      { item: "Packing Charge", qty: 1, rate: 6000, amount: 6000 }
    ]
  },
  {
    id: "inv_002",
    number: "INV-2026-002",
    date: "2026-06-28",
    party: "Blue Peak Retail",
    status: "draft",
    total: 9200,
    lines: [
      { item: "Printed Roll", qty: 8, rate: 1150, amount: 9200 }
    ]
  }
]
```

Wire:

```text
Invoice List
[Search invoices.......................] [Status] [Columns] [Refresh] [New invoice]
+----------------------------------------------------------------------------+
| Invoice        Date        Party              Status       Total      ...  |
| INV-2026-001   29 Jun      Kumar Fabrics      Posted       18,500     ...  |
+----------------------------------------------------------------------------+

Show Page:
[Back] INV-2026-001 - Kumar Fabrics                [Print] [Edit] [Send]
+ Details ------------------------------+ + Tools -----------------------+
| date, party, status, totals           | | email, whatsapp, attach, tag |
+---------------------------------------+ +------------------------------+
+ Print Preview ------------------------------------------------------------+
| A4 invoice preview with company, party, line items, totals, terms         |
+--------------------------------------------------------------------------+

Upsert Page:
[Back] New/Edit Invoice
Header fields: party, date, invoice no, status
Line table: item, qty, rate, amount, actions
Totals panel: subtotal, tax, round off, total
Footer: [Save draft] [Save and print] [Cancel]
```

Acceptance:

- Entry show page includes print preview.
- Upsert page includes a reusable sub-table/line-table pattern.
- Totals are calculated from dummy line rows.
- Print preview has print-safe layout hooks but does not need PDF export yet.

## Component API Direction

Build data-driven APIs. The page decides data; the reusable block decides layout.

Example shape:

```ts
type ListColumn<T> = {
  id: string;
  label: string;
  visible?: boolean;
  width?: string;
  render(row: T): ReactNode;
};

type ListAction<T> = {
  id: string;
  label: string;
  icon?: ReactNode;
  tone?: "default" | "destructive";
  onSelect(row: T): void;
};
```

Do not make the reusable components know about tenant, contact, or invoice fields.

Required core types:

```ts
type WorkspaceListViewState<T> =
  | { mode: "list" }
  | { mode: "show"; record: T }
  | { mode: "upsert"; record: T | null };

type WorkspaceListPreset = "common" | "master" | "entry";

type WorkspaceUpsertSurface = "dialog" | "page";

type WorkspaceStatusTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info";
```

State handling rule:

- Template pages may hold local dummy state.
- Reusable `@codexsun/ui` components must remain controlled and data-driven.
- Do not put API calls, TanStack Query hooks, or business mutations inside reusable list/show/upsert components.
- Reusable components may expose callbacks like `onSearchChange`, `onFilterChange`, `onPageChange`, `onView`, `onEdit`, `onDelete`, `onRestore`, and `onSubmit`.

Consolidation acceptance:

- `CommonList`, `MasterList`, and `EntryList` do not contain separate implementations of toolbar, table, pagination, row actions, or show header.
- Changing table spacing or toolbar layout in `WorkspaceList` affects all three presets.
- Upsert differences are handled by separate upsert components and slots, not by forking the list engine.

## Routes To Add

Add demo-only routes in Platform Web:

- `/design/common-list`
- `/design/master-list`
- `/design/entry-list`

Add links from the existing design system page or a design-system tab so they are easy to inspect.

These routes are for UI pattern verification only. They should not become product navigation.

## Visual QA

Run a local dev server and inspect:

- desktop width
- tablet width
- mobile width
- print preview screen

Check:

- no text overlap
- toolbar wraps cleanly
- table stays scrollable
- row action menu works
- dialog does not overflow mobile height
- dedicated upsert page has stable footer actions
- print preview does not break normal workspace layout

## Verification Commands

Use `npm.cmd` on Windows:

```bash
npm.cmd run typecheck -w @codexsun/ui
npm.cmd run lint -w @codexsun/ui
npm.cmd run typecheck -w @codexsun/platform-web
npm.cmd run lint -w @codexsun/platform-web
```

If app routes or package exports affect the full workspace, also run:

```bash
npm.cmd run typecheck
npm.cmd run lint
```

## Out Of Scope

- Real API integration.
- Real tenant/contact/invoice persistence.
- Billing/accounting calculations beyond dummy row totals.
- PDF generation.
- Backend module work.
- Changing the existing desk/side-menu visual direction.

## Documentation

Update after implementation:

- `assist/blueprint/platform-foundation.md` if frontend route conventions change.
- `assist/governance/engineering-standards.md` with workspace UI reuse rules.
- `assist/documentation/CHANGELOG.md`.

## Handoff Notes

- This task should make frontend development faster, not heavier.
- Keep the desk shell and side menu as the outer workspace frame.
- Put reusable UI structure in `@codexsun/ui`.
- Put dummy demo pages in Platform Web.
- Keep business modules free to pass their own data, columns, actions, forms, and print content.
- `CommonList`, `MasterList`, and `EntryList` are patterns. They must not hard-code tenant/contact/invoice behavior.
