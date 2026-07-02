import { existsSync } from "node:fs";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
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
  | "gantt"
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
  endDate: string;
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
  startDate: string;
  status: string;
  title: string;
  type: string;
  updatedAt: string;
  version: string;
};

type MaturityDatabase = Record<ProjectManagerMaturityKind, ProjectManagerMaturityRecord[]>;

const repoRelativeDatabaseDir = join(process.cwd(), "apps/platform/api/project-manager-json");
const databaseDir = process.env.PROJECT_MANAGER_JSON_DIR ?? (existsSync(repoRelativeDatabaseDir) ? repoRelativeDatabaseDir : join(process.cwd(), "project-manager-json"));

const files: Record<ProjectManagerMaturityKind, string> = {
  action: join(databaseDir, "maturity-action-registry.json"),
  agent_note: join(databaseDir, "agent-note-registry.json"),
  activity: join(databaseDir, "activity-registry.json"),
  automation: join(databaseDir, "automation-registry.json"),
  changelog: join(databaseDir, "changelog-registry.json"),
  coverage: join(databaseDir, "coverage-registry.json"),
  discussion: join(databaseDir, "discussion-registry.json"),
  gantt: join(databaseDir, "gantt-registry.json"),
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
const automationInboxFile = join(databaseDir, "automation.md");
const automationLogFile = join(databaseDir, "automation-log.md");
let ensureFilesPromise: Promise<void> | null = null;

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
    applyWorkflowSideEffects(db, kind, record, "created");
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
    applyWorkflowSideEffects(db, kind, next, "updated");
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

  async communicationReference(kind: ProjectManagerMaturityKind, input: Partial<ProjectManagerMaturityRecord>) {
    const db = await loadDatabase();
    const key = required(input.key, "key");
    const title = required(input.title, "title");
    const timestamp = now();
    const referenceNo = input.referenceId || key;
    const stage = workflowStageLabel(kind);
    const block = [
      "",
      `## ${stage}: ${key}`,
      "",
      `- [ ] Reference no: \`${referenceNo}\``,
      `- [ ] Stage: ${stage}`,
      `- [ ] Title: ${title}`,
      `- [ ] Status: ${input.status || "open"}`,
      `- [ ] Source: Project Manager / Work & Automation`,
      `- [ ] Requested at: ${timestamp}`,
      "",
      "### Codex Plan",
      "",
      "- Read this reference from Project Manager.",
      "- Solve or update the related work.",
      "- Update Timeline and Gantt after work is done.",
      "- Move completed notes into `automation-log.md` and clean this pending block.",
      ""
    ].join("\n");
    await ensureCommunicationFiles();
    await appendFile(automationInboxFile, block, "utf8");
    await appendFile(automationLogFile, `${timestamp} | queued | ${stage} | ${key} | ${title}\n`, "utf8");
    const timeline = normalizeRecord("timeline", {
      ...input,
      active: true,
      actor: "codex-bridge",
      createdAt: timestamp,
      endDate: input.endDate || input.dueDate || input.startDate || "",
      eventName: "project_manager.communication.queued",
      id: nextId("timeline"),
      key: `timeline.communication.${kind}.${key}.${Date.now()}`,
      referenceId: key,
      referenceType: kind,
      sortOrder: nextSortOrder(db.timeline),
      startDate: input.startDate || input.dueDate || input.endDate || "",
      status: "queued",
      title: `Automation inbox queued: ${title}`,
      type: "communication",
      updatedAt: timestamp
    });
    db.timeline.push(timeline);
    upsertGanttRecord(db, kind, normalizeRecord(kind, {
      ...input,
      id: input.id || nextId(kind),
      key,
      title,
      status: input.status || "queued",
      createdAt: timestamp,
      updatedAt: timestamp
    }), timestamp);
    await saveDatabase(db);
    return { file: automationInboxFile, logFile: automationLogFile, referenceNo, timeline };
  },

  async result() {
    const db = await loadDatabase();
    return buildResult(db);
  }
};

async function loadDatabase(): Promise<MaturityDatabase> {
  await ensureFilesReady();
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
  await ensureCommunicationFiles();
}

async function ensureCommunicationFiles() {
  await mkdir(databaseDir, { recursive: true });
  if (!existsSync(automationInboxFile)) {
    await writeFile(automationInboxFile, [
      "# Project Manager Automation Inbox",
      "",
      "This is the communication point between the user and Codex.",
      "",
      "When the user asks Codex to solve Project Manager issues, Codex should:",
      "",
      "1. Read this file.",
      "2. Use each pending reference number to inspect Project Manager context.",
      "3. Plan and do the work.",
      "4. Update Timeline and Gantt.",
      "5. Move completed notes to `automation-log.md`.",
      "6. Clean completed pending blocks from this file.",
      ""
    ].join("\n"), "utf8");
  }
  if (!existsSync(automationLogFile)) {
    await writeFile(automationLogFile, "# Project Manager Automation Log\n\n", "utf8");
  }
}

