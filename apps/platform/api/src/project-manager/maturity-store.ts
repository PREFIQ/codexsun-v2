import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { AppError } from "@codexsun/framework/errors";

export type ProjectManagerMaturityKind =
  | "action"
  | "agent_note"
  | "activity"
  | "automation"
  | "changelog"
  | "coverage"
  | "discussion"
  | "github"
  | "issue"
  | "kanban"
  | "pull_request"
  | "release"
  | "review"
  | "security_quality"
  | "task"
  | "timeline"
  | "todo";

export type ProjectManagerMaturityRecord = {
  active: boolean;
  actor: string;
  assignee: string;
  command: string;
  createdAt: string;
  description: string;
  dueDate: string;
  eventName: string;
  githubBranch: string;
  githubCommit: string;
  githubIssue: string;
  githubPr: string;
  githubUrl: string;
  id: string;
  kind: ProjectManagerMaturityKind;
  key: string;
  labels: string[];
  lane: string;
  moduleGroupKey: string;
  moduleId: string;
  moduleKey: string;
  ownerTeam: string;
  platformKey: string;
  priority: string;
  referenceId: string;
  referenceType: string;
  reviewer: string;
  richNotes: string;
  severity: string;
  sortOrder: number;
  status: string;
  title: string;
  type: string;
  updatedAt: string;
  version: string;
};

type MaturityDatabase = Record<ProjectManagerMaturityKind, ProjectManagerMaturityRecord[]>;

const databaseDir = join(process.cwd(), "project-manager-json");

const files: Record<ProjectManagerMaturityKind, string> = {
  action: join(databaseDir, "action-registry.json"),
  agent_note: join(databaseDir, "agent-note-registry.json"),
  activity: join(databaseDir, "activity-registry.json"),
  automation: join(databaseDir, "automation-registry.json"),
  changelog: join(databaseDir, "changelog-registry.json"),
  coverage: join(databaseDir, "coverage-registry.json"),
  discussion: join(databaseDir, "discussion-registry.json"),
  github: join(databaseDir, "github-registry.json"),
  issue: join(databaseDir, "issue-board.json"),
  kanban: join(databaseDir, "kanban-board.json"),
  pull_request: join(databaseDir, "pull-request-registry.json"),
  release: join(databaseDir, "release-registry.json"),
  review: join(databaseDir, "review-registry.json"),
  security_quality: join(databaseDir, "security-quality-registry.json"),
  task: join(databaseDir, "task-registry.json"),
  timeline: join(databaseDir, "timeline-registry.json"),
  todo: join(databaseDir, "todo-registry.json")
};

const resultFile = join(databaseDir, "maturity-result.json");

