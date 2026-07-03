# Changelog

## Version State

Current version: 1.0.69

Release tag: v-1.0.69

Changelog label: v 1.0.69

Historical changelog entries are immutable. A version bump may update this Version State block and add a new entry, but it must not rewrite old entry labels.

New changelog entries must keep database-facing work and application code work separate:

#### Database Changes

Records schema, migration, seed, tenant provisioning, and data compatibility changes.

#### App Codebase Changes

Records UI, API, service logic, tooling, and documentation changes.

## v-1.0.69

### [v 1.0.69] 2026-07-02 11:44 pm - Address Lookup Inline Create Fix

#### Database Changes

- Database update: Yes (auto-check).
- Widened Company address `pincode` storage to `VARCHAR(80)` so lookup IDs can be saved safely.
- Added bootstrap repair for existing Company address pincode columns.
- Added idempotent bootstrap seeding for the `common-default-dash` record across all tenant common lookup modules.
- Seeded required dash payload fields for Country, State, District, City, HSN, Tax, Priority, and Accounting Year so mandatory foreign references can safely map to `-`.
- Added `tenant_products` persistence with image, opening stock, opening price, status, and lookup reference fields.
- Added bootstrap repair for existing Product lookup/image/opening columns.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.69`.
- Fixed Contact and Company Country inline create by sending the required generated country code.
- Hardened shared lookup controls so inline create waits for the record to be created and selected before the next dependent field is used.
- Ordered common lookup repositories so the system dash record is always returned first without relying on database timestamp behavior.
- Hardened tenant UI e2e login to wait for API readiness before submitting credentials.
- Added tenant UI e2e coverage that verifies the dash seed is first for all common lookup modules.
- Replaced Product runtime storage with `DatabaseProductRepository` so Product records persist after app restart.
- Removed the old `InMemoryProductRepository` Product implementation/export so Product can no longer be accidentally wired to memory storage.
- Reworked the Product form with Details, Image, and Opening tabs: Details keeps required inline-create lookups for Product Type, HSN Code, Unit, and GST; Image owns upload/preview; Opening owns opening stock and opening price.
- Simplified common autocomplete display labels to one name/description line, removing code-prefix labels and secondary code sublines.
- Removed Product lookup children from the visible Master side menu while keeping direct Product child routes available for registry access.
- Removed always-visible required-field info banners from tenant forms; required-field banners now appear only after a failed save validation.
- Standardized tenant master/common validation UX so Contacts, Companies, Products, Work Orders, and Common Item forms show the same failed-save required banner, red invalid control borders, and helper text.
- Moved generic Work Order/Common Item status switching into the Details form section instead of a separate Status card.
- Added mandatory design-system/governance rules for failed-save validation banners, invalid control borders, helper text, and Details-section status placement.
- Extended Product e2e coverage to create inline lookup values, upload a Product SVG image, and save opening stock/price.
- Extended tenant UI e2e to create Country, State, District, City, and Pincode from the frontend in both Contact and Company address forms.
- Stabilized default-company selection in e2e when many historical test companies exist.
- Verified core, API, UI, web type checks and tenant module e2e after the address lookup fix.

## v-1.0.68

### [v 1.0.68] 2026-07-02 11:05 pm - Company Logo Uploads

#### Database Changes

- Database update: Yes (auto-check).
- Changed Company `logo_url` storage to `LONGTEXT` for persisted image uploads.
- Added Company `logo_dark_url` and `favicon_url` columns with bootstrap repair for existing tenant databases.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.68`.
- Added backend contract, API route, service, and repository wiring for Company logo, dark logo, and favicon values.
- Replaced the Company Logo URL field with three SVG/PNG image upload controls for Logo, Logo dark, and Favicon.
- Added image previews and remove actions for each Company logo slot.
- Verified core, API, web type checks and tenant module e2e after the Company logo upload wiring.

## v-1.0.67

### [v 1.0.67] 2026-07-02 10:56 pm - Company Address Lookup Sequence

#### Database Changes

- Database update: No schema change.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.67`.
- Extended the shared common-record autocomplete so inline create can pass parent reference data and filter dependent records.
- Reworked Company address lookups so State depends on Country, District depends on State, City depends on District, and Pincode stays independent.
- Kept inline create available for Company address lookups and now writes the correct parent reference when creating State, District, or City.
- Updated the Company list to show Company Group and GSTIN in the main table.
- Verified web type checks after the Company lookup sequence update.

## v-1.0.66

### [v 1.0.66] 2026-07-02 10:49 pm - Contact Lookup and Bank Account Type

#### Database Changes

- Database update: Yes (auto-check).
- Added `account_type_id` to tenant contact bank accounts and wired bootstrap repair so existing tenant databases keep the new bank account type field without data reset.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.66`.
- Reworked Contact address lookups so State depends on Country, District depends on State, City depends on District, and Pincode stays independent.
- Kept inline create available for Contact address lookups and now writes the correct parent reference when creating State, District, or City.
- Changed the Contact list to open Show from the contact code, removed Ledger from the list, and added Contact Type plus GSTIN.
- Added Account Type lookup to Contact bank accounts and persisted it through backend save/load.
- Verified core, API, web, and tenant module e2e checks after the Contact lookup and bank account update.

## v-1.0.65

### [v 1.0.65] 2026-07-02 10:23 pm - Company Master Database Form

#### Database Changes

- Database update: Yes (auto-check).
- Added tenant-scoped Company master persistence tables for companies, phones, emails, addresses, bank accounts, and tax identities.
- Added `company_group_id` to Company storage so Company Groups work as a lookup inside the Company master form.
- Added `company-groups` to the common-record lookup registry.
- Wired Company bootstrap schema repair to create missing tables and columns without deleting or reseeding existing Company data.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.65`.
- Replaced the in-memory Company repository with a database-backed Company repository.
- Kept the frontend as one Company master with list, show, and upsert flows while storing child data across backend child tables.
- Added Company Group lookup/create support inside the Company Details tab.
- Removed separate Company child menu navigation so logos, emails, phones, social links, and bank accounts stay under the Company form.
- Preserved bank account type values through Company save and reload.
- Verified core, API, web, and tenant module e2e checks after the Company master wiring.

## v-1.0.64

### [v 1.0.64] 2026-07-02 10:05 pm - Contact Master Database Form

#### Database Changes

- Database update: Yes (auto-check).
- Added tenant-scoped Contact master persistence tables for contacts, contact code sequences, addresses, emails, phones, bank accounts, social links, and GST details.
- Added `contact_group_id` to Contact storage so Contact Groups work as a lookup inside the Contact master form.
- Wired Contact bootstrap schema repair to create missing tables without deleting or reseeding existing Contact data.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.64`.
- Replaced the in-memory Contact repository with a database-backed Contact repository.
- Added Contact next-code support for `C-0001` style tenant-local numbering.
- Kept the frontend as one Contact master with list, show, and upsert flows while storing child data across backend child tables.
- Added Contact Group lookup/create support inside the Contact Details tab.
- Removed separate Contact child menu navigation so emails, phones, addresses, finance, social links, and GST details stay under the Contact form.
- Removed Contact Groups from the common module index card so it acts as a Contact-form lookup instead of a separate user workflow.
- Verified core, API, web, and tenant module e2e checks after the Contact master wiring.

## v-1.0.63

### [v 1.0.63] 2026-07-02 9:34 pm - Persistent Tenant Data Storage

#### Database Changes

- Database update: Yes (auto-check).
- Added the `tenant_common_records` persistence table through the platform bootstrap repair path for tenant-scoped common module data.
- Changed demo/bootstrap tenant, user, tenant database, domain mapping, and module activation seed writes to preserve existing rows on restart instead of refreshing them back to defaults.
- Hardened the platform registry drill-down seed migration so reruns insert missing defaults without overwriting edited platform, group, or module registry records.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.63`.
- Added a database-backed common module repository and wired tenant common module services to the master database pool.
- Kept common module archive, restore, and force-delete behavior working through the persistent store.
- Changed Project Manager and design-system JSON stores to create seed data only when the backing file is missing, so deleted or edited records are not silently re-added on restart.
- Made corrupt JSON files fail loudly instead of being replaced with seed data, preventing accidental data loss.
- Verified core, API, web, JSON, and tenant module e2e checks after the persistence hardening.

## v-1.0.62

### [v 1.0.62] 2026-07-02 9:20 pm - Project Manager Short Reference Numbers

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.62`.
- Added visible issue `Reference no` editing in Work & Automation issue upsert pages.
- Auto-suggested the next short work reference number for new issues, starting from `001` and continuing as `002`, `003`, and so on.
- Allowed issue save and Ask AI automation to derive a working title from the reference number when the user has not entered a title.
- Updated reference lookups to show short reference numbers with issue titles while preserving parent-child drill-down keys.
- Updated automation inbox logging and timeline records to use the short reference number as the primary reference.
- Extended Project Manager e2e coverage to verify the next reference number appears on new issues and Ask AI queues `001`.

## v-1.0.61