async function ensureFilesReady() {
  ensureFilesPromise ??= ensureFiles().catch((error) => {
    ensureFilesPromise = null;
    throw error;
  });
  await ensureFilesPromise;
}

async function ensureJson(kind: ProjectManagerMaturityKind, filePath: string, fallback: ProjectManagerMaturityRecord[]) {
  try {
    const existing = (await readJson<ProjectManagerMaturityRecord[]>(filePath)).map((record) => normalizeRecord(kind, record));
    const existingKeys = new Set(existing.map((record) => record.key.toLowerCase()));
    const missing = fallback.filter((record) => !existingKeys.has(record.key.toLowerCase()));
    if (missing.length) {
      await writeJson(filePath, [...existing, ...missing]);
    }
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
    endDate: input.endDate ?? "",
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
    startDate: input.startDate ?? "",
    status: input.status ?? defaultStatus(kind),
    title: required(input.title, "title"),
    type: input.type ?? defaultType(kind),
    updatedAt: input.updatedAt ?? now(),
    version: input.version ?? ""
  };
}

function seedRecords(kind: ProjectManagerMaturityKind): ProjectManagerMaturityRecord[] {
  const workflowRows = workflowSeedRecords(kind);
  if (workflowRows) {
    return workflowRows.map((row, index) => normalizeRecord(kind, { ...row, id: `${kind}-seed-${index + 1}`, sortOrder: (index + 1) * 10 }));
  }
  const rows: Partial<ProjectManagerMaturityRecord>[] = {
    action: [{ key: "action.github.now", title: "Run github:now automation", command: "github:now", eventName: "automation.github.now", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", type: "automation", status: "ready" }],
    agent_note: [{ key: "agent.project-manager.context", title: "Project Manager context note", actor: "codex", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", type: "implementation-note", status: "active" }],
    activity: [
      { key: "activity.project-manager.started", title: "Project Manager maturity layer started", eventName: "project_manager.maturity.started", actor: "system", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", type: "system" },
      { key: "activity1.1.1.1", title: "Record API discovery activity", actor: "codex", eventName: "workflow.activity.api-discovery", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", referenceId: "automation1.1.1.1", referenceType: "automation", startDate: "2026-07-08", endDate: "2026-07-08", type: "implementation", status: "completed" },
      { key: "activity1.1.2.1", title: "Record UI validation activity", actor: "codex", eventName: "workflow.activity.ui-validation", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", referenceId: "automation1.1.2.1", referenceType: "automation", startDate: "2026-07-09", endDate: "2026-07-09", type: "validation", status: "active" },
      { key: "activity1.2.1.1", title: "Record report wiring activity", actor: "codex", eventName: "workflow.activity.report-wiring", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", referenceId: "automation1.2.1.1", referenceType: "automation", startDate: "2026-07-10", endDate: "2026-07-10", type: "implementation", status: "active" }
    ],
    automation: [
      { key: "automation.github.now", title: "github:now", command: "github:now", eventName: "automation.github.now", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", type: "github" },
      { key: "automation1.1.1.1", title: "Prepare API scan automation", command: "project-manager:scan-api issue-1 task1.1", eventName: "workflow.automation.api-scan", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", referenceId: "review1.1.1", referenceType: "review", startDate: "2026-07-08", endDate: "2026-07-08", type: "scan", status: "completed" },
      { key: "automation1.1.2.1", title: "Prepare UI validation automation", command: "project-manager:validate-ui issue-1 task1.1", eventName: "workflow.automation.ui-validation", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", referenceId: "review1.1.2", referenceType: "review", startDate: "2026-07-09", endDate: "2026-07-09", type: "validation", status: "ready" },
      { key: "automation1.2.1.1", title: "Prepare report binding automation", command: "project-manager:bind-report issue-1 task1.2", eventName: "workflow.automation.report-binding", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", referenceId: "review1.2.1", referenceType: "review", startDate: "2026-07-10", endDate: "2026-07-10", type: "binding", status: "ready" }
    ],
    changelog: [{ key: "changelog.v1.0.0.project-manager", title: "Project Manager maturity foundation", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", type: "Added", version: "v1.0.0" }],
    coverage: [{ key: "coverage.tenant.api", title: "Tenant API operation coverage", platformKey: "super-admin", moduleGroupKey: "admin", moduleId: "module-sa-tenant", moduleKey: "tenant", type: "api", status: "needs-review" }],
    discussion: [{ key: "discussion.project-manager.registry-truth", title: "How Project Manager becomes development truth", assignee: "Platform", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", referenceId: "issue-1", referenceType: "issue", type: "architecture", status: "open" }],
    gantt: [{ key: "gantt.project-manager.work-sequence", title: "Project Manager work sequence", assignee: "Platform", dueDate: "2026-07-10", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", priority: "high", type: "delivery", status: "in-progress" }],
    github: [{ key: "github.project-manager.placeholder", title: "Project Manager GitHub reference placeholder", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", type: "reference" }],
    issue: [
      { key: "issue.project-manager.coverage-dashboard", title: "Build Project Manager coverage dashboard", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", type: "enhancement", status: "planned" },
      { key: "issue-1", title: "Issue 1 - Project Manager live workflow test", assignee: "Platform", reviewer: "Lead", labels: ["workflow", "test"], platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", priority: "high", severity: "medium", startDate: "2026-07-06", endDate: "2026-07-12", type: "enhancement", status: "in-progress" }
    ],
    kanban: [{ key: "kanban.project-manager.registry", title: "Complete registry truth phase", lane: "In Progress", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", type: "feature" }],
    pull_request: [{ key: "pr.project-manager.maturity", title: "Project Manager maturity implementation", githubBranch: "codex/project-manager-maturity", githubPr: "", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", type: "feature", status: "draft" }],
    release: [{ key: "release.v1.0.0.project-manager", title: "Project Manager maturity foundation", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", type: "release", status: "planned", version: "v1.0.0" }],
    review: [
      { key: "review.tenant.api.coverage", title: "Review Tenant API coverage", platformKey: "super-admin", moduleGroupKey: "admin", moduleId: "module-sa-tenant", moduleKey: "tenant", reviewer: "Platform", type: "api-contract", status: "requested" },
      { key: "review1.1.1", title: "Review 1.1.1 - API coverage data", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", referenceId: "task1.1", referenceType: "task", reviewer: "Lead", startDate: "2026-07-08", endDate: "2026-07-08", type: "api-review", status: "approved" },
      { key: "review1.1.2", title: "Review 1.1.2 - UI drill-down behavior", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", referenceId: "task1.1", referenceType: "task", reviewer: "QA", startDate: "2026-07-08", endDate: "2026-07-09", type: "ui-review", status: "in-review" },
      { key: "review1.2.1", title: "Review 1.2.1 - Timeline and Gantt report", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", referenceId: "task1.2", referenceType: "task", reviewer: "Product", startDate: "2026-07-09", endDate: "2026-07-10", type: "report-review", status: "requested" }
    ],
    security_quality: [{ key: "quality.permissions.audit", title: "Permission and audit coverage review", platformKey: "super-admin", moduleGroupKey: "admin", moduleId: "module-sa-tenant", moduleKey: "tenant", type: "security", severity: "high", status: "needs-review" }],
    task: [
      { key: "task.project-manager.maturity", title: "Implement maturity workspace", assignee: "Platform", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", type: "feature", status: "in-progress" },
      { key: "task1.1", title: "Task 1.1 - Plan workflow registry", assignee: "Platform", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", priority: "high", referenceId: "issue-1", referenceType: "issue", startDate: "2026-07-06", endDate: "2026-07-08", type: "planning", status: "in-progress" },
      { key: "task1.2", title: "Task 1.2 - Build timeline and Gantt reporting", assignee: "Platform", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", priority: "medium", referenceId: "issue-1", referenceType: "issue", startDate: "2026-07-08", endDate: "2026-07-11", type: "implementation", status: "assigned" }
    ],
    timeline: [{ key: "timeline.project-manager.maturity-start", title: "Maturity workspace added to Project Manager", eventName: "project_manager.timeline.started", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", type: "activity" }],
    todo: [{ key: "todo.project-manager.github-now", title: "Wire github:now to real GitHub connector", platformKey: "super-admin", moduleGroupKey: "project-manager", moduleId: "module-sa-platform-registry", moduleKey: "project-manager", priority: "high", type: "automation", status: "open" }]
  }[kind];
  return rows.map((row, index) => normalizeRecord(kind, { ...row, id: `${kind}-seed-${index + 1}`, sortOrder: (index + 1) * 10 }));
}

function workflowSeedRecords(kind: ProjectManagerMaturityKind): Partial<ProjectManagerMaturityRecord>[] | null {
  const liveEmptyKinds: ProjectManagerMaturityKind[] = [
    "action",
    "agent_note",
    "activity",
    "automation",
    "changelog",
    "coverage",
    "discussion",
    "gantt",
    "github",
    "issue",
    "kanban",
    "pull_request",
    "release",
    "review",
    "security_quality",
    "task",
    "timeline",
    "todo"
  ];
  return liveEmptyKinds.includes(kind) ? [] : null;
}

function buildResult(db: MaturityDatabase) {
  return {
    generatedAt: now(),
    ...db
  };
}

function applyWorkflowSideEffects(db: MaturityDatabase, kind: ProjectManagerMaturityKind, record: ProjectManagerMaturityRecord, action: "created" | "updated") {
  if (!isWorkflowKind(kind)) return;
  const eventTime = now();
  const title = workflowEventTitle(kind, record, action);
  db.timeline.push(normalizeRecord("timeline", {
    ...record,
    active: true,
    actor: record.actor || record.assignee || record.reviewer || "system",
    createdAt: eventTime,
    endDate: record.endDate || record.dueDate || record.startDate,
    eventName: `project_manager.workflow.${kind}.${action}`,
    id: nextId("timeline"),
    key: `timeline.${kind}.${record.key}.${Date.now()}.${Math.random().toString(36).slice(2, 5)}`,
    referenceId: record.key,
    referenceType: kind,
    sortOrder: nextSortOrder(db.timeline),
    startDate: record.startDate || record.dueDate || record.endDate,
    status: workflowTimelineStatus(record),
    title,
    type: "workflow",
    updatedAt: eventTime
  }));
  upsertGanttRecord(db, kind, record, eventTime);
}

function upsertGanttRecord(db: MaturityDatabase, kind: ProjectManagerMaturityKind, record: ProjectManagerMaturityRecord, eventTime: string) {
  const key = `gantt.${kind}.${record.key}`;
  const current = db.gantt.find((item) => same(item.key, key));
  const next = normalizeRecord("gantt", {
    ...(current ?? {}),
    ...record,
    active: record.active,
    assignee: record.assignee || record.reviewer || record.ownerTeam,
    createdAt: current?.createdAt ?? eventTime,
    dueDate: record.dueDate || record.endDate || record.startDate,
    endDate: record.endDate || record.dueDate || record.startDate,
    eventName: `project_manager.gantt.${kind}`,
    id: current?.id ?? nextId("gantt"),
    key,
    referenceId: record.key,
    referenceType: kind,
    sortOrder: current?.sortOrder ?? nextSortOrder(db.gantt),
    startDate: record.startDate || record.dueDate || record.endDate,
    status: workflowGanttStatus(record),
    title: `${workflowStageLabel(kind)}: ${record.title}`,
    type: "workflow",
    updatedAt: eventTime
  });
  if (current) db.gantt = db.gantt.map((item) => (item.id === current.id ? next : item));
  else db.gantt.push(next);
}

function isWorkflowKind(kind: ProjectManagerMaturityKind) {
  return workflowKinds().includes(kind);
}

function workflowKinds(): ProjectManagerMaturityKind[] {
  return ["issue", "task", "review", "automation", "activity"];
}

function workflowEventTitle(kind: ProjectManagerMaturityKind, record: ProjectManagerMaturityRecord, action: "created" | "updated") {
  const actionLabel = action === "created" ? "created" : "updated";
  if (kind === "issue") return `Issue ${actionLabel}: ${record.title}`;
  if (kind === "task") return `Task planned: ${record.title}`;
  if (kind === "review") return `Review ${actionLabel}: ${record.title}`;
  if (kind === "automation") return `Automation prepared: ${record.title}`;
  if (kind === "activity") return `Activity recorded: ${record.title}`;
  return `${workflowStageLabel(kind)} ${actionLabel}: ${record.title}`;
}

function workflowStageLabel(kind: ProjectManagerMaturityKind) {
  if (kind === "issue") return "Issue";
  if (kind === "task") return "Task";
  if (kind === "review") return "Review";
  if (kind === "automation") return "Automation";
  if (kind === "activity") return "Activity";
  return kind;
}

function workflowTimelineStatus(record: ProjectManagerMaturityRecord) {
  if (["completed", "done", "released", "approved"].includes(record.status)) return "completed";
  return record.status || "active";
}

function workflowGanttStatus(record: ProjectManagerMaturityRecord) {
  if (["completed", "done", "released", "approved"].includes(record.status)) return "completed";
  if (["in-progress", "active", "assigned", "ready", "in-review"].includes(record.status)) return "in-progress";
  if (record.status === "blocked") return "blocked";
  return record.status || "planned";
}

function nextSortOrder(records: Array<{ sortOrder?: number }>) {
  return Math.max(0, ...records.map((record) => Number(record.sortOrder) || 0)) + 10;
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
  if (kind === "gantt") return "planned";
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
