import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { AppError } from "@codexsun/framework/errors";

export type DesignSystemItemKind = "component" | "control" | "template";

export type DesignSystemRecord = {
  active: boolean;
  category: string;
  componentKey: string;
  controlType: string;
  defaultProps: Record<string, unknown>;
  description: string;
  id: string;
  kind: DesignSystemItemKind;
  name: string;
  templateScreen: string;
  updatedAt: string;
  usageNotes: string;
  variant: string;
};

type DesignSystemDatabase = {
  components: DesignSystemRecord[];
  controls: DesignSystemRecord[];
  templates: DesignSystemRecord[];
};

const repoRelativeDatabaseDir = join(process.cwd(), "apps/platform/api/design-system-json");
const databaseDir = process.env.DESIGN_SYSTEM_JSON_DIR ?? (existsSync(repoRelativeDatabaseDir) ? repoRelativeDatabaseDir : join(process.cwd(), "design-system-json"));
const componentFile = join(databaseDir, "component-registry.json");
const controlFile = join(databaseDir, "control-registry.json");
const templateFile = join(databaseDir, "template-screen-registry.json");
const resultFile = join(databaseDir, "result.json");

export const designSystemStore = {
  async list(kind: DesignSystemItemKind) {
    const db = await loadDatabase();
    return bucket(db, kind).sort(byUpdated);
  },

  async create(kind: DesignSystemItemKind, input: Partial<DesignSystemRecord>) {
    const db = await loadDatabase();
    const componentKey = required(input.componentKey, "componentKey");
    const name = required(input.name, "name");
    const records = bucket(db, kind);
    if (records.some((record) => same(record.componentKey, componentKey))) {
      throw AppError.conflict(`${label(kind)} key already exists`);
    }
    const record = normalize(kind, {
      ...input,
      active: input.active ?? true,
      componentKey,
      id: nextId(kind),
      name,
      updatedAt: now()
    });
    records.unshift(record);
    await saveDatabase(db);
    return record;
  },

  async update(kind: DesignSystemItemKind, id: string, input: Partial<DesignSystemRecord>) {
    const db = await loadDatabase();
    const records = bucket(db, kind);
    const current = findById(records, id, `${label(kind)} not found`);
    const next = normalize(kind, { ...current, ...defined(input), id, updatedAt: now() });
    if (records.some((record) => record.id !== id && same(record.componentKey, next.componentKey))) {
      throw AppError.conflict(`${label(kind)} key already exists`);
    }
    replaceBucket(db, kind, records.map((record) => (record.id === id ? next : record)));
    await saveDatabase(db);
    return next;
  },

  async setActive(kind: DesignSystemItemKind, id: string, active: boolean) {
    return this.update(kind, id, { active });
  },

  async delete(kind: DesignSystemItemKind, id: string) {
    const db = await loadDatabase();
    const records = bucket(db, kind);
    const current = findById(records, id, `${label(kind)} not found`);
    replaceBucket(db, kind, records.filter((record) => record.id !== id));
    await saveDatabase(db);
    return { deleted: true, id, name: current.name };
  },

  async result() {
    const db = await loadDatabase();
    return buildResult(db);
  }
};

export function designSystemKind(value: string): DesignSystemItemKind {
  if (value === "components" || value === "component") return "component";
  if (value === "controls" || value === "control") return "control";
  if (value === "templates" || value === "template") return "template";
  throw AppError.validation("Unknown design system registry kind");
}

async function loadDatabase(): Promise<DesignSystemDatabase> {
  await ensureFiles();
  return {
    components: await readJson<DesignSystemRecord[]>(componentFile),
    controls: await readJson<DesignSystemRecord[]>(controlFile),
    templates: await readJson<DesignSystemRecord[]>(templateFile)
  };
}

async function saveDatabase(db: DesignSystemDatabase) {
  await mkdir(databaseDir, { recursive: true });
  await writeJson(componentFile, db.components.sort(byUpdated));
  await writeJson(controlFile, db.controls.sort(byUpdated));
  await writeJson(templateFile, db.templates.sort(byUpdated));
  await writeJson(resultFile, buildResult(db));
}

async function ensureFiles() {
  await mkdir(databaseDir, { recursive: true });
  await ensureRecordJson(componentFile, seed("component"));
  await ensureRecordJson(controlFile, seed("control"));
  await ensureRecordJson(templateFile, seed("template"));
}

async function ensureJson<T>(filePath: string, fallback: T) {
  try {
    await readFile(filePath, "utf8");
  } catch {
    await writeJson(filePath, fallback);
  }
}