### [v 1.0.61] 2026-07-02 9:04 pm - Automation 001 Tenant Foundation Completion

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.61`.
- Completed Project Manager automation reference `001` for TENANTS Foundation registry coverage.
- Normalized the pending automation task, review, automation, activity, timeline, Gantt, and discussion records to short reference `001`.
- Cleaned `automation.md` back to no pending automation and appended the completion note to `automation-log.md`.
- Fixed Work & Automation issue drill-down so a root issue also recognizes its short reference number when loading related stages.
- Fixed Ask AI queueing so issue automation inbox blocks use the short reference number when one exists.
- Updated Project Manager e2e coverage to follow the live `001` reference chain and verify the cleaned automation flow.

## v-1.0.60

### [v 1.0.60] 2026-07-02 7:54 pm - Tenant Registry Module Wiring

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.60`.
- Added generic backend common-record services for tenant registry modules without dedicated service implementations.
- Wired TENANTS Foundation, Master, Common, Business, and Platform App module groups into the tenant side menu with standard plural kebab-case routes.
- Added frontend generic CRUD coverage for child/contact/company, product, work-order, stock, site, settings, mail, task, media, sales, purchase, receipt, and payment registry modules.
- Repointed Work Orders to the generic `work-orders` common-record module so the menu route has working API persistence.
- Extended tenant UI e2e coverage to verify registry route access and tenant-scoped generic CRUD behavior.

## v-1.0.59

### [v 1.0.59] 2026-07-02 7:57 am - Platform Registry Magic Button Alignment

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.59`.
- Nudged Platform Registry popup magic-fill icon buttons inward from the far right edge for cleaner header spacing.

## v-1.0.58

### [v 1.0.58] 2026-07-02 7:49 am - Platform Registry Form Consolidation

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.58`.
- Consolidated Platform Registry popup forms by hiding low-value sort/order controls from normal group, module, and feature entry.
- Reduced detail popup inputs by registry type so APIs, screens, database fields, planning items, model notes, and actions each show only their working fields.
- Limited feature lookup to action, API, and screen details where it creates a real relationship.
- Simplified non-API/database detail state controls to active-only while keeping API and database-specific switches available.

## v-1.0.57

### [v 1.0.57] 2026-07-02 7:38 am - Platform Registry Popup Form Layout

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.57`.
- Reworked Platform Registry popup forms into a consistent left/right alignment pattern.
- Added shared popup layout helpers for main form content and contextual side sections.
- Converted platform, module group, module registry, feature registry, and detail registry popups to keep identity/state/context controls on the right and descriptive working content on the left.
- Kept table/list behavior stable while improving popup form scanability across Platform Registry.

## v-1.0.56

### [v 1.0.56] 2026-07-02 7:34 am - Platform Registry Model Notes Tab

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.56`.
- Moved Model Notes out of the Platform Registry Planning tab into a separate module workspace tab.
- Kept Planning focused on implementation plans, acceptance criteria, blockers, validation, and issue raising.
- Extended the hardened e2e to verify Planning no longer renders Model Notes and the new Model Notes tab opens independently.

## v-1.0.55

### [v 1.0.55] 2026-07-02 7:29 am - Platform Registry Issue And Planning Wiring

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.55`.
- Added `Raise issue` actions from Platform Registry module, feature, action, API, screen, database, and planning references into Work & Automation issues.
- Wired raised issues with registry `referenceId`, `referenceType`, platform, group, module, labels, and rich notes so Work & Automation can trace them back to registry coverage.
- Reworked Planning into a richer implementation-planning surface with plan type, owner, risk, acceptance criteria, blockers, validation plan, test path, and planning health metrics.
- Extended Project Manager detail persistence to store planning fields explicitly in JSON.
- Extended the hardened e2e to verify Platform Registry issue raising and the richer Planning form, with cleanup of raised issue Timeline/Gantt side effects.

## v-1.0.54

### [v 1.0.54] 2026-07-02 6:04 am - Project Manager Standalone Discussions

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.54`.
- Removed the Reviews tab from Project Manager Discussions so Discussions is a standalone decision-note area.
- Moved Discussion forms to use issue `Reference no` as the primary link back into Work & Automation.
- Linked the seed Project Manager discussion to `issue-1` with `referenceType: issue`.
- Extended the hardened Project Manager e2e to verify Discussions has no Reviews tab and displays the linked issue reference.

## v-1.0.53

### [v 1.0.53] 2026-07-02 5:58 am - Project Manager Menu Simplification

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.53`.
- Removed the redundant Project Manager `Agent & Security` side-menu entry and route.
- Removed the standalone Agent/Security Project Manager page export.
- Simplified Project Manager Dashboard wording and panels so the workspace focuses on Work & Automation, Discussions, Release Notes, Insights, and Registry coverage.
- Removed agent-note and security-quality kinds from the visible Insights tracked-kind list while leaving dormant JSON compatibility intact.

## v-1.0.52

### [v 1.0.52] 2026-07-02 5:47 am - Project Manager Workflow Stability E2E

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.52`.
- Hardened the Work & Automation Playwright e2e with a random temporary Issue -> Task -> Review -> Automation -> Activity chain.
- Added JSON persistence assertions for each workflow stage so reference IDs are verified directly against the Project Manager JSON store.
- Added UI drill-down checks for the random chain, including Timeline and Gantt visibility.
- Added e2e cleanup for temporary workflow records and `Ask AI` queue artifacts so successful test runs leave the live JSON store clean.

## v-1.0.51

### [v 1.0.51] 2026-07-02 5:43 am - Project Manager Ask AI Action

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.51`.
- Renamed the Work & Automation row action from `Ask Codex` to `Ask AI`.
- Renamed the success feedback from `Queued for Codex` to `Queued for AI`.
- Added `Ask AI` Bot-icon buttons to Project Manager upsert surfaces so records can be queued from edit/create forms as well as list rows.
- Updated the Work & Automation Playwright e2e to verify the new `Ask AI` label.

## v-1.0.50

### [v 1.0.50] 2026-07-02 5:29 am - Project Manager Automation Inbox

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.50`.
- Added a Project Manager Automation Inbox communication point with `automation.md` and `automation-log.md`.
- Added a Work & Automation row action, `Send to automation.md`, which writes the selected stage reference number into the markdown inbox.
- The automation inbox endpoint also writes a Timeline entry and refreshes the related Gantt context for the selected reference.
- Extended the Work & Automation Playwright e2e to verify the inbox action writes `issue-1` into `automation.md`.

## v-1.0.49

### [v 1.0.49] 2026-07-02 5:23 am - Work Automation E2E Verification

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.49`.
- Added a Playwright e2e for the full Work & Automation workflow: Issue -> Task matrix -> Task-specific Reviews -> Automation -> Activity -> Timeline -> Gantt -> Issue root.
- Fixed the Project Manager maturity action JSON file collision by moving maturity action records to `maturity-action-registry.json`, leaving platform registry actions in `action-registry.json`.
- Verified the workflow e2e passes with no failed browser responses after the file split.

## v-1.0.48

### [v 1.0.48] 2026-07-02 5:10 am - Work Automation Clean Test Workflow

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.48`.
- Replaced older mixed Work & Automation test data with one simple readable workflow chain: `Issue 1 -> Task 1.1/1.2 -> Review 1.1.1/1.1.2/1.2.1 -> Automation -> Activity`.
- Reset the live Project Manager JSON workflow files to the clean test chain and regenerated Timeline/Gantt snapshots.
- Changed JSON seed merging to use stable record keys instead of IDs, preventing duplicate seed records after refresh or ID changes.

## v-1.0.47

### [v 1.0.47] 2026-07-02 5:04 am - Work Automation Gantt Visual Only

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.47`.
- Removed the duplicate default registry table from the Work & Automation Gantt tab.
- Kept Gantt focused on the visual schedule matrix only.

## v-1.0.46

### [v 1.0.46] 2026-07-02 5:02 am - Work Automation Persistent Test Chain

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.46`.
- Stabilized the Project Manager JSON directory lookup so refresh/restart uses the same `apps/platform/api/project-manager-json` data folder when launched from the repo root.
- Added a refresh-safe dummy workflow chain for testing: `issue-1 -> task1.1/task1.2 -> review1.1.1/review1.1.2/review1.2.1 -> automation -> activity`.
- Loaded the JSON store once so the live JSON files now contain the dummy chain plus Timeline/Gantt snapshots.

## v-1.0.45

### [v 1.0.45] 2026-07-02 4:54 am - Work Automation Live Workflow Linking

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.45`.
- Added backend workflow side effects for Issue, Task, Review, Automation, and Activity records.
- Automatically writes Timeline events when workflow records are created or updated.
- Automatically creates or updates matching Gantt schedule rows for workflow records, preserving parent reference keys.
- Added idempotent JSON reconciliation so existing workflow records receive Timeline snapshots and Gantt rows when the Project Manager store loads.
- Updated frontend workflow saves to refresh Timeline and Gantt views immediately after stage changes.

## v-1.0.44

### [v 1.0.44] 2026-07-02 4:49 am - Work Automation Gantt Timeline Visual

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.44`.
- Rebuilt the Work & Automation Gantt view as a schedule matrix with name, start, end, days, work percent, and a day-by-day timeline grid.
- Added SVG timeline bars with completion overlay and current-day marker styling.
- Updated Gantt forms and columns to use `startDate` and `endDate` datepicker fields.

## v-1.0.43

### [v 1.0.43] 2026-07-02 4:47 am - Work Automation Timeline Activity Dates

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.43`.
- Changed Work & Automation Timeline into an issue-bound activity timeline view with Activity, From date, To date, and completed status.
- Added completion toggles for timeline rows, keeping completed rows visually marked and status-backed.
- Added JSON-backed `startDate` and `endDate` persistence for Project Manager maturity records.

## v-1.0.42

### [v 1.0.42] 2026-07-02 4:43 am - Work Automation Simple Todos

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.42`.
- Reintroduced Todos in Work & Automation as a simple issue-bound checklist instead of a full table module.
- Added inline todo creation, checkbox strike-through completion, and up/down position controls.
- Kept todo records connected to the active Issue context while avoiding the heavier search/filter/table surface.

## v-1.0.41

