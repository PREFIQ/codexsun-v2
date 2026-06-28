# Industry Model

## Goal

Industry packs let CODEXSUN adapt to different businesses without creating separate products or duplicated codebases.

Each industry pack extends the platform through configuration, modules, workflows, templates, and reports.

## Industry Pack Contents

An industry pack should define:

- Industry name.
- Target business type.
- Required modules.
- Optional modules.
- Masters.
- Transactions.
- Workflows.
- Billing rules.
- Accounting rules.
- Inventory rules.
- Reports.
- Print formats.
- Compliance requirements.
- Offline requirements.
- Integration requirements.
- Default roles and permissions.
- Dashboard widgets.

## Initial Industry Packs

### Software

Focus areas:

- Clients.
- Projects.
- Services.
- Recurring invoices.
- Task tracking.
- Time tracking if required.
- Support tickets if required.
- Subscription billing if required.

### Garments Manufacturing

Focus areas:

- Fabric.
- Cutting.
- Stitching.
- Finishing.
- Job work.
- Sizes and colors.
- Production tracking.
- Inventory.
- Purchase.
- Sales.
- Worker or contractor accounts.

### Garments Billing

Focus areas:

- Item variants.
- Size matrix.
- Barcode.
- POS billing.
- Discounts.
- Exchanges.
- Stock tracking.
- Customer history.

### uPVC

Focus areas:

- Measurements.
- Quotations.
- Profiles.
- Hardware.
- Glass.
- Manufacturing stages.
- Installation.
- Site tracking.
- Customer approvals.

### Offset Printing

Focus areas:

- Job cards.
- Paper stock.
- Plate and color details.
- Printing stages.
- Finishing.
- Wastage.
- Estimation.
- Delivery.
- Customer artwork or files.

### POS Billing

Focus areas:

- Fast billing.
- Barcode.
- Cash drawer.
- Multiple payment modes.
- Offline billing.
- Day close.
- GST invoice.
- Thermal printing.
- Returns.

## Industry Boundary Rules

- Industry rules must not pollute platform foundation.
- Shared behavior should be extracted only when two or more industries need the same concept.
- Industry modules may extend billing, accounting, inventory, and reporting through documented extension points.
- Industry-specific screens should still use the central design system.
- Industry-specific permissions must be registered with the permission system.

## Industry Activation

When an industry is activated for a tenant:

- Required modules are enabled.
- Default settings are created.
- Default roles are suggested.
- Print formats are installed.
- Numbering formats are initialized.
- Dashboard layout is selected.
- Relevant reports are enabled.
- Offline sync rules are applied.