export const projectManagerMaturityStore = {
  async list(kind: ProjectManagerMaturityKind) {
    const db = await loadDatabase();
    return db[kind].sort(byOrder);
  },

  async create(kind: ProjectManagerMaturityKind, input: Partial<ProjectManagerMaturityRecord>) {
    const db = await loadDatabase();
    const key = required(input.key, "key");
    const title = required(input.title, "title");
    if (db[kind].some((record) => same(record.key, key))) {
      throw AppError.conflict(`${kind} key already exists`);
    }
    const record = normalizeRecord(kind, { ...input, id: nextId(kind), key, title, createdAt: now(), updatedAt: now() });
    db[kind].push(record);
    await saveDatabase(db);
    return record;
  },

  async update(kind: ProjectManagerMaturityKind, id: string, input: Partial<ProjectManagerMaturityRecord>) {
    const db = await loadDatabase();
    const current = findById(db[kind], id, `${kind} record not found`);
    const next = normalizeRecord(kind, { ...current, ...defined(input), updatedAt: now() });
    if (db[kind].some((record) => record.id !== id && same(record.key, next.key))) {
      throw AppError.conflict(`${kind} key already exists`);
    }
    db[kind] = db[kind].map((record) => (record.id === id ? next : record));
    await saveDatabase(db);
    return next;
  },

  async setActive(kind: ProjectManagerMaturityKind, id: string, active: boolean) {
    return this.update(kind, id, { active });
  },

  async delete(kind: ProjectManagerMaturityKind, id: string) {
    const db = await loadDatabase();
    const current = findById(db[kind], id, `${kind} record not found`);
    db[kind] = db[kind].filter((record) => record.id !== id);
    await saveDatabase(db);
    return { deleted: true, id, title: current.title };
  },

  async command(command: string, context: Partial<ProjectManagerMaturityRecord>) {
    const db = await loadDatabase();
    const commandText = required(command, "command");
    const parsed = parseCommand(commandText);
    const automation = normalizeRecord("automation", {
      ...context,
      command: commandText,
      eventName: `automation.${parsed.system}.${parsed.action}`,
      id: nextId("automation"),
      key: `${parsed.system}.${parsed.action}.${Date.now()}`,
      status: "completed",
      title: `${parsed.system}:${parsed.action}`,
      type: parsed.system,
      createdAt: now(),
      updatedAt: now()
    });
    const activity = normalizeRecord("activity", {
      ...context,
      actor: context.actor ?? "system",
      command: commandText,
      eventName: "automation.command.completed",
      id: nextId("activity"),
      key: `activity.${automation.key}`,
      referenceId: automation.id,
      referenceType: "automation",
      status: "active",
      title: `Command completed: ${commandText}`,
      type: "automation",
      createdAt: now(),
      updatedAt: now()
    });
    const action = normalizeRecord("action", {
      ...context,
      actor: context.actor ?? "system",
      command: commandText,
      eventName: `action.${parsed.system}.${parsed.action}`,
      id: nextId("action"),
      key: `action.${automation.key}`,
      referenceId: automation.id,
      referenceType: "automation",
      status: "completed",
      title: `Action completed: ${commandText}`,
      type: parsed.system,
      createdAt: now(),
      updatedAt: now()
    });
    db.automation.push(automation);
    db.action.push(action);
    db.activity.push(activity);
    db.timeline.push(normalizeRecord("timeline", {
      ...activity,
      id: nextId("timeline"),
      key: `timeline.${automation.key}`,
      referenceType: "activity"
    }));
    if (parsed.system === "github") {
      const githubKey = `github.${parsed.action}.${Date.now()}`;
      db.github.push(normalizeRecord("github", {
        ...context,
        command: commandText,
        eventName: "github.reference.updated",
        id: nextId("github"),
        key: githubKey,
        referenceId: automation.id,
        referenceType: "automation",
        status: "active",
        title: parsed.action === "now" ? "Current GitHub reference" : `GitHub ${parsed.action}`,
        type: parsed.action,
        createdAt: now(),
        updatedAt: now()
      }));
      db.pull_request.push(normalizeRecord("pull_request", {
        ...context,
        command: commandText,
        eventName: "github.pull_request.synced",
        githubBranch: context.githubBranch ?? "github:now",
        githubCommit: context.githubCommit ?? "",
        githubPr: context.githubPr ?? "",
        githubUrl: context.githubUrl ?? "",
        id: nextId("pull_request"),
        key: `pr.${githubKey}`,
        referenceId: context.referenceId || automation.id,
        referenceType: context.referenceType || "automation",
        status: "synced",
        title: parsed.action === "now" ? "GitHub pull request snapshot" : `GitHub ${parsed.action} pull request`,
        type: "github",
        createdAt: now(),
        updatedAt: now()
      }));
    }
    await saveDatabase(db);
    return { activity, automation };
  },

  async result() {
    const db = await loadDatabase();
    return buildResult(db);
  }
};

async function loadDatabase(): Promise<MaturityDatabase> {
  await ensureFiles();
  return Object.fromEntries(await Promise.all(
    (Object.keys(files) as ProjectManagerMaturityKind[]).map(async (kind) => [kind, (await readJson<ProjectManagerMaturityRecord[]>(files[kind])).map((record) => normalizeRecord(kind, record))])
  )) as MaturityDatabase;
}