### [v 1.0.41] 2026-07-02 4:38 am - Remove Work Automation Todos Tab

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.41`.
- Removed the simple Todos view from Work & Automation navigation and drilled stage tabs.
- Kept Timeline and Gantt as the remaining issue-level support views.

## v-1.0.40

### [v 1.0.40] 2026-07-02 4:37 am - Work Automation Issue Support Navigation

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.40`.
- Updated Work & Automation support tabs so Todos, Timeline, and Gantt can be opened from any drilled stage after selecting an Issue.
- Bound new and listed support records to the original Issue context instead of narrowing them to the currently selected Task, Review, Automation, or Activity.

## v-1.0.39

### [v 1.0.39] 2026-07-02 4:36 am - Work Automation Support View Boundary

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.39`.
- Limited Work & Automation drill-down chaining to Issues, Tasks, Reviews, Automation, and Activity.
- Kept Todos, Timeline, and Gantt as support/matrix views only, so opening those records does not continue into another drill level.
- Limited Issue matrix reference expansion to the active work chain records instead of treating support views as parent chain records.

## v-1.0.38

### [v 1.0.38] 2026-07-02 4:35 am - Work Automation Matrix Drill Binding

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.38`.
- Added Issue-level matrix binding for Work & Automation so stage tabs under an Issue can show all related Tasks, Reviews, Automation, Activity, Todos, Timeline, and Gantt records for that Issue chain.
- Kept selected-item drill-down narrow: clicking a Task now shows only Reviews directly related to that Task, and the same direct-parent behavior continues for deeper stages.

## v-1.0.37

### [v 1.0.37] 2026-07-02 4:29 am - Work Automation Issue Root Reset

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.37`.
- Updated Work & Automation stage navigation so clicking `Issues` from a drilled stage returns to the root Issue list.
- Cleared the active drill path when returning to Issues, which hides the stage tabs again on the Issue root screen.

## v-1.0.36

### [v 1.0.36] 2026-07-02 4:21 am - Issue Chain Stage Navigation

#### Database Changes

- Database update: No live database/schema migration was run for this release.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.36`.
- Added stage navigation buttons inside the selected Issue drill-down context: Issues, Tasks, Reviews, Automation, Activity, Todos, Timeline, and Gantt.
- Kept the root Work & Automation list clean with Issues only.
- Scoped stage switching to the active issue chain so users can jump deeper inside the same issue context.

## v-1.0.35

### [v 1.0.35] 2026-07-02 4:16 am - Remove Work Automation GitHub Runner

#### Database Changes

- Database update: No live database/schema migration was run for this release.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.35`.
- Removed the GitHub runner/play button from the Work & Automation action bar while leaving the rest of the drill-down actions intact.

## v-1.0.34

### [v 1.0.34] 2026-07-02 4:15 am - Clean Work Automation Drill Header

#### Database Changes

- Database update: No live database/schema migration was run for this release.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.34`.
- Removed the large Work & Automation drill-down title/subtitle/breadcrumb area.
- Replaced the drill-down header with a simple current-stage heading such as Reviews.
- Updated the shared workspace page shell so empty titles are not rendered.

## v-1.0.33

### [v 1.0.33] 2026-07-02 4:12 am - Fix Work Automation Stage Advance

#### Database Changes

- Database update: No live database/schema migration was run for this release.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.33`.
- Fixed Work & Automation stage advancement so clicking an Issue now opens the linked Tasks drill-down instead of only appending the issue title to the breadcrumb.
- Corrected the next-stage mapping for the full chain: Issue -> Task -> Review -> Automation -> Activity -> Timeline -> Gantt.

## v-1.0.32

### [v 1.0.32] 2026-07-02 4:09 am - Work Automation Row Drill Fix

#### Database Changes

- Database update: No live database/schema migration was run for this release.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.32`.
- Fixed Work & Automation drill-down interaction so clicking an issue/task/review row opens the next child-stage list.
- Updated the row action View behavior to drill into the child stage while Edit still opens the current record.
- Added hover/click affordance for rows that have a next stage.

## v-1.0.31

### [v 1.0.31] 2026-07-02 4:03 am - Work Automation Drilldown Flow

#### Database Changes

- Database update: No live database/schema migration was run for this release.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.31`.
- Restructured Work & Automation into a drill-down flow instead of parallel tabs.
- The root Work & Automation list now starts with Issues only.
- Clicking an Issue drills into Tasks linked to that issue; clicking a Task drills into Reviews; clicking a Review drills into Automations; then Activity, Timeline, and Gantt continue the same parent-reference flow.
- Added drill breadcrumbs and Back navigation for the Work & Automation chain.
- New records inside a drill level inherit the selected parent reference and module context.
- Kept the tabbed behavior untouched for Discussions and Agent & Security.

## v-1.0.30

### [v 1.0.30] 2026-07-02 3:54 am - Work Automation Stage Builder

#### Database Changes

- Database update: No live database/schema migration was run for this release.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.30`.
- Changed the Work & Automation next-stage action from simple navigation into a stage builder.
- The next-stage button now saves the current stage, looks for an existing child record in the next stage by parent reference, and opens it when found.
- If no child exists, the next-stage button opens a new linked child draft with inherited module, reference, owner, priority, assignee/reviewer, labels, and due date context.
- Preserved the one-to-many chain shape: Issue -> Tasks -> Reviews -> Automation -> Activity -> Timeline -> Gantt.

## v-1.0.29

### [v 1.0.29] 2026-07-02 3:49 am - Work Automation Next Stage Button

#### Database Changes

- Database update: No live database/schema migration was run for this release.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.29`.
- Added a next-stage button beside Cancel on the Work & Automation dedicated upsert page.
- Wired the button to the work chain: Issue -> Task -> Review -> Automation -> Activity -> Timeline -> Gantt.
- Kept the action as simple navigation to the next stage list without adding extra workflow state.

## v-1.0.28

### [v 1.0.28] 2026-07-02 3:47 am - Remove Work Automation Stage Chips

#### Database Changes

- Database update: No live database/schema migration was run for this release.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.28`.
- Removed the extra Work & Automation stage chip row from the table surface while keeping the top tabs and reference-chain behavior intact.

## v-1.0.27

### [v 1.0.27] 2026-07-02 3:45 am - Work Automation Reference Chain

#### Database Changes

- Database update: No live database/schema migration was run for this release.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.27`.
- Renamed the Work & Automation page title from Project Manager to Work & Automation.
- Changed the work table identity column from Key to Reference no.
- Made Issues the root reference: issue records use their generated key as the reference number.
- Made downstream stages default to an issue-style reference number through `referenceId`, so Tasks, Reviews, Automation, Activity, Timeline, and Gantt can link back to the originating issue.
- Added issue reference lookup options for related stage forms.
- Added a compact stage strip showing the chain: Issue, Task, Review, Automation, Activity, Timeline, Gantt, with Todo kept as a side checklist.

## v-1.0.26

### [v 1.0.26] 2026-07-02 3:38 am - Project Manager Chain Form Simplification

#### Database Changes

- Database update: No live database/schema migration was run for this release.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.26`.
- Simplified Work & Automation chain forms by removing the visible Key input and generating keys automatically from the record type and title.
- Renamed the main rich text area to Summary and removed the extra Description entry from popup forms.
- Reduced right-side fields by chain role: Issues keep the full planning controls, while Tasks, Reviews, Automation, Activity, Todos, Timeline, and Gantt expose only their related fields.
- Removed decorative/sidebar gear icons from Work & Automation upsert field groups.

## v-1.0.25

### [v 1.0.25] 2026-07-02 3:31 am - Remove Work Automation Short Summary

#### Database Changes

- Database update: No live database/schema migration was run for this release.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.25`.
- Removed the Short summary field from the Work & Automation dedicated upsert page for all work kinds.
- Confirmed no remaining Short summary helper text exists in app pages.

## v-1.0.24

### [v 1.0.24] 2026-07-02 3:30 am - Project Manager Upsert Surface Cleanup

#### Database Changes

- Database update: No live database/schema migration was run for this release.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.24`.
- Cleaned the Work & Automation dedicated upsert page by removing unnecessary helper text, guidance copy, editor footnotes, and verbose placeholders.
- Updated the shared workspace page shell so empty descriptions are not rendered, keeping upsert headers visually clean.
- Removed now-unused Work & Automation guidance helper code after the UI cleanup.

## v-1.0.23

### [v 1.0.23] 2026-07-02 3:21 am - Project Manager Work Automation Sequence

#### Database Changes

- Database update: No live database/schema migration was run for this release.
- Added a JSON-backed Gantt registry file for Work & Automation schedule items.
- Extended the Project Manager maturity JSON store with a `gantt` kind and `gant`/`gantt` API alias.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.23`.
- Reworked only the Work & Automation section into the focused sequence: Issues, Tasks, Reviews, Automation, Activity, Todos, Timeline, and Gantt.
- Removed noisy Work & Automation tabs for action log, pull requests, coverage, Git refs, and Kanban from the default Work & Automation flow.
- Kept Todos as an independent simple checklist with a direct done/open checkbox in the list.
- Added a lightweight Gantt schedule strip for date-based planning without adding a heavy scheduling system.
- Kept Discussions, Agent & Security, Release Notes, and Insights untouched.

## v-1.0.22

### [v 1.0.22] 2026-07-01 11:50 am - Project Manager Magic Fill Rules

#### Database Changes

- Database update: No live database/schema migration was run for this release.
- Project Manager magic fill writes only through the existing JSON-backed Project Manager APIs and keeps existing keys de-duplicated.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.22`.
- Added compact `Sparkles` magic-fill icon buttons to the Platform Registry module workspace tabs for Features, Actions, APIs, Screens, Database, Planning, and Model Notes.
- Added bulk magic-fill rules that create missing registry rows from the selected module: standard list/create/show/edit/delete API contracts, action rows, screen rows, database field rows, planning coverage, and model notes.
- Added form-level magic-fill buttons for Module Registry, Feature Registry, and detail registry dialogs so users can infer module keys, routes, permission keys, API fields, database field metadata, component paths, test paths, and notes before saving.
- Kept magic-fill idempotent by checking existing feature/detail keys before creating JSON records.
- Aligned generated permission keys to the existing platform profile pattern, for example `platform.tenant.profile.view` and `platform.tenant.profile.manage`.