async function ensureRecordJson(filePath: string, fallback: DesignSystemRecord[]) {
  try {
    const existing = await readJson<DesignSystemRecord[]>(filePath);
    const existingKeys = new Set(existing.map((record) => `${record.kind}:${record.componentKey}`));
    const missing = fallback.filter((record) => !existingKeys.has(`${record.kind}:${record.componentKey}`));
    if (missing.length) {
      await writeJson(filePath, [...existing, ...missing]);
    }
  } catch {
    await ensureJson(filePath, fallback);
  }
}

async function readJson<T>(filePath: string): Promise<T> {
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content) as T;
}

async function writeJson(filePath: string, value: unknown) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function bucket(db: DesignSystemDatabase, kind: DesignSystemItemKind) {
  if (kind === "component") return db.components;
  if (kind === "control") return db.controls;
  return db.templates;
}

function replaceBucket(db: DesignSystemDatabase, kind: DesignSystemItemKind, records: DesignSystemRecord[]) {
  if (kind === "component") db.components = records;
  else if (kind === "control") db.controls = records;
  else db.templates = records;
}

function normalize(kind: DesignSystemItemKind, input: Partial<DesignSystemRecord>): DesignSystemRecord {
  return {
    active: input.active ?? true,
    category: input.category ?? (kind === "component" ? "Foundations" : kind === "control" ? "Controls" : "Templates"),
    componentKey: required(input.componentKey, "componentKey"),
    controlType: input.controlType ?? (kind === "control" ? "text" : ""),
    defaultProps: objectValue(input.defaultProps),
    description: input.description ?? "",
    id: input.id ?? nextId(kind),
    kind,
    name: required(input.name, "name"),
    templateScreen: input.templateScreen ?? "",
    updatedAt: input.updatedAt ?? now(),
    usageNotes: input.usageNotes ?? "",
    variant: input.variant ?? "default"
  };
}

function seed(kind: DesignSystemItemKind): DesignSystemRecord[] {
  const updatedAt = now();
  const rows: Array<{ category: string; componentKey: string; controlTypeOrScreen: string; description: string; id: string; name: string }> = kind === "component"
    ? componentSeedRows()
    : kind === "control"
      ? controlSeedRows()
      : templateSeedRows();
  return rows.map(({ category, componentKey, controlTypeOrScreen, description, id, name }) =>
    normalize(kind, {
      category,
      componentKey,
      controlType: kind === "control" ? controlTypeOrScreen : "",
      defaultProps: {},
      description,
      id,
      name,
      templateScreen: kind === "template" ? controlTypeOrScreen : "",
      updatedAt,
      usageNotes: kind === "template" ? "Use as a template-screen source for new module pages." : "Reusable through the Design System manager.",
      variant: "default"
    })
  );
}

function componentSeedRows() {
  const names = [
    ["accordion", "Disclosure", "Stacked expandable content sections."],
    ["alert", "Feedback", "Inline feedback, warnings, and status messages."],
    ["alert-dialog", "Overlay", "Blocking confirmation and destructive-action dialogs."],
    ["aspect-ratio", "Media", "Stable visual ratio container for images and previews."],
    ["avatar", "Identity", "User, tenant, or entity identity image/fallback."],
    ["badge", "Feedback", "Compact status, category, and metadata labels."],
    ["breadcrumb", "Navigation", "Hierarchical location trail."],
    ["button", "Action", "Primary, secondary, outline, ghost, destructive, and icon actions."],
    ["button-group", "Action", "Grouped related command buttons."],
    ["calendar", "Date", "Calendar date picking surface."],
    ["card", "Surfaces", "Reusable bounded surfaces for repeated items and dialogs."],
    ["carousel", "Media", "Sequential media or item browsing."],
    ["chart", "Data", "Chart container and visual data helpers."],
    ["checkbox", "Control", "Boolean or multi-select control."],
    ["collapsible", "Disclosure", "Single-section show/hide behavior."],
    ["command", "Navigation", "Command palette and searchable action picker."],
    ["context-menu", "Menu", "Right-click contextual command menu."],
    ["dialog", "Overlay", "Modal task and edit surface."],
    ["drawer", "Overlay", "Edge panel for focused workflows."],
    ["dropdown-menu", "Menu", "Button-triggered menu actions."],
    ["empty", "Feedback", "No-data or no-results state."],
    ["field", "Form", "Field wrapper and label pattern."],
    ["global-loader", "Feedback", "App-level loading state."],
    ["hover-card", "Overlay", "Hover-triggered detail preview."],
    ["input", "Form", "Single-line text input."],
    ["input-group", "Form", "Input with prefix, suffix, or grouped action."],
    ["input-otp", "Form", "One-time-passcode segmented input."],
    ["item", "List", "Reusable list item layout."],
    ["kbd", "Typography", "Keyboard shortcut display."],
    ["label", "Form", "Accessible field label."],
    ["menubar", "Menu", "Application menubar pattern."],
    ["navigation-menu", "Navigation", "Top-level navigation menu."],
    ["pagination", "Navigation", "Paged list navigation."],
    ["popover", "Overlay", "Anchored non-modal panel."],
    ["progress", "Feedback", "Progress and completion indicator."],
    ["radio-group", "Control", "Mutually exclusive option set."],
    ["resizable", "Layout", "Resizable split-pane layout."],
    ["scroll-area", "Layout", "Styled constrained scroll region."],
    ["select", "Control", "Controlled option picker for finite values."],
    ["separator", "Layout", "Visual divider."],
    ["sheet", "Overlay", "Side sheet workflow surface."],
    ["sidebar", "Navigation", "Application side navigation shell."],
    ["skeleton", "Feedback", "Loading placeholder."],
    ["slider", "Control", "Range and numeric adjustment control."],
    ["sonner", "Feedback", "Toast notification renderer."],
    ["spinner", "Feedback", "Inline loading spinner."],
    ["status-badge", "Feedback", "Tone-aware status label."],
    ["switch", "Control", "Binary setting toggle."],
    ["table", "Data", "Structured rows and columns."],
    ["tabs", "Navigation", "Tabbed content switcher."],
    ["textarea", "Form", "Multi-line text input."],
    ["toast", "Feedback", "Toast notification model."],
    ["toggle", "Control", "Pressed/unpressed control button."],
    ["toggle-group", "Control", "Single or multiple toggle group."],
    ["tooltip", "Overlay", "Hover/focus help label."]
  ] as const;
  return names.map(([componentKey, category, description]) => ({
    category,
    componentKey,
    controlTypeOrScreen: "default",
    description,
    id: `ds-component-${componentKey}`,
    name: titleFromKey(componentKey)
  }));
}