async function saveDatabase(db: MaturityDatabase) {
  await mkdir(databaseDir, { recursive: true });
  await Promise.all((Object.keys(files) as ProjectManagerMaturityKind[]).map((kind) => writeJson(files[kind], db[kind].sort(byOrder))));
  await writeJson(resultFile, buildResult(db));
}

async function ensureFiles() {
  await mkdir(databaseDir, { recursive: true });
  await Promise.all((Object.keys(files) as ProjectManagerMaturityKind[]).map((kind) => ensureJson(kind, files[kind], seedRecords(kind))));
  const db = Object.fromEntries(await Promise.all(
    (Object.keys(files) as ProjectManagerMaturityKind[]).map(async (kind) => [kind, await readJson<ProjectManagerMaturityRecord[]>(files[kind])])
  )) as MaturityDatabase;
  await writeJson(resultFile, buildResult(db));
}

async function ensureJson(kind: ProjectManagerMaturityKind, filePath: string, fallback: ProjectManagerMaturityRecord[]) {
  try {
    const existing = (await readJson<ProjectManagerMaturityRecord[]>(filePath)).map((record) => normalizeRecord(kind, record));
    const existingIds = new Set(existing.map((record) => record.id));
    await writeJson(filePath, [...existing, ...fallback.filter((record) => !existingIds.has(record.id))]);
  } catch {
    await writeJson(filePath, fallback);
  }
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

async function writeJson(filePath: string, data: unknown) {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function normalizeRecord(kind: ProjectManagerMaturityKind, input: Partial<ProjectManagerMaturityRecord>): ProjectManagerMaturityRecord {
  return {
    active: input.active ?? true,
    actor: input.actor ?? "",
    assignee: input.assignee ?? "",
    command: input.command ?? "",
    createdAt: input.createdAt ?? now(),
    description: input.description ?? "",
    dueDate: input.dueDate ?? "",
    eventName: input.eventName ?? "",
    githubBranch: input.githubBranch ?? "",
    githubCommit: input.githubCommit ?? "",
    githubIssue: input.githubIssue ?? "",
    githubPr: input.githubPr ?? "",
    githubUrl: input.githubUrl ?? "",
    id: required(input.id, "id"),
    kind,
    key: required(input.key, "key"),
    labels: Array.isArray(input.labels) ? input.labels : stringList(input.labels),
    lane: input.lane ?? defaultLane(kind),
    moduleGroupKey: input.moduleGroupKey ?? "",
    moduleId: input.moduleId ?? "",
    moduleKey: input.moduleKey ?? "",
    ownerTeam: input.ownerTeam ?? "",
    platformKey: input.platformKey ?? "",
    priority: input.priority ?? "medium",
    referenceId: input.referenceId ?? "",
    referenceType: input.referenceType ?? "",
    reviewer: input.reviewer ?? "",
    richNotes: input.richNotes ?? "",
    severity: input.severity ?? "",
    sortOrder: Number(input.sortOrder ?? 0),
    status: input.status ?? defaultStatus(kind),
    title: required(input.title, "title"),
    type: input.type ?? defaultType(kind),
    updatedAt: input.updatedAt ?? now(),
    version: input.version ?? ""
  };
}

function seedRecords(kind: ProjectManagerMaturityKind): ProjectManagerMaturityRecord[] {
  const rows: Partial<ProjectManagerMaturityRecord>[] = {
    action: [{ key: "action.github.now", title: "Run github:now automation", command: "github:now", eventName: "automation.github.now", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", type: "automation", status: "ready" }],
    agent_note: [{ key: "agent.project-manager.context", title: "Project Manager context note", actor: "codex", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", type: "implementation-note", status: "active" }],
    activity: [{ key: "activity.project-manager.started", title: "Project Manager maturity layer started", eventName: "project_manager.maturity.started", actor: "system", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", type: "system" }],
    automation: [{ key: "automation.github.now", title: "github:now", command: "github:now", eventName: "automation.github.now", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", type: "github" }],
    changelog: [{ key: "changelog.v1.0.0.project-manager", title: "Project Manager maturity foundation", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", type: "Added", version: "v1.0.0" }],
    coverage: [{ key: "coverage.tenant.api", title: "Tenant API operation coverage", platformKey: "super-admin", moduleGroupKey: "admin", moduleId: "module-sa-tenant", moduleKey: "tenant", type: "api", status: "needs-review" }],
    discussion: [{ key: "discussion.project-manager.registry-truth", title: "How Project Manager becomes development truth", assignee: "Platform", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", type: "architecture", status: "open" }],
    github: [{ key: "github.project-manager.placeholder", title: "Project Manager GitHub reference placeholder", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", type: "reference" }],
    issue: [{ key: "issue.project-manager.coverage-dashboard", title: "Build Project Manager coverage dashboard", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", type: "enhancement", status: "planned" }],
    kanban: [{ key: "kanban.project-manager.registry", title: "Complete registry truth phase", lane: "In Progress", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", type: "feature" }],
    pull_request: [{ key: "pr.project-manager.maturity", title: "Project Manager maturity implementation", githubBranch: "codex/project-manager-maturity", githubPr: "", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", type: "feature", status: "draft" }],
    release: [{ key: "release.v1.0.0.project-manager", title: "Project Manager maturity foundation", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", type: "release", status: "planned", version: "v1.0.0" }],
    review: [{ key: "review.tenant.api.coverage", title: "Review Tenant API coverage", platformKey: "super-admin", moduleGroupKey: "admin", moduleId: "module-sa-tenant", moduleKey: "tenant", reviewer: "Platform", type: "api-contract", status: "requested" }],
    security_quality: [{ key: "quality.permissions.audit", title: "Permission and audit coverage review", platformKey: "super-admin", moduleGroupKey: "admin", moduleId: "module-sa-tenant", moduleKey: "tenant", type: "security", severity: "high", status: "needs-review" }],
    task: [{ key: "task.project-manager.maturity", title: "Implement maturity workspace", assignee: "Platform", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", type: "feature", status: "in-progress" }],
    timeline: [{ key: "timeline.project-manager.maturity-start", title: "Maturity workspace added to Project Manager", eventName: "project_manager.timeline.started", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", type: "activity" }],
    todo: [{ key: "todo.project-manager.github-now", title: "Wire github:now to real GitHub connector", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", priority: "high", type: "automation", status: "open" }]
  }[kind];
  return rows.map((row, index) => normalizeRecord(kind, { ...row, id: `${kind}-seed-${index + 1}`, sortOrder: (index + 1) * 10 }));
}

function buildResult(db: MaturityDatabase) {
  return {
    generatedAt: now(),
    ...db
  };
}

function parseCommand(command: string) {
  const head = command.trim().split(/\s+/, 1)[0] ?? "command:run";
  const [system = "command", action = "run"] = head.split(":");
  return { action, system };
}

function defaultLane(kind: ProjectManagerMaturityKind) {
  if (kind === "kanban") return "Backlog";
  return "";
}

function defaultStatus(kind: ProjectManagerMaturityKind) {
  if (kind === "review") return "requested";
  if (kind === "issue" || kind === "discussion" || kind === "todo") return "open";
  if (kind === "pull_request") return "draft";
  if (kind === "security_quality") return "needs-review";
  if (kind === "release") return "planned";
  return "active";
}

function defaultType(kind: ProjectManagerMaturityKind) {
  return kind;
}

function findById<T extends { id: string }>(records: T[], id: string, message: string): T {
  const record = records.find((item) => item.id === id);
  if (!record) throw AppError.notFound(message);
  return record;
}

function required(value: unknown, fieldName: string) {
  if (typeof value !== "string" || !value.trim()) throw AppError.validation(`${fieldName} is required`);
  return value.trim();
}

function defined<T extends Record<string, unknown>>(input: T): Partial<T> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as Partial<T>;
}

function stringList(value: unknown) {
  if (typeof value !== "string") return [];
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function same(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function now() {
  return new Date().toISOString();
}

function nextId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function byOrder(a: { sortOrder?: number; title: string }, b: { sortOrder?: number; title: string }) {
  return Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0) || a.title.localeCompare(b.title);
}