## v-1.0.21

### [v 1.0.21] 2026-07-01 11:38 am - Project Manager Live Control Dashboard

#### Database Changes

- Database update: No live database/schema migration was run for this release.
- Reset the JSON-backed Project Manager data store to a clean live seed baseline for registry, work, discussions, releases, automation, activity, agent notes, security, and reference reporting.
- Removed the old manual insight-record JSON store so Insights is generated from connected Project Manager references instead of separate duplicated data.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.21`.
- Added the Project Manager dashboard as the live control entry point for open work, blockers, reviews, release state, GitHub activity, automation status, and registry coverage.
- Reorganized the Project Manager side menu into the production set: Dashboard, Platform Registry, Work & Automation, Discussions, Agent & Security, Release Notes, and Insights.
- Refined Platform Registry into the drill-down development map: Platform -> App/Area -> Module Group -> Module -> Feature/Action/API/Screen/Database/Planning, with reference IDs and lookup-based relationships.
- Reworked Work & Automation as the operational area for issues, tasks, reviews, commands, automation events, activity, timeline, and board-style planning, with popup forms for compact records and dedicated pages for larger records.
- Reworked Discussions into focused Discussion and Reviews tabs, and merged Agent Notes with Security and Quality into one Agent & Security page.
- Rebuilt Release Notes as the release control area with separate Deployed Release, Working Release/Changelog, and GitHub tabs; `github:now` now writes connected pull-request snapshots for release references.
- Changed Insights into a generated report page only, binding Platform Registry, work, discussion, release, security, agent, automation, and activity records by module and reference number.
- Standardized Project Manager forms with design-system autocomplete lookups, select controls, date picker fields, tag chips, switches, and rich text editors where longer working notes are needed.
- Removed the manual insight-record UI tab, backend kind, and API route alias to avoid duplicated reporting data.
- Added the Project Manager maturity guide and connected the UI to the JSON Project Manager store for read/write development planning without depending on the live application database.

## v-1.0.20

### [v 1.0.20] 2026-07-01 7:59 am - Remove Deprecated Admin Surface

#### Database Changes

- Database update: No schema changes.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.20`.
- Removed the deprecated Super Admin menu group, route, and page so the workflow can be rebuilt from scratch later.
- Removed the deprecated JSON-backed admin API endpoints and helper code.
- Deleted the old deprecated JSON storage files.

## v-1.0.19

### [v 1.0.19] 2026-06-30 7:00 pm - Individual Typed Common Modules With API Routes

#### Database Changes

- No schema changes in this version (in-memory repositories).

#### App Codebase Changes

- **apps/core**: Refactored 30 common modules from a single generic `CoreRecord` with `payload` JSON field into individual typed modules under `apps/core/src/common-modules/` — each with its own contracts, repository, service, and subpath export (e.g. `@codexsun/core/common-modules/countries`).
- **apps/core**: Created `CommonModuleService` interface and `CommonModuleServiceMap` registry for dispatching CRUD operations to typed services by `definitionKey`.
- **apps/core**: Created `setup.ts` that instantiates all 30 service+repository pairs into a single registry object.
- **apps/core**: Rewrote `common-routes.ts` to dispatch `/core/common/*` requests to the registry instead of using the old generic `CoreRecordService`. Routes now require `definitionKey` as a query parameter for list/getById/archive/restore and as a body field for create/update.
- **apps/core**: Updated `api/index.ts` with `coreCommonServices` Fastify decoration type and exported `createAllCommonModuleServices`, `commonModuleDefinitions`, and `CommonModuleServiceMap`.
- **apps/platform/api**: Wired `createAllCommonModuleServices()` into Fastify DI and decorated `coreCommonServices` on the app instance.
- **apps/platform/web**: Rewired `CommonModulePage` from mock data to real API calls using `useQuery`/`useMutation` with `@tanstack/react-query`, `apiGet`/`apiPost`/`apiPut` helpers, and `toast` notifications. Removed `sampleRecords`.
- All 3 packages (`apps/core`, `apps/platform/api`, `apps/platform/web`) pass typecheck with zero errors.

## v-1.0.18

### [v 1.0.18] 2026-06-30 6:00 pm - Tenant Common And Master Data Modules

#### Database Changes

- No schema changes in this version (in-memory repositories used for prototyping).

#### App Codebase Changes

- **apps/core**: Added `WorkOrderService`, `InMemoryWorkOrderRepository`, and work order contracts (`WorkOrderProfile`, `WorkOrderCreateInput`, `WorkOrderUpdateInput`) with six CRUD API routes (`GET/POST /core/orders`, `GET/PUT /core/orders/:id`, `POST /core/orders/:id/archive`, `POST /core/orders/:id/restore`).
- **apps/core**: Updated `ContactProfile` to match Task 19 field spec with `code`, `name`, `contactTypeId`, `ledgerId`, `legalName`, `pan`, `gstin`, `msmeType/no`, `tan`, `tdsAvailable`, `tcsAvailable`, `openingBalance`, `balanceType`, `creditLimit`, `website`, `primaryEmail`, `primaryPhone`, `description`, and child arrays for `addressBook`, `contactEmails`, `contactPhones`, `contactSocialLinks`, `contactBankAccounts`, `contactGstDetails`.
- **apps/core**: Updated `ProductItem` to match Task 19 field spec with `productTypeId?`, `hsnCodeId?`, `unitId?`, `taxId?` (integer references) replacing old string-code-based fields.
- **apps/core**: Added extended seed data for `salesAccountType`, `orderType`, `transport`, `warehouse`, `destination`, `stockRejectionType`, `contactGroup`, `productGroup`, `productCategory`, `productType`, `brand`, `colour`, `size`, `style`.
- **apps/core**: Exported `"./master/orders"` package path and registered `registerCoreOrderRoutes` in `registerAllCoreRoutes`.
- **apps/platform/api**: Wired `WorkOrderService` into Fastify app DI and decoration.
- **apps/platform/web**: Built `CommonModuleIndexPage` — grouped index of all 30 common module definitions (Location, Contacts, Product, Orders, Others).
- **apps/platform/web**: Built `CommonModulePage` — generic list + popup upsert (via `WorkspaceUpsertDialog`) for any common module, with code/name columns, search, status filter, pagination, active badge, row actions, and active toggle in upsert.
- **apps/platform/web**: Built `ProductListPage` — product master with list, show, and upsert views (code, name, type, HSN, unit, tax, active toggle).
- **apps/platform/web**: Built `WorkOrderListPage` — work order master with list, show, and upsert views (code, name, description, active toggle).
- **apps/platform/web**: Added `CommonRecordAutocomplete`, `ProductAutocomplete`, `WorkOrderAutocomplete` — API-fetched searchable dropdowns using `WorkspaceAutocomplete`.
- **apps/platform/web**: Updated `TenantDesk` with Dashboard, Contacts, Products, Work Orders, and Master Data navigation sections.

## v-1.0.17

### [v 1.0.17] 2026-06-30 2:39 pm - Design System Helper And Module Standards

#### Database Changes

- Database update: No schema changes.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.17`.
- Added `assist/documentation/design-system-helper.md` as the standard for upcoming list, show, upsert, select, autocomplete, date, status, toast, sidebar, and backend module patterns.
- Updated the governance rule book to require design-system workspace components, DB/API-backed module data, shared validation banners, required markers, activity history, audit logging, and relationship safety.
- Linked the design-system helper from the assist README so future agents can find the UI/backend module standard on load.

## v-1.0.16

### [v 1.0.16] 2026-06-30 2:30 pm - Upsert Validation Banners

#### Database Changes

- Database update: No schema changes.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.16`.
- Added reusable `WorkspaceFormBanner` for compact form-level error, warning, and info messages.
- Wired inline validation banners into Tenant and shared Super Admin upsert forms.
- Disabled native browser validation on workspace upsert forms so missing fields, duplicate errors, and server/database errors use the design-system banner.
- Added Playwright coverage for missing required-field banner behavior on Domain upsert.

## v-1.0.15

### [v 1.0.15] 2026-06-30 2:00 pm - Validation Relationship Safety And Activity Timeline

#### Database Changes