function controlSeedRows() {
  const names = [
    ["button-control", "Action", "Button", "Command trigger with variants, size, icon, loading, and disabled behavior."],
    ["text-input", "Form", "Text", "Single-line text entry with label, helper, required, disabled, and validation states."],
    ["textarea-control", "Form", "Textarea", "Multi-line notes entry with required, disabled, and validation states."],
    ["select-control", "Choice", "Select", "Controlled option picker with placeholder and disabled behavior."],
    ["checkbox-control", "Choice", "Checkbox", "Boolean or multi-select field with checked and disabled states."],
    ["switch-control", "Choice", "Switch", "Binary setting or active-state toggle."],
    ["radio-control", "Choice", "Radio", "Mutually exclusive option group."],
    ["slider-control", "Numeric", "Slider", "Numeric range and step-based adjustment."],
    ["tabs-control", "Navigation", "Tabs", "View switching control with active state."],
    ["date-control", "Date", "Calendar", "Calendar-based date selection control."],
    ["otp-control", "Form", "OTP", "Segmented one-time-code entry."]
  ] as const;
  return names.map(([componentKey, category, controlTypeOrScreen, description]) => ({
    category,
    componentKey,
    controlTypeOrScreen,
    description,
    id: `ds-control-${componentKey}`,
    name: titleFromKey(componentKey)
  }));
}

function templateSeedRows() {
  const names = [
    ["common-list-template", "Common List", "Reusable compact master-data list screen."],
    ["master-list-template", "Master List", "Reusable master registry list screen."],
    ["entry-list-template", "Entry List", "Reusable transaction entry list screen."],
    ["control-builder-template", "Control Builder", "Reusable control variant editor and preview screen."],
    ["theme-builder-template", "Theme Builder", "Reusable token, palette, and density management screen."]
  ] as const;
  return names.map(([componentKey, templateScreen, description]) => ({
    category: "Templates",
    componentKey,
    controlTypeOrScreen: templateScreen,
    description,
    id: `ds-template-${componentKey}`,
    name: titleFromKey(componentKey)
  }));
}

function titleFromKey(value: string) {
  return value.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function buildResult(db: DesignSystemDatabase) {
  return {
    components: db.components,
    controls: db.controls,
    templates: db.templates,
    totals: {
      active: [...db.components, ...db.controls, ...db.templates].filter((record) => record.active).length,
      components: db.components.length,
      controls: db.controls.length,
      templates: db.templates.length
    }
  };
}

function findById<T extends { id: string }>(records: T[], id: string, message: string) {
  const record = records.find((item) => item.id === id);
  if (!record) throw AppError.notFound(message);
  return record;
}

function required(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) throw AppError.validation(`${field} is required`);
  return value.trim();
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function defined<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}

function nextId(kind: DesignSystemItemKind) {
  return `ds-${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function now() {
  return new Date().toISOString();
}

function same(left = "", right = "") {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function byUpdated(a: DesignSystemRecord, b: DesignSystemRecord) {
  return b.updatedAt.localeCompare(a.updatedAt);
}

function label(kind: DesignSystemItemKind) {
  if (kind === "component") return "Component registry record";
  if (kind === "control") return "Control registry record";
  return "Template screen registry record";
}
