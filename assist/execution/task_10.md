# Task 10 - Document File And Print Template Foundation

## Purpose

This task comes after `assist/execution/task_9.md`.

Task 10 prepares shared document, file, attachment, and print-preview foundations before invoice or business document logic begins.

## Batch State

| Field | Value |
| --- | --- |
| Task reference | `task_10` |
| Status | `planned` |
| Depends on | Task 9 complete and verified |
| Focus | File handling, attachment UI, document preview, print preview, and template registry |
| Last updated | `2026-06-29` |

## Goal

Create reusable foundation for:

- file upload/download UI
- attachment panels
- document preview shell
- print preview shell
- print template registry
- export action pattern
- document audit trail

## Required Work

### 1. File Contract

Define file metadata:

- `fileId`
- `tenantId`
- `ownerModule`
- `ownerRecordId`
- `fileName`
- `mimeType`
- `size`
- `storageKey`
- `visibility`
- `createdBy`
- `createdAt`

Do not store large file blobs in normal business records.

### 2. Storage Adapter Wiring

Use existing framework storage contracts where possible.

Add platform-level file service shell:

- create metadata
- request upload placeholder
- request download placeholder
- delete/archive metadata
- audit actions

Local filesystem or mock adapter is acceptable for first foundation.

### 3. Attachment UI

Build reusable UI:

- attachment list
- upload dropzone
- file type icon
- progress placeholder
- remove/archive
- preview action

Bind drag/drop through `@codexsun/ui` wrappers from Task 5.

### 4. Document Preview

Build reusable preview shell:

- PDF/image/document placeholder
- metadata panel
- actions: download, print, attach, remove
- empty/error states

### 5. Print Preview System

Build reusable print preview components:

- `WorkspacePrintPreview`
- A4 sheet
- header/footer slots
- line table slot
- totals slot
- terms slot
- print CSS helpers

No invoice-specific logic yet.

### 6. Template Registry

Define template metadata:

- `templateKey`
- `moduleKey`
- `documentType`
- `label`
- `version`
- `status`
- `defaultForTenant`

Create UI shell to list templates and preview dummy template.

## Tests

Add coverage for:

- file metadata tenant isolation
- storage adapter contract
- attachment actions audit
- template registry validation
- print preview renders without crashing

## Out Of Scope

- Real invoice templates.
- PDF generation.
- E-sign.
- OCR.
- External document storage provider setup.
- Business document numbering.

## Verification

```bash
npm.cmd run typecheck
npm.cmd run lint
```

Run package-specific tests if added.

## Documentation

Update:

- `assist/architecture/data-strategy.md`
- `assist/operations/data-lifecycle.md`
- `assist/blueprint/platform-foundation.md`
- `assist/documentation/CHANGELOG.md`