- Database update: No schema changes.
- Added API-level validation for Domain, Subscription, Plan, Apps, and Industry before database writes.
- Added relationship safety checks that block deleting Plans used by Subscriptions and Apps assigned to tenants.
- Added tenantId into new tenant audit payloads so activity timelines can resolve tenant records without schema changes.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.15`.
- Added shared red required `*` marker support in workspace form fields.
- Marked required fields in Tenant and shared Super Admin module upsert forms.
- Added frontend required-field validation before submitting shared module forms.
- Added `/admin/activity/:module/:recordId` for record-level activity timelines from audit events.
- Added Activity cards on Tenant, Domain, Plan, Subscription, Apps, and Industry show pages.
- Added API tests for relationship safety and record activity.

## v-1.0.14

### [v 1.0.14] 2026-06-30 1:45 pm - Super Admin Lifecycle Hardening

#### Database Changes

- Database update: No new tables.
- Added permanent delete behavior against existing DB-backed module tables for Subscription, Plan, Apps, and Industry.
- Preserved Tenant lifecycle as suspend/restore only because tenant records own related database, domain, module, and subscription state.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.14`.
- Fixed platform API preflight on Windows/Node by avoiding direct `npm.cmd` spawning during dependency builds.
- Added audited delete APIs for `/admin/subscriptions/:id`, `/admin/subscription-plans/:id`, `/admin/platform-apps/:moduleKey`, and `/admin/industries/:id`.
- Added shared typed force-delete confirmation for Domain, Subscription, Plan, Apps, and Industry.
- Kept archive/suspend and restore actions available for Tenant, Plan, Subscription, Apps, and Industry status lifecycle.
- Extended API tests to verify permanent delete for Subscription, Plan, Apps, and Industry.
- Extended Playwright coverage to verify Apps and Industry force-delete behavior after database persistence.

## v-1.0.13

### [v 1.0.13] 2026-06-30 11:48 am - Super Admin Apps And Industries DB Backing

#### Database Changes

- Database update: Yes.
- Extended the existing platform catalog migration with persisted `platform_modules` status/default flags and a new `platform_industries` table.
- Added bootstrap repair so existing local master databases receive Apps and Industry tables/columns during preflight.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.13`.
- Added DB-backed `/admin/platform-apps` list/create/update APIs for the Apps module.
- Added DB-backed `/admin/industries` list/create/update APIs for the Industry module.
- Rewired Super Admin Apps and Industry pages to load, save, update, refresh, show, and persist through API/database only.
- Removed frontend seed records from Apps and Industry module configs.
- Added API tests for Apps and Industry persistence.
- Added Playwright coverage for Apps and Industry list + show + upsert persistence after refresh.

## v-1.0.12

### [v 1.0.12] 2026-06-30 11:35 am - Super Admin Master Workspace Modules

#### Database Changes

- Database update: Yes.
- Added fresh master foundation support for `tenant_subscriptions` and `subscription_plans`.
- Added bootstrap repair for subscription and plan tables so existing local master databases can self-heal during preflight.
- Kept existing migration files rewritten in-place for fresh migration flow, avoiding extra patch migrations for this foundation stage.

#### App Codebase Changes

- Bumped workspace packages and lockfile to `1.0.12`.
- Reviewed current module readiness: Tenant, Domain, Plan, and Subscription are DB/API-backed; Apps and Industry remain shared workspace-module screens and can move next unless DB-backed boundaries are requested.
- Added Domain DB-backed list/show/upsert with tenant lookup, landing app, primary switch, status, and permanent force-delete confirmation.
- Added Subscription DB-backed list/show/upsert with tenant lookup, Plan autocomplete/create, billing cycle, seats, amount, currency, start date, renewal date, notes, and status.
- Added dedicated Plan module with reusable plan records and Subscription autocomplete binding.
- Removed generic `Owner` field/column/show value from shared Super Admin module forms; retained explicit `Owner team` fields where module configs intentionally define them.
- Added reusable workspace `DatePicker` using shadcn-style popover/calendar/select controls with month/year selection.
- Improved workspace lookup clear behavior so dropdown remains usable immediately after clear without requiring blur/focus.
- Added e2e coverage for Domain create/persist/force-delete, Subscription plan/tenant lookup/date picker persistence, and Super Admin sidebar visibility.

## v-1.0.11

### [v 1.0.11] 2026-06-29 5:30 pm - Platform Super Admin Closure And App Boundary Verification

#### Database Changes

- Database update: No schema changes.
- Removed `business.master-data` module key from `platformModuleCatalog`; added `core.contact`, `core.company`, `core.product` keys.
- Removed `business.master-data.view` and `business.master-data.manage` permissions from role-permission map.

#### App Codebase Changes

- **Task 14 artifact removal**: Deleted `packages/platform/src/master-data/` (contracts, service, repository, index), `apps/platform/api/src/master-data/routes.ts`, and `apps/platform/api/src/__tests__/master-data.test.ts`.
- **app.ts cleanup**: Removed all master-data imports, service instantiation, Fastify decoration, and route registration from `apps/platform/api/src/app.ts`.
- **Platform package**: Removed `master-data` export from `packages/platform/src/index.ts`. Updated permission types in `packages/platform/src/permissions/contracts.ts`.
- **Tenant Domains API**: Added `GET/POST/DELETE /admin/tenants/:tenantId/domains` routes in `apps/platform/api/src/admin/routes.ts` for CRUD against existing `tenant_domain_mappings` table.
- **Migration Runner API**: Added `POST /admin/migrations/run` endpoint to trigger pending master migrations.
- **Tenant Database API**: Added `GET /admin/databases` endpoint to list tenant database records.
- **Super Admin UI**: Created 9 new SA page components under `apps/platform/web/src/pages/sa/`: `TenantDomains` (domain CRUD with tenant selector), `Subscriptions` (plan scaffold), `Industries` (vertical scaffold), `QueueManager` (job queue scaffold), `DatabaseManager` (migration status + tenant DB list), `DevDocs` (architecture reference with sidebar nav), `Support` (helpdesk scaffold), `ZetroSetup` (AI assistant scaffold), `GstSetup` (tax compliance scaffold).
- **Admin Desk**: Enhanced `AdminDesk.tsx` with 4 nav views (Dashboard, Support Queue, Activation Review, Helpdesk).
- **SA Desk**: Extended `SaDesk.tsx` nav with Domains, Subscriptions, Industries, DB Manager, Queue, Support, Dev Docs, ZETRO, GST entries — 22 total navigation items.
- **Tenant Desk**: Removed obsolete master-data and master-records nav items from `TenantDesk.tsx`; kept Contacts, Item Categories, Units, Tax Categories.
- **Core Route Tests**: Created `apps/platform/api/src/__tests__/core-routes.test.ts` with 28 tests covering `/core/common/*` definitions/records, `/core/contacts/*`, `/core/companies/*`, and `/core/products/*` CRUD and archive/restore.
- **Boundary Review**: Updated `assist/architecture/module-boundaries.md` with comprehensive app boundary table, table ownership, package dependency direction, migration verification, Task 14 artifact cleanup checklist, and 8 boundary decisions.
- Updated catalog test to reflect new module key names (`core.contact`, `core.company`, `core.product`).
- All 10 workspace packages pass typecheck and lint; **102 API tests + 30 framework tests + 11 platform tests = 143 total passing**.

## v-1.0.10

### [v 1.0.10] 2026-06-29 11:15 am - Core App Common And Master Module Foundation

#### Database Changes

- Database update: No (in-memory repositories; DB-backed pending future task).
- Added `core` module key to `platformModuleCatalog` in `packages/platform/src/catalog/contracts.ts`.
- Added `corePermissions` (8 permission keys) to `packages/platform/src/permissions/contracts.ts`, assigned to `super_admin` and `tenant` user types.

#### App Codebase Changes

- Bumped root workspace pattern to include `apps/*` so single-level app packages are recognised.
- Created `apps/core` (`@codexsun/core`) with subpath exports for common, master/*, shared, api, and testing modules.
- **Common Definition Registry** (`apps/core/src/common/contracts.ts`): 30 definition types (countries, states, districts, cities, pincodes, contact groups/types, address types, bank names, product groups/categories/types, units, HSN codes, tax categories, brands, colours, sizes, styles, currencies, priorities, payment terms, accounting years, months, sales account types, order types, transports, warehouses, destinations, stock rejection types) with scope, seedable flag, fields, permissions, and feature key. 30+ default seed records for countries, contact types, address types, units, bank names, currencies, payment terms, months, priorities, accounting years.
- **Common Record Service** (`apps/core/src/common/service.ts`): `CoreDefinitionService` and `CoreRecordService` with CRUD, archive/restore, duplicate-code detection, seedDefaults.
- **In-Memory Repository** (`apps/core/src/common/repository.ts`): `CoreRecordRepository` interface + `InMemoryCoreRecordRepository` with tenant-scoped filter, archive/restore.
- **Contact Master Module** (`apps/core/src/master/contacts/`): `ContactProfile` with phone/email/address/social/bank/tax child blocks, CRUD, archive/restore.
- **Company Master Module** (`apps/core/src/master/companies/`): `CompanyProfile` with legal/trade name, addresses, bank accounts, tax identities, CRUD, archive/restore.
- **Product/Item Master Module** (`apps/core/src/master/products/`): `ProductItem` with code/name/group/category/type/unit/HSN/tax/attributes, CRUD, archive/restore.
- **Shared Blocks** (`apps/core/src/shared/`): `AddressBlock`, `PhoneBlock`, `EmailBlock`, `BankAccountBlock`, `TaxIdentityBlock` reusable value-object types.
- **Core API Routes** (`apps/core/src/api/`): 26+ endpoints under `/core/common/*`, `/core/contacts/*`, `/core/companies/*`, `/core/products/*` with session, tenant context, active tenant, feature activation (`core`), permission (`core.*.view`/`core.*.manage`), and audit guards (correlationId in response meta and audit events).
- **Route Registration** (`apps/core/src/api/index.ts`): `registerAllCoreRoutes()` accepts a `CoreRouteContext` for injecting platform guard functions, enabling loose coupling between core routes and platform API.
- **Platform API Wiring** (`apps/platform/api/src/app.ts`): Core services (`CoreDefinitionService`, `CoreRecordService`, `CoreContactService`, `CoreCompanyService`, `CoreProductService`) created, decorated on FastifyInstance, and routes registered via `registerAllCoreRoutes` with `requireSession`, `requireActiveTenant`, `requireFeatureEnabled`, `requirePermission` from existing guards.
- **Fastify Augmentation**: Added `@codexsun/framework/api` import in core api module for `correlationId`/`tenantId` request properties; custom `auditRecordEvent()` helper casts through `(app as any)` to avoid type conflicts with platform's `AuditService`.
- **Existing Task 14 master-data** (platform-owned) retained for backward compatibility; core routes use separate `/core/*` prefix with enhanced definitions (30 vs 11) and richer child blocks.
- All 7 workspace packages pass typecheck, lint, build, and 129 tests (30 framework + 74 existing API + 25 master-data).

## v-1.0.9

### [v 1.0.9] 2026-06-29 10:30 am - Foundation Closure Audit And Business Readiness Gate

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Bumped workspace version to 1.0.9.
- Completed Task 13 (Foundation Closure Audit & Business Readiness Gate).
- Performed comprehensive foundation coverage audit across all 13 task files, 11 core documentation files, and the actual codebase.
- Updated task statuses: tasks 7-13 changed from `planned` to `done`; batch root `task.md` changed from `in_progress` to `complete`.
- Fixed documentation inconsistency in `api-guidelines.md`: `x-correlation-id` was marked "Removed" but has been restored since v1.0.4; updated to reflect current state with `correlationId` in envelope meta.
- Verified all 5 workspace packages pass typecheck, lint, and 74 integration tests.
- Produced foundation readiness decision: **READY FOR BUSINESS MODULES**.
- Created `assist/handoff/task_13_handoff.md` with full checklist, remaining blockers, deferred items, and recommended next task.
- All six workspace packages pass typecheck and lint cleanly.

## v-1.0.8

### [v 1.0.8] 2026-06-29 10:20 am - Settings, Files, Notifications, Activity, And Agent Workbench Foundation

#### Database Changes

- Database update: Yes (auto-check).
- Added `004_master_settings_files_notifications` migration with 7 new tables: `platform_settings`, `platform_feature_flags`, `file_metadata`, `notification_records`, `agent_action_audits`, `activity_timeline`, `comments`.

#### App Codebase Changes

- Bumped workspace version to 1.0.8.
- Implemented Task 9 (Settings & Configuration Foundation), Task 10 (Document File & Print Template Foundation), Task 11 (Notification, Mail & Activity Foundation), and Task 12 (Developer & Agent Workbench Foundation).
- **Settings (Task 9):** Created `SettingsService` + `MasterDbSettingsRepository` in `packages/platform/src/settings/` for CRUD, secret masking, feature flag management, and console setting sections.
- **Files (Task 10):** Created `FileService` + `InMemoryFileRepository` in `packages/platform/src/files/` for file metadata CRUD, tenant isolation, and storage adapter wiring.
- **Templates (Task 10):** Created `TemplateService` + `InMemoryTemplateRepository` in `packages/platform/src/templates/` for print template registry with seeded defaults (invoice, quote, receipt).
- **Notifications (Task 11):** Created `NotificationService` + `InMemoryNotificationRepository` in `packages/platform/src/notifications/` for notification CRUD, mail template list, and mail queue job placeholder.
- **Activity (Task 11):** Created `ActivityService` + `InMemoryActivityRepository` in `packages/platform/src/activity/` for activity timeline and comment system with tenant isolation.
- **Agents (Task 12):** Created `AgentService` + `InMemoryAgentRepository` in `packages/platform/src/agents/` for agent permission model, tool registry, prompt template registry, agent action audit, and provider settings.
- Added generic `recordEvent()` method to `AuditService` for custom audit events.
- Added subpath exports in `@codexsun/platform/package.json` for activity, agents, files, and templates modules.
- Created 9 new route files (settings, activity, files, notifications, templates, agents) with 30+ endpoints covering all foundation modules.
- Added `004_master_settings_files_notifications.ts` migration with 7 new tables.
- Wired all 7 new services in `apps/platform/api/src/app.ts` with Fastify decoration and route registration.
- Created 3 new UI pages: `PlatformSettings.tsx` (runtime, auth, mail, system defaults, support), `FeatureFlags.tsx` (enable/disable per tenant with audit), `WorkbenchPage.tsx` (4-tab shell: Tool Registry, Prompt Templates, Action Audit, Provider Settings).
- Added 31 integration tests for all foundation endpoints; total 74 tests pass across 4 test files.
- All six workspace packages pass typecheck and lint cleanly.

## v-1.0.7

### [v 1.0.7] 2026-06-29 10:05 am - Platform Admin Console And User Role & Permission UI

#### Database Changes

- Database update: No schema changes.

#### App Codebase Changes

- Bumped workspace version to 1.0.7.
- Implemented Task 7 (Platform Admin Console) and Task 8 (User Role & Permission UI).
- Created `UserService` with `MasterDbUserRepository` in `packages/platform/src/users/service.ts` for CRUD, suspend, activate on super_admin_users and staff_users.
- Created `RoleService` with `InMemoryRoleRepository` in `packages/platform/src/roles/service.ts` for role CRUD, permission matrix, system role definitions.
- Extended `SessionStore` interface and both implementations (`InMemorySessionStore`, `DatabaseSessionStore`) with `listAsync()`.
- Added `getSessionStore()` to `AuthService`.
- Rewrote `apps/platform/api/src/admin/routes.ts` with 20+ admin endpoints: console dashboard, tenant CRUD + suspend/restore, module catalog + enable/disable, audit viewer, migration status, health check, platform users CRUD, role management, permission matrix, session list + revoke.
- Wired `userService`, `roleService` in api `app.ts`; seeded system roles from contracts.
- Created 10 admin sub-pages under `apps/platform/web/src/pages/sa/` using `@codexsun/ui` components and TanStack Query: ConsoleHome, TenantList, ModuleActivation, AuditViewer, MigrationStatus, HealthView, UserList, RoleList, PermissionMatrix, SessionList.
- Refactored `SaDesk.tsx` with state-based page routing and navigation bar.
- Fixed BigInt serialization with `toNumber()` helper for MariaDB COUNT/SUM.
- Fixed `audit_events` INSERT to omit `tenant_id` column (schema compatibility).
- Added 25 admin integration tests; all 43 tests pass (18 existing + 25 new).
- All six workspace packages pass typecheck and lint cleanly.

## v-1.0.6

### [v 1.0.6] 2026-06-29 6:25 pm - Workspace Design System And Reusable List Patterns

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Bumped workspace version to 1.0.6.
- Created reusable workspace building blocks in `@codexsun/ui/src/workspace/`: page, panel, header, actions, field, section, status, table, filters, pagination, row-actions, show, upsert, line-table, totals, print, motion, autocomplete, editor, drag-drop, types, utils.
- Created workspace presets in `@codexsun/ui/src/workspace/presets/`: common-list, master-list, entry-list.
- Wrapped third-party UI libraries (framer-motion, @tiptap, react-hook-form, @hookform/resolvers) behind CODEXSUN workspace wrappers.
- Added subpath exports to `@codexsun/ui/package.json` for workspace, presets, components, and lib paths.
- Created three template pages with dummy data in Platform Web: CommonListTemplatePage (Tenant Domains), MasterListTemplatePage (Contacts), EntryListTemplatePage (Invoices).
- Added three design routes: `/design/common-list`, `/design/master-list`, `/design/entry-list`.
- Built one reusable workspace list/show foundation; CommonList, MasterList, EntryList use the same base blocks.
- Implemented list -> show -> upsert flow for all three templates with local dummy state.
- Added print preview for entry (Invoice) flow.
- Added line-table with editable sub-table rows and totals calculation for entry upsert.
- Removed unused imports across template pages to satisfy strict lint rules.
- All six workspace packages pass typecheck and lint cleanly.

## v-1.0.5

### [v 1.0.5] 2026-06-29 8:54 am - Framework And Platform Module Readiness

#### Database Changes

- Database update: Yes (auto-check).
- Extracted monolithic bootstrap into versioned MigrationRunner with ordered migrations.
- Created `platform_modules` and `tenant_module_activation` tables for module catalog and feature activation.

#### App Codebase Changes

- Bumped workspace version to 1.0.5.
- Redesigned `ModuleRegistry` with rich `ModuleContract` (moduleKey, displayName, scope, version, requiredPermissions, requiredFeatureKey, migrationKey).
- Added `sourceModule`, `actorEmail` to `DomainEvent` and `QueueJob` contracts.
- Created platform module catalog (`@codexsun/platform/catalog`) with `ModuleCatalogService` and stable module keys for platform and future tenant modules.
- Defined permission keys (`platform.tenant.profile.view`, `platform.audit.activity.view`, `platform.user.profile.manage`, etc.) and role-to-permission mapping (`super_admin`, `staff`, `tenant`, `system`).
- Replaced placeholder `requirePermission()` with real check against `userTypeHasPermission()`.
- Created `PermissionService` at `@codexsun/platform/permissions`.
- Created `ActivationService` with DB-backed `isEnabled`, `requireEnabled`, `isTenantActive`, `requireTenantActive` checks.
- Created `SubscriptionService` with `requireSubscriptionAllowed` placeholder.
- Created `MigrationRunner` at `apps/platform/api/src/db/migration-runner.ts` for ordered, repeatable, startup-safe migrations.
- Split bootstrap schema into versioned migration files: `001_master_foundation`, `002_master_audit_sessions`, `003_master_platform_catalog`.
- Added read-only admin support endpoints: `GET /admin/modules`, `GET /admin/modules/:tenantId`, `GET /admin/audit`, `GET /admin/migrations`.
- Added 11 platform package unit tests for permissions, catalog contracts, and migration runner.
- Framework tests remain at 30 passing, platform tests at 15 passing (30 + 11 + 5 = 46 total).

## v-1.0.4

### [v 1.0.4] 2026-06-29 8:54 am - Restore Correlation ID And Harden Platform Foundation

#### Database Changes

- Database update: Yes (auto-check).
- Added `correlation_id` column to `audit_events` table.

#### App Codebase Changes

- Bumped workspace version to 1.0.4.
- Restored `correlationId` to framework envelope (`ResponseMeta`, `createMeta`, `ok`, `fail`) at `packages/framework/src/http/envelope.ts`.
- Restored `correlationId` to `StructuredLog` at `packages/framework/src/logger/logger.ts`.
- Restored `correlationId` to `DomainEvent` contract at `packages/framework/src/events/contracts.ts`.
- Restored `correlationId` to `QueueJob` contract at `packages/framework/src/queue/contracts.ts`.
- Restored `correlationId` to `FastifyRequest` decoration and `x-correlation-id` header read/echo at `packages/framework/src/api/tenant-context.ts`.
- Restored `correlationId` propagation in `create-api-app.ts` error handler and root route.
- Restored `correlationId` to structured request logging at `packages/framework/src/api/request-logging.ts`.
- Restored `correlationId` to health route meta at `packages/framework/src/api/health-route.ts`.
- Added `correlationId` to `AuditEvent` contract at `packages/platform/src/audit/contracts.ts`.
- Wired `correlationId` through all `AuditService` methods (auth login/logout, tenant lifecycle).
- Stored `correlation_id` in `MasterDbAuditRepository` insert at `packages/platform/src/audit/repository.ts`.
- Changed tenant `delete` to archive (set status=inactive) in `TenantService` and `MasterDbTenantRepository`.
- Added `correlationId` propagation in auth routes and tenant routes audit calls.
- Updated framework envelope tests to verify `correlationId` presence/absence.
- Updated error handler tests to verify `x-correlation-id` echo and auto-generation.
- Updated health route tests to verify `correlationId` in health meta.
- Updated platform API tests with archive verification, duplicate-archive rejection, and `x-correlation-id` echo test.

## v-1.0.3

### [v 1.0.3] 2026-06-29 8:54 am - JWT-only auth, preflight probe, lint clean

#### Database Changes

- Database update: Yes (auto-check).
- Added `tenant_id` column to `audit_events` table.

#### App Codebase Changes

- Bumped workspace version to 1.0.3.
- Added guard helpers: `requireSession`, `requireUserType`, `requireSuperAdmin`, `requireTenantMatch` (`apps/platform/api/src/auth/guards.ts`).
- Added permission/activation guard placeholders: `requirePermission`, `requireActiveTenant`, `requireFeatureEnabled`.
- Created `MasterDbTenantRepository` (`packages/platform/src/tenant/repository.ts`) with list/getById/findByCode/create/update/delete/resolveDatabase.
- Created `TenantService` (`packages/platform/src/tenant/service.ts`) with validation, duplicate detection, and DTO mapping.
- Created `MasterDbAuditRepository` (`packages/platform/src/audit/repository.ts`) and `AuditService` (`packages/platform/src/audit/service.ts`).
- Wired audit events for `auth.login.success`, `auth.login.failed`, `auth.logout`, `tenant.created`, `tenant.updated`, `tenant.deleted`.
- Split tenant CRUD routes out of auth routes into dedicated `apps/platform/api/src/tenant/routes.ts`.
- Updated tenant routes to use guard helpers and tenant service instead of raw SQL.
- Added 9 tenant management API tests covering list, create (success/duplicate/missing fields), read, update, and auth guards.
- Removed AUTH_MODE entirely; switched from cookie/hybrid to JWT-only auth with no fallback.
- Created JWT utilities at `packages/platform/src/auth/jwt.ts` using Node built-in `crypto.createHmac` (HMAC-SHA256, zero extra dependencies).
- Simplified `AuthService` constructor to `(jwtSecret, tenantLookup, userFinder)` — `jwtSecret` is now required, `DatabaseSessionStore` dependency removed.
- Updated login and session routes to always return/expect a Bearer JWT token; removed all cookie-related branches.
- Added per-desk JWT token storage in `apps/platform/web/src/api.ts` with separate `localStorage` keys (`codexsun_session_sa`, `codexsun_session_admin`, `codexsun_session_tenant`).
- Rewired `AuthGate` to validate JWT client-side (decode payload, check `exp` + `userType`) instead of making a network round-trip.
- Created `TenantLayout` at `packages/ui/src/layouts/tenant-layout.tsx` matching the SuperLayout/AdminLayout pattern.
- All three desks (SaDesk, AdminDesk, TenantDesk) now share the same composition pattern.
- Created `tools/env-jwt-secret.mjs` for generating a random 32-byte hex `JWT_SECRET`; added `npm run env:jwt-secret`.
- Synced `.env` and `.env.example` with all 22 schema variables plus `PLATFORM_WEB_PORT`, `VITE_PLATFORM_API_URL`, `VITE_TENANT_NAME`, and `CODEXSUN_DEV_PORT_POLICY`.
- Updated ESLint config (`eslint.config.js`) to allow empty catch blocks and underscore-prefixed unused parameters, keeping lint clean across all 6 packages.
- Replaced unreliable `netstat`-only port check in `tools/preflight.mjs` with a `net.createServer` probe (`probePort`) that directly tests whether the port can be bound, eliminating `EADDRINUSE` race conditions on restart.
- Hardened platform API dev startup so preflight checks the configured host, stops watcher child trees on Windows, and registers graceful shutdown before listening.
- Fixed the preflight probe handoff by waiting for the temporary socket to close before launching the API watcher, preventing Windows `EADDRINUSE` races.
- Removed loose tenant route database casts so `@codexsun/platform-api` lint runs without warnings.

### [v 1.0.2] 2026-06-28 9:47 pm - sidebar trigger bar icon

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace version to 1.0.2.
- Changed the shared sidebar trigger icon from the panel glyph to the bar menu glyph used by the workspace top bar.
- Replaced the workspace switcher active mark with the shared Lucide check icon.
- Converted the inset sidebar/topbar shell into a reusable role-driven dashboard template.
- Wired Super Admin, Staff Admin, and Tenant desks to the shared template with dynamic menu, submenu, workspace switcher, branding, and user footer data.
- Cleaned framework strict optional typing so uncached type checks remain green under the current TypeScript settings.
- Wired framework correlation IDs through request context, response headers, envelopes, and structured request logs.
- Added explicit `AUTH_MODE` support for cookie, bearer, and hybrid web/API session flows.
- Removed the hidden tenant-code default from auth validation and login form state.
- Tightened platform service, tenant lookup, session store, API client, and test helper types to keep framework/platform lint clean.

## v-1.0.1

### [v 1.0.1] 2026-06-28 11:15 pm - dynamic browser page title

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Changed the Platform Web fallback browser title to `Codexsun | Dashboard`.
- Added route-aware document title updates so the text after `|` follows the open page.
- Added `VITE_TENANT_NAME` so the title prefix can come from the tenant display name.

### [v 1.0.1] 2026-06-28 11:05 pm - branded billing desk shell

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Wired the platform web app to the stored CODEXSUN logo, dark logo, and favicon assets.
- Added a Billing Desk top menu with sidebar toggle, workspace switcher dropdown, and right-side desk actions.
- Reworked the inset sidemenu branding, version footer, and signed-in user dropdown to match the super-admin desk references.
- Added the Billing Desk overview card above the dashboard content.

### [v 1.0.1] 2026-06-28 10:45 pm - consistent sidebar gutter

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Fixed inset sidebar collapsed width so the sidebar-to-workspace gutter remains consistent while toggling.
- Made the sidebar rail indicator transparent by default and removed the native rail tooltip title.

### [v 1.0.1] 2026-06-28 10:35 pm - matched inset panel surfaces

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Matched the inset sidemenu and workspace panel border, radius, and shadow treatments.
- Moved inset sidemenu panel styling into the shared sidebar primitive so shell surfaces stay consistent.

### [v 1.0.1] 2026-06-28 10:25 pm - shadcn b26 default theme

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Generated the shadcn b26 Vite preset with `npx shadcn@latest init --preset b26 --template vite` in a scratch folder.
- Reset `@codexsun/ui` theme tokens to the b26 default OKLCH neutral palette.
- Updated chart and sidebar token references to support direct OKLCH CSS variables.
- Aligned `components.json` with the b26 preset metadata.
- Added an assist rule requiring agents to ask before changing technology choices when commands are doubtful or conflicting.

### [v 1.0.1] 2026-06-28 10:15 pm - clearer neutral shell borders

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Darkened the shared neutral border tokens for clearer sidebar and workspace separation.
- Added an inset workspace panel border so it visually matches the bordered sidemenu.

### [v 1.0.1] 2026-06-28 10:10 pm - medium sidemenu radius

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Rounded the visible inset sidemenu panel corners with the design system medium radius.

### [v 1.0.1] 2026-06-28 10:05 pm - bordered inset sidemenu

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Added a border around the visible inset sidemenu panel in both expanded and collapsed states.

### [v 1.0.1] 2026-06-28 9:55 pm - inset sidemenu rail toggle

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Made the sidemenu default to the inset sidebar variant.
- Restored `SidebarRail` so the inset sidemenu can collapse and expand from the sidebar edge.

### [v 1.0.1] 2026-06-28 9:45 pm - inset workspace shell

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Changed the workspace `AppLayout` sidebar usage from floating to inset while preserving icon collapse.
- Removed the sidemenu boundary rail so the workspace no longer shows the rail hover tooltip target.

### [v 1.0.1] 2026-06-28 9:35 pm - icon-collapsing sidemenu

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Rebuilt the sidemenu block from the temp shadcn reference into the active `AppSidebar`.
- Added a `sidemenu/sub` renderer for grouped menu sections with collapsible submenu support.
- Changed the floating app sidebar to collapse into an icon rail instead of hiding off-canvas.
- Removed raw temp sidemenu sample files with unresolved `@/` imports from the compiled UI package.

### [v 1.0.1] 2026-06-28 9:20 pm - floating app sidebar layout

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Changed `AppLayout` to use the shadcn floating sidebar shell with a 19rem sidebar width.
- Replaced the app header title with a sidebar trigger, separator, and workspace breadcrumb.
- Kept the workspace dashboard content composition unchanged while updating the surrounding shell.

### [v 1.0.1] 2026-06-28 9:05 pm - warning-free dev preflight

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Updated the root npm package manager metadata to npm 11.17.0.
- Removed the Windows shell-based dev process launch from `tools/preflight.mjs` to clear Node DEP0190 startup warnings.
- Made the preflight launcher prefer workspace-local CLI binaries so Platform Web starts with its declared Vite version.

### [v 1.0.1] 2026-06-28 8:55 pm - quiet protected route session check

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Added `/auth/session` as a non-error session probe for protected frontend desks.
- Updated `AuthGate` to use the quiet session endpoint so expected unauthenticated visits no longer emit `/auth/me` 401 console noise.

### [v 1.0.1] 2026-06-28 8:45 pm - Tailwind v4 styling foundation

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Migrated Platform Web styling to Tailwind v4 using the `@tailwindcss/vite` plugin.
- Replaced the old Tailwind/PostCSS config-driven setup with CSS-first theme tokens in `@codexsun/ui/styles.css`.
- Removed Tailwind v3 `tailwind.config.cjs`, PostCSS config files, and unused PostCSS/autoprefixer dependencies.
- Updated sidebar utilities to Tailwind v4 custom-property shorthand and restored `--spacing` based layout sizing.
- Aligned Platform Web to the current Vite toolchain and removed unused Vite tooling from `@codexsun/ui`.

### [v 1.0.1] 2026-06-28 8:20 pm - named ui layouts

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Replaced the generic `AppShell` layout with named UI layouts: `WebLayout`, `AuthLayout`, `AppLayout`, `AdminLayout`, and `SuperLayout`.
- Centralized the shadcn dashboard sidebar frame inside `AppLayout` and simplified the workspace dashboard to content-only composition.
- Moved dashboard metric cards back into the sidemenu dashboard block and removed stale layout exports.
- Wired public, auth, tenant, admin, and super-admin pages to their specific layout modules.
- Replaced placeholder sidebar menu links with real app routes.

### [v 1.0.1] 2026-06-28 8:05 pm - ui layouts folder

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Moved shared shell/layout files from `@codexsun/ui` components into `src/layouts`.
- Rewired dashboard workspace imports to consume `SiteHeader` and `SectionCards` from the layouts folder.
- Kept public `@codexsun/ui` exports stable while separating primitive components from page/layout composition.

### [v 1.0.1] 2026-06-28 7:55 pm - shadcn component foundation

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Installed the available shadcn component primitives into `@codexsun/ui` under `src/components`.
- Rewired generated component imports to package-local paths and exported the component set from `@codexsun/ui`.
- Removed duplicated reusable component copies from the dashboard block folder, leaving only block-specific sidemenu files.
- Kept CODEXSUN compatibility behavior on shared `Button`, `Card`, and `Field` while preserving shadcn component APIs.
- Moved generated component dependencies onto the `@codexsun/ui` workspace package and kept the root package dependency list clean.

### [v 1.0.1] 2026-06-28 7:35 pm - shadcn dashboard block

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Added shadcn `dashboard-01` under `@codexsun/ui` at `blocks/menu/sidemenu`.
- Added the provided dashboard table data as the block data source.
- Exported the dashboard block from `@codexsun/ui` and mounted it at Platform Web `/workspace`.
- Added standard shadcn aliases and a root TypeScript config for shadcn CLI workspace resolution.
- Moved reusable shadcn primitives into shared `@codexsun/ui` components and rewired the sidemenu block to consume them.
- Split dashboard-heavy frontend vendor chunks so the Platform Web production build stays warning-free.

### [v 1.0.1] 2026-06-28 7:20 pm - npm install cleanup

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Aligned internal workspace dependency versions to `1.0.1` so npm install resolves local packages instead of querying the public registry.
- Approved expected esbuild install scripts used by Vite and tsx so npm install runs without allow-scripts warnings.

### [v 1.0.1] 2026-06-28 7:15 pm - dev port preflight

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Added a dev preflight launcher that checks configured Platform API and Web ports before startup.
- Automatically stops existing local listener processes on dev ports unless `CODEXSUN_DEV_PORT_POLICY=abort` is set.
- Wired Platform API and Web dev scripts through the preflight launcher to avoid `EADDRINUSE` restarts.

### [v 1.0.1] 2026-06-28 7:05 pm - env driven seed auth

#### Database Changes

- Database update: Yes.
- Changed first user seeding to read optional `SUPER_ADMIN_*`, `SOFTWARE_ADMIN_*`, and `TENANT_ADMIN_*` values from environment configuration.
- Existing seeded user rows are updated only when their matching environment values are present.

#### App Codebase Changes

- Replaced `SESSION_SECRET` with required `JWT_SECRET` with no code fallback.
- Removed hardcoded seeded login credentials from the Platform Web login forms.
- Updated environment examples and MVP notes so live deployments can leave seed users blank.

### [v 1.0.1] 2026-06-28 6:55 pm - mariadb auth recovery

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Changed Platform API database bootstrap to start in degraded mode instead of crashing when MariaDB rejects the configured account.
- Added explicit `auth_gssapi_client` diagnostics in the API health details.
- Added `npm run db:create-user` helper to create a normal password-based `codexsun_app` MariaDB user when an admin login is available.
- Updated Framework env loading to find the root `.env` when workspace dev commands run from nested app folders.
- Updated environment example to prefer the dedicated app database user instead of `root`.

### [v 1.0.1] 2026-06-28 6:11 pm - root dist and shadcn ui wiring

#### Database Changes

- Database update: Yes (auto-check).

#### App Codebase Changes

- Bumped workspace version to 1.0.1.

## v-1.0.0

### [v 1.0.0] 2026-06-28 6:35 pm - root dist and shadcn ui wiring

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Routed Platform API build output to root `dist/apps/platform/api`.
- Routed Platform Web build output to root `dist/apps/platform/web`.
- Added root build cleanup and package output collection into `dist/packages/...`.
- Added Tailwind CSS, PostCSS, shadcn-compatible configuration, and `components.json`.
- Reworked `@codexsun/ui` primitives around Tailwind and shadcn-style variants while keeping the existing app component API.
- Wired Platform Web to consume the shared `@codexsun/ui/styles.css` Tailwind entrypoint.

### [v 1.0.0] 2026-06-28 6:20 pm - platform package foundation

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Added `@codexsun/platform` package with tenant, auth, users, roles, permissions, subscription, activation, audit, notifications, and settings subpaths.
- Moved Platform auth request contract, desk user-type mapping, password hashing, verification, and development session store into `@codexsun/platform/auth`.
- Rewired Platform API login, session, and seed hashing to use Platform package auth primitives.
- Added Platform foundation documentation and updated the agent reading order.

### [v 1.0.0] 2026-06-28 6:10 pm - mariadb driver compatibility

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Added MariaDB native connector support in `@codexsun/framework/db`.
- Defaulted Platform API database connections to the MariaDB driver to avoid `mysql2` failing on `auth_gssapi_client` authentication.
- Kept `mysql2` connector support available through `DB_DRIVER=mysql2` for compatible database users.
- Added `DB_DRIVER=mariadb` to `.env.example`.

### [v 1.0.0] 2026-06-28 6:00 pm - github helper workflow

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Added changelog parsing helper for latest versioned entry commit subjects.
- Added old-style `github:now` helper with changed-file review, optional version bump, commit message review, pull with rebase/autostash, add, commit, and push.
- Replaced `version:bump` script with the command-style version bump helper that updates root and workspace package versions, package lock state, and the active changelog.
- Added `check:versions` to verify package versions and changelog Version State alignment.

### [v 1.0.0] 2026-06-28 5:00 pm - fresh platform scaffold

#### Database Changes

- Database update: Yes.
- Added first automatic master database bootstrap for `codexsun_master_db`.
- Added first automatic tenant test database bootstrap for `tenant_test_001_db`.
- Added foundation seed users for Super Admin, Staff Admin, and test Tenant Admin.

#### App Codebase Changes

- Added `@codexsun/framework` with API boot, env loading, response envelopes, app errors, health checks, module registry, structured log shape, database connector, event, queue, and storage contracts.
- Rewired Platform API to use Framework bootstrap, health route, response envelope, env loading, and database connector.
- Updated Platform web status page for the framework health response shape.
- Added framework foundation documentation and updated the agent reading order.
- Started fresh from zero while keeping the `assist/` knowledge base.
- Added npm workspaces, Turborepo, strict TypeScript, ESLint, Prettier, and environment example.
- Added Platform API scaffold with health endpoint, auth endpoints, cookie sessions, database bootstrap, migrations, and seeders.
- Added Platform web scaffold with public home, status page, separate auth pages, Super Admin Desk, Staff Admin Desk, and Tenant Desk.
- Added `@codexsun/ui` as the first shared design system package.
- Added manual version and changelog tooling under `tools/version`.
