import { AppError } from "@codexsun/framework/errors";
import { ok } from "@codexsun/framework/http";
import { createHash } from "node:crypto";
import { requirePermission, requireSuperAdmin } from "../auth/guards.js";
import { env } from "../env.js";
import { projectManagerMaturityStore } from "../project-manager/maturity-store.js";
import { projectManagerJsonStore } from "../project-manager/json-store.js";
import type { FastifyInstance } from "fastify";

function responseMeta(request: { correlationId?: string; id: string; tenantId?: string }) {
  return {
    requestId: request.id,
    ...(request.correlationId ? { correlationId: request.correlationId } : {}),
    ...(request.tenantId ? { tenantId: request.tenantId } : {})
  };
}

function toNumber(v: unknown): number {
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "number") return v;
  return Number(v) || 0;
}

function migrationChecksum(input: { description: string; id: string }) {
  return createHash("sha256").update(`${input.id}:${input.description}`).digest("hex");
}

function currentAppVersion() {
  return process.env.npm_package_version || "1.0.17";
}

async function hasVerifiedBackup(app: FastifyInstance, scope: string, databaseName: string, tenantId?: string) {
  const conditions = [
    "scope = ?",
    "database_name = ?",
    "verified = 1",
    "status IN ('succeeded', 'verified')",
    "created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)"
  ];
  const values: unknown[] = [scope, databaseName];
  if (tenantId) {
    conditions.push("tenant_id = ?");
    values.push(tenantId);
  }
  const [rows] = await app.masterDbPool.execute<Array<{ total: number }>>(
    `SELECT COUNT(*) AS total FROM database_backup_runs WHERE ${conditions.join(" AND ")}`,
    values
  );
  return toNumber(rows[0]?.total) > 0;
}

async function latestVerifiedBackupId(app: FastifyInstance, scope: string, databaseName: string, tenantId?: string) {
  const conditions = ["scope = ?", "database_name = ?", "verified = 1", "status IN ('succeeded', 'verified')"];
  const values: unknown[] = [scope, databaseName];
  if (tenantId) {
    conditions.push("tenant_id = ?");
    values.push(tenantId);
  }
  const [rows] = await app.masterDbPool.execute<Array<{ id: number }>>(
    `SELECT id FROM database_backup_runs WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC LIMIT 1`,
    values
  );
  return rows[0]?.id ?? null;
}

async function auditDatabaseOperation(
  app: FastifyInstance,
  request: { correlationId?: string },
  session: { email: string },
  eventName: string,
  payload: Record<string, unknown>
) {
  await app.auditService.write({
    actorType: "super_admin",
    actorEmail: session.email,
    ...(request.correlationId ? { correlationId: request.correlationId } : {}),
    eventName,
    payload
  });
}

function convertRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] = typeof value === "bigint" ? Number(value) : value;
  }
  return out;
}

function toDomainMapping(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    tenantCode: String(row.tenant_code ?? ""),
    tenantName: String(row.tenant_name ?? ""),
    domainName: String(row.domain_name),
    landingApp: typeof row.landing_app === "string" ? row.landing_app : "",
    isPrimary: Boolean(Number(row.is_primary ?? 0)),
    status: String(row.status ?? "active"),
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at
  };
}

function domainInputFromBody(body: Record<string, unknown>, requireIdentity: boolean) {
  const input: Record<string, unknown> = {};
  if (typeof body.tenantId === "string") input.tenantId = body.tenantId;
  if (typeof body.domainName === "string") input.domainName = body.domainName.trim();
  if (typeof body.landingApp === "string" || body.landingApp === null) input.landingApp = body.landingApp;
  if (typeof body.status === "string") input.status = body.status;
  if (typeof body.isPrimary === "boolean") input.isPrimary = body.isPrimary;
  if (typeof body.isPrimary === "number") input.isPrimary = Boolean(body.isPrimary);
  if (requireIdentity && (typeof input.tenantId !== "string" || typeof input.domainName !== "string" || !input.domainName)) {
    throw AppError.validation("tenantId and domainName are required");
  }
  return input;
}

function toTenantSubscription(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    tenantCode: String(row.tenant_code ?? ""),
    tenantName: String(row.tenant_name ?? ""),
    planName: String(row.plan_name),
    billingCycle: String(row.billing_cycle ?? "Monthly"),
    seats: toNumber(row.seats ?? 1),
    startsOn: row.starts_on,
    renewsOn: row.renews_on,
    amount: row.amount === null || row.amount === undefined ? null : Number(row.amount),
    currency: String(row.currency ?? "INR"),
    status: String(row.status ?? "active"),
    notes: typeof row.notes === "string" ? row.notes : "",
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at
  };
}

function subscriptionInputFromBody(body: Record<string, unknown>, requireIdentity: boolean) {
  const input: Record<string, unknown> = {};
  if (typeof body.tenantId === "string") input.tenantId = body.tenantId;
  if (typeof body.planName === "string") input.planName = body.planName.trim();
  if (typeof body.billingCycle === "string") input.billingCycle = body.billingCycle;
  if (typeof body.seats === "number") input.seats = body.seats;
  if (typeof body.seats === "string") input.seats = Number(body.seats) || 1;
  if (typeof body.startsOn === "string" || body.startsOn === null) input.startsOn = body.startsOn || null;
  if (typeof body.renewsOn === "string" || body.renewsOn === null) input.renewsOn = body.renewsOn || null;
  if (typeof body.amount === "number") input.amount = body.amount;
  if (typeof body.amount === "string") input.amount = body.amount.trim() ? Number(body.amount) : null;
  if (typeof body.currency === "string") input.currency = body.currency.trim() || "INR";
  if (typeof body.status === "string") input.status = body.status;
  if (typeof body.notes === "string" || body.notes === null) input.notes = body.notes ?? null;
  if (requireIdentity && (typeof input.tenantId !== "string" || typeof input.planName !== "string" || !input.planName)) {
    throw AppError.validation("tenantId and planName are required");
  }
  return input;
}

function toSubscriptionPlan(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    planName: String(row.plan_name),
    billingCycle: String(row.billing_cycle ?? "Monthly"),
    seats: toNumber(row.seats ?? 1),
    amount: row.amount === null || row.amount === undefined ? null : Number(row.amount),
    currency: String(row.currency ?? "INR"),
    status: String(row.status ?? "active"),
    description: typeof row.description === "string" ? row.description : "",
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at
  };
}

function subscriptionPlanInputFromBody(body: Record<string, unknown>, requireIdentity: boolean) {
  const input: Record<string, unknown> = {};
  if (typeof body.planName === "string") input.planName = body.planName.trim();
  if (typeof body.billingCycle === "string") input.billingCycle = body.billingCycle;
  if (typeof body.seats === "number") input.seats = body.seats;
  if (typeof body.seats === "string") input.seats = Number(body.seats) || 1;
  if (typeof body.amount === "number") input.amount = body.amount;
  if (typeof body.amount === "string") input.amount = body.amount.trim() ? Number(body.amount) : null;
  if (typeof body.currency === "string") input.currency = body.currency.trim() || "INR";
  if (typeof body.status === "string") input.status = body.status;
  if (typeof body.description === "string" || body.description === null) input.description = body.description ?? null;
  if (requireIdentity && (typeof input.planName !== "string" || !input.planName)) {
    throw AppError.validation("planName is required");
  }
  return input;
}

function toPlatformApp(row: Record<string, unknown>) {
  return {
    id: String(row.module_key),
    moduleKey: String(row.module_key),
    displayName: String(row.display_name),
    scope: String(row.scope ?? "platform"),
    version: String(row.version ?? "1.0.0"),
    defaultEnabled: Boolean(Number(row.default_enabled ?? 0)),
    status: String(row.status ?? "active"),
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at
  };
}

function platformAppInputFromBody(body: Record<string, unknown>, requireIdentity: boolean) {
  const input: Record<string, unknown> = {};
  if (typeof body.moduleKey === "string") input.moduleKey = body.moduleKey.trim();
  if (typeof body.displayName === "string") input.displayName = body.displayName.trim();
  if (typeof body.scope === "string") input.scope = body.scope;
  if (typeof body.version === "string") input.version = body.version.trim();
  if (typeof body.defaultEnabled === "boolean") input.defaultEnabled = body.defaultEnabled;
  if (typeof body.defaultEnabled === "number") input.defaultEnabled = Boolean(body.defaultEnabled);
  if (typeof body.status === "string") input.status = body.status;
  if (requireIdentity && (typeof input.moduleKey !== "string" || !input.moduleKey || typeof input.displayName !== "string" || !input.displayName)) {
    throw AppError.validation("moduleKey and displayName are required");
  }
  return input;
}

function toPlatformIndustry(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    industryName: String(row.industry_name),
    industryCode: String(row.industry_code),
    segment: String(row.segment ?? "General"),
    defaultTemplate: typeof row.default_template === "string" ? row.default_template : "",
    status: String(row.status ?? "active"),
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at
  };
}

function toPlatformRegistry(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    name: String(row.name),
    platform: String(row.platform),
    description: typeof row.description === "string" ? row.description : "",
    active: Boolean(Number(row.active ?? 1)),
    status: Boolean(Number(row.active ?? 1)) ? "active" : "inactive",
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at
  };
}

function toPlatformModuleGroup(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    platformRegistryId: String(row.platform_registry_id),
    groupKey: String(row.group_key),
    name: String(row.name),
    description: typeof row.description === "string" ? row.description : "",
    sortOrder: toNumber(row.sort_order ?? 0),
    active: Boolean(Number(row.active ?? 1)),
    status: Boolean(Number(row.active ?? 1)) ? "active" : "inactive",
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at
  };
}

function toPlatformModuleRegistry(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    moduleGroupId: String(row.module_group_id),
    moduleKey: String(row.module_key),
    name: String(row.name),
    routePath: typeof row.route_path === "string" ? row.route_path : "",
    description: typeof row.description === "string" ? row.description : "",
    sortOrder: toNumber(row.sort_order ?? 0),
    active: Boolean(Number(row.active ?? 1)),
    status: Boolean(Number(row.active ?? 1)) ? "active" : "inactive",
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at
  };
}

function platformRegistryInputFromBody(body: Record<string, unknown>, requireIdentity: boolean) {
  const input: Record<string, unknown> = {};
  if (typeof body.name === "string") input.name = body.name.trim();
  if (typeof body.platform === "string") input.platform = body.platform.trim();
  if (typeof body.description === "string" || body.description === null) input.description = body.description ?? null;
  if (typeof body.active === "boolean") input.active = body.active;
  if (typeof body.active === "number") input.active = Boolean(body.active);
  if (typeof body.status === "string") input.active = body.status === "active";
  if (requireIdentity && (typeof input.name !== "string" || !input.name || typeof input.platform !== "string" || !input.platform)) {
    throw AppError.validation("name and platform are required");
  }
  return input;
}

function platformModuleGroupInputFromBody(body: Record<string, unknown>, requireIdentity: boolean) {
  const input: Record<string, unknown> = {};
  if (typeof body.platformRegistryId === "string") input.platformRegistryId = body.platformRegistryId;
  if (typeof body.groupKey === "string") input.groupKey = body.groupKey.trim();
  if (typeof body.name === "string") input.name = body.name.trim();
  if (typeof body.description === "string" || body.description === null) input.description = body.description ?? null;
  if (typeof body.sortOrder === "number") input.sortOrder = body.sortOrder;
  if (typeof body.sortOrder === "string") input.sortOrder = Number(body.sortOrder) || 0;
  if (typeof body.active === "boolean") input.active = body.active;
  if (typeof body.active === "number") input.active = Boolean(body.active);
  if (typeof body.status === "string") input.active = body.status === "active";
  if (requireIdentity && (typeof input.platformRegistryId !== "string" || !input.platformRegistryId || typeof input.groupKey !== "string" || !input.groupKey || typeof input.name !== "string" || !input.name)) {
    throw AppError.validation("platformRegistryId, groupKey, and name are required");
  }
  return input;
}

function platformModuleRegistryInputFromBody(body: Record<string, unknown>, requireIdentity: boolean) {
  const input: Record<string, unknown> = {};
  if (typeof body.moduleGroupId === "string") input.moduleGroupId = body.moduleGroupId;
  if (typeof body.moduleKey === "string") input.moduleKey = body.moduleKey.trim();
  if (typeof body.name === "string") input.name = body.name.trim();
  if (typeof body.routePath === "string" || body.routePath === null) input.routePath = body.routePath ?? null;
  if (typeof body.description === "string" || body.description === null) input.description = body.description ?? null;
  if (typeof body.sortOrder === "number") input.sortOrder = body.sortOrder;
  if (typeof body.sortOrder === "string") input.sortOrder = Number(body.sortOrder) || 0;
  if (typeof body.active === "boolean") input.active = body.active;
  if (typeof body.active === "number") input.active = Boolean(body.active);
  if (typeof body.status === "string") input.active = body.status === "active";
  if (requireIdentity && (typeof input.moduleGroupId !== "string" || !input.moduleGroupId || typeof input.moduleKey !== "string" || !input.moduleKey || typeof input.name !== "string" || !input.name)) {
    throw AppError.validation("moduleGroupId, moduleKey, and name are required");
  }
  return input;
}

function platformFeatureRegistryInputFromBody(body: Record<string, unknown>, requireIdentity: boolean) {
  const input: Record<string, unknown> = {};
  if (typeof body.moduleId === "string") input.moduleId = body.moduleId;
  if (typeof body.featureKey === "string") input.featureKey = body.featureKey.trim();
  if (typeof body.name === "string") input.name = body.name.trim();
  if (typeof body.type === "string") input.type = body.type.trim();
  if (typeof body.routePath === "string" || body.routePath === null) input.routePath = body.routePath ?? null;
  if (typeof body.permissionKey === "string" || body.permissionKey === null) input.permissionKey = body.permissionKey ?? null;
  if (typeof body.description === "string" || body.description === null) input.description = body.description ?? null;
  if (typeof body.sortOrder === "number") input.sortOrder = body.sortOrder;
  if (typeof body.sortOrder === "string") input.sortOrder = Number(body.sortOrder) || 0;
  if (typeof body.active === "boolean") input.active = body.active;
  if (typeof body.active === "number") input.active = Boolean(body.active);
  if (typeof body.status === "string") input.active = body.status === "active";
  if (requireIdentity && (typeof input.moduleId !== "string" || !input.moduleId || typeof input.featureKey !== "string" || !input.featureKey || typeof input.name !== "string" || !input.name)) {
    throw AppError.validation("moduleId, featureKey, and name are required");
  }
  return input;
}

function platformDetailRegistryInputFromBody(body: Record<string, unknown>, requireIdentity: boolean) {
  const input: Record<string, unknown> = {};
  const stringFields = ["auditEvent", "componentPath", "defaultValue", "description", "featureId", "fieldName", "fieldNature", "fieldType", "key", "method", "migrationId", "moduleId", "name", "operation", "ownerTeam", "pageType", "permissionKey", "relation", "richNotes", "riskLevel", "routePath", "scope", "subscriptionFlagKey", "tableName", "tableScope", "testPath", "version"];
  for (const field of stringFields) {
    if (typeof body[field] === "string" || body[field] === null) input[field] = body[field] ?? "";
  }
  if (Array.isArray(body.dependencyKeys)) input.dependencyKeys = body.dependencyKeys;
  if (typeof body.dependencyKeys === "string") input.dependencyKeys = body.dependencyKeys.split(",").map((item) => item.trim()).filter(Boolean);
  if (typeof body.sortOrder === "number") input.sortOrder = body.sortOrder;
  if (typeof body.sortOrder === "string") input.sortOrder = Number(body.sortOrder) || 0;
  for (const field of ["active", "indexed", "lifecycleAction", "nullable", "softDelete", "tenantRequired", "unique"]) {
    if (typeof body[field] === "boolean") input[field] = body[field];
    if (typeof body[field] === "number") input[field] = Boolean(body[field]);
  }
  if (typeof body.status === "string") input.active = body.status === "active";
  if (requireIdentity && (typeof input.moduleId !== "string" || !input.moduleId || typeof input.key !== "string" || !input.key || typeof input.name !== "string" || !input.name)) {
    throw AppError.validation("moduleId, key, and name are required");
  }
  return input;
}

function projectManagerDetailKind(kind: string) {
  if (kind === "actions" || kind === "action") return "action";
  if (kind === "apis" || kind === "api") return "api";
  if (kind === "screens" || kind === "screen") return "screen";
  if (kind === "database") return "database";
  if (kind === "planning") return "planning";
  if (kind === "notes" || kind === "note") return "note";
  throw AppError.validation("Unsupported project manager registry kind");
}

function projectManagerMaturityKind(kind: string) {
  if (kind === "actions" || kind === "action") return "action";
  if (kind === "agents" || kind === "agent-notes" || kind === "agent_note") return "agent_note";
  if (kind === "activities") return "activity";
  if (kind === "automations") return "automation";
  if (kind === "changelog") return "changelog";
  if (kind === "coverage") return "coverage";
  if (kind === "discussions" || kind === "discussion") return "discussion";
  if (kind === "gantt" || kind === "gant") return "gantt";
  if (kind === "github") return "github";
  if (kind === "issues") return "issue";
  if (kind === "kanban") return "kanban";
  if (kind === "pull-requests" || kind === "pull_requests" || kind === "pull-request") return "pull_request";
  if (kind === "releases") return "release";
  if (kind === "reviews") return "review";
  if (kind === "security-quality" || kind === "security_quality") return "security_quality";
  if (kind === "tasks") return "task";
  if (kind === "timeline") return "timeline";
  if (kind === "todos") return "todo";
  throw AppError.validation("Unsupported project manager maturity kind");
}

function projectManagerMaturityInputFromBody(body: Record<string, unknown>, requireIdentity: boolean) {
  const input: Record<string, unknown> = {};
  const stringFields = ["actor", "assignee", "command", "description", "dueDate", "endDate", "eventName", "githubBranch", "githubCommit", "githubIssue", "githubPr", "githubUrl", "key", "lane", "moduleGroupKey", "moduleId", "moduleKey", "ownerTeam", "platformKey", "priority", "referenceId", "referenceType", "reviewer", "richNotes", "severity", "startDate", "status", "title", "type", "version"];
  for (const field of stringFields) {
    if (typeof body[field] === "string" || body[field] === null) input[field] = body[field] ?? "";
  }
  if (Array.isArray(body.labels)) input.labels = body.labels;
  if (typeof body.labels === "string") input.labels = body.labels.split(",").map((item) => item.trim()).filter(Boolean);
  if (typeof body.sortOrder === "number") input.sortOrder = body.sortOrder;
  if (typeof body.sortOrder === "string") input.sortOrder = Number(body.sortOrder) || 0;
  if (typeof body.active === "boolean") input.active = body.active;
  if (typeof body.active === "number") input.active = Boolean(body.active);
  if (requireIdentity && (typeof input.key !== "string" || !input.key || typeof input.title !== "string" || !input.title)) {
    throw AppError.validation("key and title are required");
  }
  return input;
}

function platformIndustryInputFromBody(body: Record<string, unknown>, requireIdentity: boolean) {
  const input: Record<string, unknown> = {};
  if (typeof body.industryName === "string") input.industryName = body.industryName.trim();
  if (typeof body.industryCode === "string") input.industryCode = body.industryCode.trim();
  if (typeof body.segment === "string") input.segment = body.segment;
  if (typeof body.defaultTemplate === "string" || body.defaultTemplate === null) input.defaultTemplate = body.defaultTemplate ?? null;
  if (typeof body.status === "string") input.status = body.status;
  if (requireIdentity && (typeof input.industryName !== "string" || !input.industryName || typeof input.industryCode !== "string" || !input.industryCode)) {
    throw AppError.validation("industryName and industryCode are required");
  }
  return input;
}

/* eslint-disable no-redeclare */
function tenantInputFromBody(body: Record<string, unknown>, requireIdentity: true): {
  tenantCode: string;
  tenantName: string;
  corporateId?: string | null;
  dbHost?: string;
  dbName?: string;
  dbPort?: number;
  dbSecretRef?: string;
  dbType?: string;
  dbUser?: string;
  enabledModuleKeys?: string[];
  mobile?: string | null;
  payloadSettings?: Record<string, unknown>;
  slug?: string;
  status?: string;
};
function tenantInputFromBody(body: Record<string, unknown>, requireIdentity: false): {
  tenantCode?: string;
  tenantName?: string;
  corporateId?: string | null;
  dbHost?: string;
  dbName?: string;
  dbPort?: number;
  dbSecretRef?: string;
  dbType?: string;
  dbUser?: string;
  enabledModuleKeys?: string[];
  mobile?: string | null;
  payloadSettings?: Record<string, unknown>;
  slug?: string;
  status?: string;
};
function tenantInputFromBody(body: Record<string, unknown>, requireIdentity: boolean) {
/* eslint-enable no-redeclare */
  const input: Record<string, unknown> = {};
  if (typeof body.tenantCode === "string") input.tenantCode = body.tenantCode;
  if (typeof body.tenantName === "string") input.tenantName = body.tenantName;
  if (typeof body.corporateId === "string" || body.corporateId === null) input.corporateId = body.corporateId;
  if (typeof body.mobile === "string" || body.mobile === null) input.mobile = body.mobile;
  if (typeof body.slug === "string") input.slug = body.slug;
  if (typeof body.status === "string") input.status = body.status;
  if (typeof body.dbType === "string") input.dbType = body.dbType;
  if (typeof body.dbHost === "string") input.dbHost = body.dbHost;
  if (typeof body.dbPort === "number") input.dbPort = body.dbPort;
  if (typeof body.dbPort === "string") input.dbPort = Number(body.dbPort) || 3306;
  if (typeof body.dbName === "string") input.dbName = body.dbName;
  if (typeof body.dbUser === "string") input.dbUser = body.dbUser;
  if (typeof body.dbSecretRef === "string") input.dbSecretRef = body.dbSecretRef;
  if (isPlainObject(body.payloadSettings)) input.payloadSettings = body.payloadSettings;
  if (Array.isArray(body.enabledModuleKeys)) {
    input.enabledModuleKeys = body.enabledModuleKeys.filter((item): item is string => typeof item === "string");
  }
  if (requireIdentity && (typeof input.tenantCode !== "string" || typeof input.tenantName !== "string")) {
    throw AppError.validation("tenantCode and tenantName are required");
  }
  return input;
}

async function syncTenantModules(app: FastifyInstance, tenantId: string, enabledModuleKeys: string[]) {
  const catalogKeys = app.moduleCatalog.getAll().map((module) => module.moduleKey);
  for (const moduleKey of catalogKeys) {
    const status = enabledModuleKeys.includes(moduleKey) ? "enabled" : "disabled";
    await app.masterDbPool.execute(
      `INSERT INTO tenant_module_activation (tenant_id, module_key, status)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [tenantId, moduleKey, status]
    );
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function requireOneOf(value: unknown, allowed: string[], fieldName: string) {
  if (typeof value === "string" && value && !allowed.includes(value)) {
    throw AppError.validation(`${fieldName} must be one of: ${allowed.join(", ")}`);
  }
}

function requireSlugLike(value: string, fieldName: string) {
  if (!/^[a-z0-9][a-z0-9._-]*[a-z0-9]$|^[a-z0-9]$/i.test(value)) {
    throw AppError.validation(`${fieldName} can use letters, numbers, dot, dash, and underscore only`);
  }
}

function requireDomainName(value: string) {
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(value)) {
    throw AppError.validation("Domain must be a valid host name such as example.com");
  }
}

function activityEventNames(module: string) {
  const names: Record<string, string[]> = {
    app: ["platform.app.added", "platform.app.updated", "platform.app.deleted"],
    domain: ["tenant.domain.added", "tenant.domain.updated", "tenant.domain.deleted"],
    industry: ["platform.industry.added", "platform.industry.updated", "platform.industry.deleted"],
    platformRegistry: ["platform.registry.added", "platform.registry.updated", "platform.registry.deactivated", "platform.registry.restored"],
    plan: ["tenant.subscription.plan.added", "tenant.subscription.plan.updated", "tenant.subscription.plan.deleted"],
    subscription: ["tenant.subscription.added", "tenant.subscription.updated", "tenant.subscription.deleted"],
    tenant: ["tenant.created", "tenant.updated", "tenant.deleted"],
  };
  return names[module] ?? [];
}

export async function registerAdminRoutes(app: FastifyInstance) {
  // Console Dashboard ──────────────────────────────────────────
  app.get("/admin/console", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.view");

    const [tenantRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT COUNT(*) as total, SUM(status='active') as active, SUM(status='suspended') as suspended FROM tenants"
    );
    const r = tenantRows[0] || {};
    const tenantStats = { total: toNumber(r.total), active: toNumber(r.active), suspended: toNumber(r.suspended) };

    const [moduleRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT COUNT(DISTINCT module_key) as total FROM tenant_module_activation WHERE status = 'enabled'"
    );
    const enabledModules = toNumber(moduleRows[0]?.total);

    const [auditRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT COUNT(*) as total FROM audit_events WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)"
    );
    const recentAudits = toNumber(auditRows[0]?.total);

    const [migrationRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT COUNT(*) as total FROM platform_migrations"
    );
    const migrationCount = toNumber(migrationRows[0]?.total);

    return ok({
      tenants: tenantStats,
      enabledModules,
      recentAudits,
      migrations: migrationCount,
      dbStatus: {
        masterDatabase: "codexsun_master_db",
        ready: true
      }
    }, responseMeta(request));
  });

  // ── Tenant Registry Routes ─────────────────────────────────────
  app.get("/admin/tenants", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.view");
    const tenants = await app.tenantService.list();
    return ok(tenants, responseMeta(request));
  });

  app.get("/admin/tenants/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.view");
    const { id } = request.params as { id: string };
    const tenant = await app.tenantService.getById(id);
    return ok(tenant, responseMeta(request));
  });

  app.post("/admin/tenants", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const body = request.body as Record<string, unknown>;
    const tenant = await app.tenantService.create({
      ...tenantInputFromBody(body, true)
    });
    await syncTenantModules(app, tenant.id, tenant.enabledModuleKeys);
    await app.auditService.tenantCreated({
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      tenantId: tenant.id,
      tenantCode: tenant.tenantCode
    });
    return ok(tenant, responseMeta(request));
  });

  app.put("/admin/tenants/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    const input = tenantInputFromBody(body, false);
    const changes: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) changes[key] = value;
    }
    const tenant = await app.tenantService.update(id, input);
    if (input.enabledModuleKeys !== undefined) {
      await syncTenantModules(app, tenant.id, input.enabledModuleKeys);
    }
    await app.auditService.tenantUpdated({
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      tenantId: id,
      changes
    });
    return ok(tenant, responseMeta(request));
  });

  app.post("/admin/tenants/:id/suspend", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const { id } = request.params as { id: string };
    const tenant = await app.tenantService.update(id, { status: "suspended" });
    await app.auditService.tenantUpdated({
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      tenantId: id,
      changes: { status: "suspended" }
    });
    return ok(tenant, responseMeta(request));
  });

  app.post("/admin/tenants/:id/restore", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const { id } = request.params as { id: string };
    const tenant = await app.tenantService.update(id, { status: "active" });
    await app.auditService.tenantUpdated({
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      tenantId: id,
      changes: { status: "active" }
    });
    return ok(tenant, responseMeta(request));
  });

  // ── Module Activation ──────────────────────────────────────────
  app.get("/admin/domains", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.view");
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT
         d.id, d.tenant_id, d.domain_name, d.landing_app, d.is_primary, d.status, d.created_at, d.updated_at,
         t.tenant_code, t.tenant_name
       FROM tenant_domain_mappings d
       INNER JOIN tenants t ON t.id = d.tenant_id
       ORDER BY d.updated_at DESC, d.created_at DESC`
    );
    return ok(rows.map(toDomainMapping), responseMeta(request));
  });

  app.post("/admin/domains", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const body = request.body as Record<string, unknown>;
    const input = domainInputFromBody(body, true);
    const tenantId = String(input.tenantId);
    requireDomainName(String(input.domainName));
    requireOneOf(input.status, ["active", "inactive", "pending"], "status");
    const [tenantRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>("SELECT id FROM tenants WHERE id = ? LIMIT 1", [tenantId]);
    if (!tenantRows[0]) throw AppError.validation("Select a valid tenant before saving the domain");
    const [duplicateRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>("SELECT id FROM tenant_domain_mappings WHERE domain_name = ? LIMIT 1", [input.domainName]);
    if (duplicateRows[0]) throw AppError.conflict("Domain already exists");
    if (input.isPrimary) {
      await app.masterDbPool.execute("UPDATE tenant_domain_mappings SET is_primary = 0 WHERE tenant_id = ?", [tenantId]);
    }
    const [result] = await app.masterDbPool.execute<{ insertId: number | string }>(
      `INSERT INTO tenant_domain_mappings (tenant_id, domain_name, landing_app, is_primary, status)
       VALUES (?, ?, ?, ?, ?)`,
      [
        tenantId,
        input.domainName,
        input.landingApp ?? null,
        input.isPrimary ? 1 : 0,
        input.status ?? "active"
      ]
    );
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "tenant.domain.added",
      tenantId,
      payload: { domainName: input.domainName }
    });
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT
         d.id, d.tenant_id, d.domain_name, d.landing_app, d.is_primary, d.status, d.created_at, d.updated_at,
         t.tenant_code, t.tenant_name
       FROM tenant_domain_mappings d
       INNER JOIN tenants t ON t.id = d.tenant_id
       WHERE d.id = ?`,
      [String(result.insertId)]
    );
    return ok(toDomainMapping(rows[0] ?? {}), responseMeta(request));
  });

  app.put("/admin/domains/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    const input = domainInputFromBody(body, false);
    const [existingRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT id, tenant_id, is_primary FROM tenant_domain_mappings WHERE id = ? LIMIT 1",
      [id]
    );
    const existing = existingRows[0];
    if (!existing) throw AppError.notFound("Domain mapping not found");
    const tenantId = String(input.tenantId ?? existing.tenant_id);
    if (typeof input.domainName === "string") requireDomainName(input.domainName);
    requireOneOf(input.status, ["active", "inactive", "pending"], "status");
    const [tenantRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>("SELECT id FROM tenants WHERE id = ? LIMIT 1", [tenantId]);
    if (!tenantRows[0]) throw AppError.validation("Select a valid tenant before saving the domain");
    if (typeof input.domainName === "string") {
      const [duplicateRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>("SELECT id FROM tenant_domain_mappings WHERE domain_name = ? AND id <> ? LIMIT 1", [input.domainName, id]);
      if (duplicateRows[0]) throw AppError.conflict("Domain already exists");
    }
    if (input.isPrimary) {
      await app.masterDbPool.execute("UPDATE tenant_domain_mappings SET is_primary = 0 WHERE tenant_id = ? AND id <> ?", [tenantId, id]);
    }
    const nextPrimary = input.isPrimary === undefined ? Boolean(Number(existing.is_primary ?? 0)) : Boolean(input.isPrimary);
    await app.masterDbPool.execute(
      `UPDATE tenant_domain_mappings
       SET tenant_id = ?, domain_name = COALESCE(?, domain_name), landing_app = ?, is_primary = ?, status = COALESCE(?, status)
       WHERE id = ?`,
      [
        tenantId,
        input.domainName ?? null,
        input.landingApp ?? null,
        nextPrimary ? 1 : 0,
        input.status ?? null,
        id
      ]
    );
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "tenant.domain.updated",
      tenantId,
      payload: { domainId: id }
    });
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT
         d.id, d.tenant_id, d.domain_name, d.landing_app, d.is_primary, d.status, d.created_at, d.updated_at,
         t.tenant_code, t.tenant_name
       FROM tenant_domain_mappings d
       INNER JOIN tenants t ON t.id = d.tenant_id
       WHERE d.id = ?`,
      [id]
    );
    return ok(toDomainMapping(rows[0] ?? {}), responseMeta(request));
  });

  app.delete("/admin/domains/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const { id } = request.params as { id: string };
    const [existingRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT id, tenant_id, domain_name FROM tenant_domain_mappings WHERE id = ? LIMIT 1",
      [id]
    );
    const existing = existingRows[0];
    if (!existing) throw AppError.notFound("Domain mapping not found");

    await app.masterDbPool.execute("DELETE FROM tenant_domain_mappings WHERE id = ?", [id]);
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "tenant.domain.deleted",
      tenantId: String(existing.tenant_id),
      payload: { domainId: id, domainName: existing.domain_name }
    });
    return ok({ deleted: true, id, domainName: existing.domain_name }, responseMeta(request));
  });

  app.get("/admin/subscriptions", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.view");
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT
         s.id, s.tenant_id, s.plan_name, s.billing_cycle, s.seats, s.starts_on, s.renews_on,
         s.amount, s.currency, s.status, s.notes, s.created_at, s.updated_at,
         t.tenant_code, t.tenant_name
       FROM tenant_subscriptions s
       INNER JOIN tenants t ON t.id = s.tenant_id
       ORDER BY s.updated_at DESC, s.created_at DESC`
    );
    return ok(rows.map(toTenantSubscription), responseMeta(request));
  });

  app.post("/admin/subscriptions", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const body = request.body as Record<string, unknown>;
    const input = subscriptionInputFromBody(body, true);
    const tenantId = String(input.tenantId);
    requireOneOf(input.billingCycle, ["Monthly", "Quarterly", "Half yearly", "Yearly"], "billingCycle");
    requireOneOf(input.status, ["active", "trial", "pending", "expired", "suspended", "inactive"], "status");
    if (Number(input.seats ?? 1) < 1) throw AppError.validation("seats must be at least 1");
    const [tenantRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>("SELECT id FROM tenants WHERE id = ? LIMIT 1", [tenantId]);
    if (!tenantRows[0]) throw AppError.validation("Select a valid tenant before saving the subscription");
    const [result] = await app.masterDbPool.execute<{ insertId: number | string }>(
      `INSERT INTO tenant_subscriptions
         (tenant_id, plan_name, billing_cycle, seats, starts_on, renews_on, amount, currency, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId,
        input.planName,
        input.billingCycle ?? "Monthly",
        input.seats ?? 1,
        input.startsOn ?? null,
        input.renewsOn ?? null,
        input.amount ?? null,
        input.currency ?? "INR",
        input.status ?? "active",
        input.notes ?? null
      ]
    );
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "tenant.subscription.added",
      tenantId,
      payload: { planName: input.planName }
    });
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT
         s.id, s.tenant_id, s.plan_name, s.billing_cycle, s.seats, s.starts_on, s.renews_on,
         s.amount, s.currency, s.status, s.notes, s.created_at, s.updated_at,
         t.tenant_code, t.tenant_name
       FROM tenant_subscriptions s
       INNER JOIN tenants t ON t.id = s.tenant_id
       WHERE s.id = ?`,
      [String(result.insertId)]
    );
    return ok(toTenantSubscription(rows[0] ?? {}), responseMeta(request));
  });

  app.put("/admin/subscriptions/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    const input = subscriptionInputFromBody(body, false);
    const [existingRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT id, tenant_id FROM tenant_subscriptions WHERE id = ? LIMIT 1",
      [id]
    );
    const existing = existingRows[0];
    if (!existing) throw AppError.notFound("Subscription not found");
    const tenantId = String(input.tenantId ?? existing.tenant_id);
    requireOneOf(input.billingCycle, ["Monthly", "Quarterly", "Half yearly", "Yearly"], "billingCycle");
    requireOneOf(input.status, ["active", "trial", "pending", "expired", "suspended", "inactive"], "status");
    if (input.seats !== undefined && Number(input.seats) < 1) throw AppError.validation("seats must be at least 1");
    const [tenantRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>("SELECT id FROM tenants WHERE id = ? LIMIT 1", [tenantId]);
    if (!tenantRows[0]) throw AppError.validation("Select a valid tenant before saving the subscription");
    await app.masterDbPool.execute(
      `UPDATE tenant_subscriptions
       SET tenant_id = ?,
           plan_name = COALESCE(?, plan_name),
           billing_cycle = COALESCE(?, billing_cycle),
           seats = COALESCE(?, seats),
           starts_on = ?,
           renews_on = ?,
           amount = ?,
           currency = COALESCE(?, currency),
           status = COALESCE(?, status),
           notes = ?
       WHERE id = ?`,
      [
        tenantId,
        input.planName ?? null,
        input.billingCycle ?? null,
        input.seats ?? null,
        input.startsOn ?? null,
        input.renewsOn ?? null,
        input.amount ?? null,
        input.currency ?? null,
        input.status ?? null,
        input.notes ?? null,
        id
      ]
    );
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "tenant.subscription.updated",
      tenantId,
      payload: { subscriptionId: id }
    });
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT
         s.id, s.tenant_id, s.plan_name, s.billing_cycle, s.seats, s.starts_on, s.renews_on,
         s.amount, s.currency, s.status, s.notes, s.created_at, s.updated_at,
         t.tenant_code, t.tenant_name
       FROM tenant_subscriptions s
       INNER JOIN tenants t ON t.id = s.tenant_id
       WHERE s.id = ?`,
      [id]
    );
    return ok(toTenantSubscription(rows[0] ?? {}), responseMeta(request));
  });

  app.delete("/admin/subscriptions/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const { id } = request.params as { id: string };
    const [existingRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT id, tenant_id, plan_name FROM tenant_subscriptions WHERE id = ? LIMIT 1",
      [id]
    );
    const existing = existingRows[0];
    if (!existing) throw AppError.notFound("Subscription not found");
    await app.masterDbPool.execute("DELETE FROM tenant_subscriptions WHERE id = ?", [id]);
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "tenant.subscription.deleted",
      tenantId: String(existing.tenant_id),
      payload: { subscriptionId: id, planName: existing.plan_name }
    });
    return ok({ deleted: true, id, planName: existing.plan_name }, responseMeta(request));
  });

  app.get("/admin/subscription-plans", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.view");
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT id, plan_name, billing_cycle, seats, amount, currency, status, description, created_at, updated_at
       FROM subscription_plans
       ORDER BY updated_at DESC, created_at DESC`
    );
    return ok(rows.map(toSubscriptionPlan), responseMeta(request));
  });

  app.post("/admin/subscription-plans", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const input = subscriptionPlanInputFromBody(request.body as Record<string, unknown>, true);
    requireOneOf(input.billingCycle, ["Monthly", "Quarterly", "Half yearly", "Yearly"], "billingCycle");
    requireOneOf(input.status, ["active", "trial", "inactive"], "status");
    if (Number(input.seats ?? 1) < 1) throw AppError.validation("seats must be at least 1");
    const [duplicateRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>("SELECT id FROM subscription_plans WHERE plan_name = ? LIMIT 1", [input.planName]);
    if (duplicateRows[0]) throw AppError.conflict("Plan already exists");
    const [result] = await app.masterDbPool.execute<{ insertId: number | string }>(
      `INSERT INTO subscription_plans (plan_name, billing_cycle, seats, amount, currency, status, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        input.planName,
        input.billingCycle ?? "Monthly",
        input.seats ?? 1,
        input.amount ?? null,
        input.currency ?? "INR",
        input.status ?? "active",
        input.description ?? null
      ]
    );
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "tenant.subscription.plan.added",
      payload: { planName: input.planName }
    });
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT id, plan_name, billing_cycle, seats, amount, currency, status, description, created_at, updated_at
       FROM subscription_plans
       WHERE id = ?`,
      [String(result.insertId)]
    );
    return ok(toSubscriptionPlan(rows[0] ?? {}), responseMeta(request));
  });

  app.put("/admin/subscription-plans/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const { id } = request.params as { id: string };
    const input = subscriptionPlanInputFromBody(request.body as Record<string, unknown>, false);
    const [existingRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT id FROM subscription_plans WHERE id = ? LIMIT 1",
      [id]
    );
    if (!existingRows[0]) throw AppError.notFound("Subscription plan not found");
    requireOneOf(input.billingCycle, ["Monthly", "Quarterly", "Half yearly", "Yearly"], "billingCycle");
    requireOneOf(input.status, ["active", "trial", "inactive"], "status");
    if (input.seats !== undefined && Number(input.seats) < 1) throw AppError.validation("seats must be at least 1");
    if (typeof input.planName === "string") {
      const [duplicateRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>("SELECT id FROM subscription_plans WHERE plan_name = ? AND id <> ? LIMIT 1", [input.planName, id]);
      if (duplicateRows[0]) throw AppError.conflict("Plan already exists");
    }
    await app.masterDbPool.execute(
      `UPDATE subscription_plans
       SET plan_name = COALESCE(?, plan_name),
           billing_cycle = COALESCE(?, billing_cycle),
           seats = COALESCE(?, seats),
           amount = ?,
           currency = COALESCE(?, currency),
           status = COALESCE(?, status),
           description = ?
       WHERE id = ?`,
      [
        input.planName ?? null,
        input.billingCycle ?? null,
        input.seats ?? null,
        input.amount ?? null,
        input.currency ?? null,
        input.status ?? null,
        input.description ?? null,
        id
      ]
    );
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "tenant.subscription.plan.updated",
      payload: { planId: id }
    });
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT id, plan_name, billing_cycle, seats, amount, currency, status, description, created_at, updated_at
       FROM subscription_plans
       WHERE id = ?`,
      [id]
    );
    return ok(toSubscriptionPlan(rows[0] ?? {}), responseMeta(request));
  });

  app.delete("/admin/subscription-plans/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const { id } = request.params as { id: string };
    const [existingRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT id, plan_name FROM subscription_plans WHERE id = ? LIMIT 1",
      [id]
    );
    const existing = existingRows[0];
    if (!existing) throw AppError.notFound("Subscription plan not found");
    const [subscriptionRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT COUNT(*) AS total FROM tenant_subscriptions WHERE plan_name = ?",
      [existing.plan_name]
    );
    if (toNumber(subscriptionRows[0]?.total) > 0) {
      throw AppError.conflict("Plan is used by subscriptions. Archive it instead of deleting.");
    }
    await app.masterDbPool.execute("DELETE FROM subscription_plans WHERE id = ?", [id]);
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "tenant.subscription.plan.deleted",
      payload: { planId: id, planName: existing.plan_name }
    });
    return ok({ deleted: true, id, planName: existing.plan_name }, responseMeta(request));
  });

  app.get("/admin/platform-registry", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    return ok(await projectManagerJsonStore.listPlatforms(), responseMeta(request));
  });

  app.get("/admin/project-manager/result", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    return ok(await projectManagerJsonStore.result(), responseMeta(request));
  });

  app.get("/admin/project-manager/maturity/result", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    return ok(await projectManagerMaturityStore.result(), responseMeta(request));
  });

  app.get("/admin/project-manager/maturity/:kind", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { kind } = request.params as { kind: string };
    return ok(await projectManagerMaturityStore.list(projectManagerMaturityKind(kind)), responseMeta(request));
  });

  app.post("/admin/project-manager/maturity/:kind", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { kind } = request.params as { kind: string };
    const maturityKind = projectManagerMaturityKind(kind);
    const input = projectManagerMaturityInputFromBody(request.body as Record<string, unknown>, true);
    const record = await projectManagerMaturityStore.create(maturityKind, input);
    await app.auditService.write({ actorType: "super_admin", actorEmail: session.email, ...(request.correlationId ? { correlationId: request.correlationId } : {}), eventName: `project_manager.maturity.${maturityKind}.added`, payload: { id: record.id, key: record.key } });
    return ok(record, responseMeta(request));
  });

  app.put("/admin/project-manager/maturity/:kind/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { id, kind } = request.params as { id: string; kind: string };
    const maturityKind = projectManagerMaturityKind(kind);
    const input = projectManagerMaturityInputFromBody(request.body as Record<string, unknown>, false);
    const record = await projectManagerMaturityStore.update(maturityKind, id, input);
    await app.auditService.write({ actorType: "super_admin", actorEmail: session.email, ...(request.correlationId ? { correlationId: request.correlationId } : {}), eventName: `project_manager.maturity.${maturityKind}.updated`, payload: { id, key: record.key } });
    return ok(record, responseMeta(request));
  });

  app.post("/admin/project-manager/maturity/:kind/:id/deactivate", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { id, kind } = request.params as { id: string; kind: string };
    const maturityKind = projectManagerMaturityKind(kind);
    const record = await projectManagerMaturityStore.setActive(maturityKind, id, false);
    await app.auditService.write({ actorType: "super_admin", actorEmail: session.email, ...(request.correlationId ? { correlationId: request.correlationId } : {}), eventName: `project_manager.maturity.${maturityKind}.deactivated`, payload: { id } });
    return ok(record, responseMeta(request));
  });

  app.post("/admin/project-manager/maturity/:kind/:id/restore", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { id, kind } = request.params as { id: string; kind: string };
    const maturityKind = projectManagerMaturityKind(kind);
    const record = await projectManagerMaturityStore.setActive(maturityKind, id, true);
    await app.auditService.write({ actorType: "super_admin", actorEmail: session.email, ...(request.correlationId ? { correlationId: request.correlationId } : {}), eventName: `project_manager.maturity.${maturityKind}.restored`, payload: { id } });
    return ok(record, responseMeta(request));
  });

  app.delete("/admin/project-manager/maturity/:kind/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { id, kind } = request.params as { id: string; kind: string };
    const maturityKind = projectManagerMaturityKind(kind);
    const result = await projectManagerMaturityStore.delete(maturityKind, id);
    await app.auditService.write({ actorType: "super_admin", actorEmail: session.email, ...(request.correlationId ? { correlationId: request.correlationId } : {}), eventName: `project_manager.maturity.${maturityKind}.force_deleted`, payload: result });
    return ok(result, responseMeta(request));
  });

  app.post("/admin/project-manager/automation-md/reference", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const body = request.body as Record<string, unknown>;
    const kind = typeof body.kind === "string" ? body.kind : "";
    const maturityKind = projectManagerMaturityKind(kind);
    const input = projectManagerMaturityInputFromBody({ ...body, actor: session.email }, true);
    const result = await projectManagerMaturityStore.communicationReference(maturityKind, input);
    await app.auditService.write({ actorType: "super_admin", actorEmail: session.email, ...(request.correlationId ? { correlationId: request.correlationId } : {}), eventName: "project_manager.automation_md.reference_queued", payload: { key: input.key, kind: maturityKind, referenceNo: result.referenceNo } });
    return ok(result, responseMeta(request));
  });

  app.post("/admin/project-manager/commands", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const body = request.body as Record<string, unknown>;
    const command = typeof body.command === "string" ? body.command : "";
    const input = projectManagerMaturityInputFromBody({ ...body, actor: session.email, key: "command", title: "command" }, false);
    const result = await projectManagerMaturityStore.command(command, input);
    await app.auditService.write({ actorType: "super_admin", actorEmail: session.email, ...(request.correlationId ? { correlationId: request.correlationId } : {}), eventName: "project_manager.command.completed", payload: { command } });
    return ok(result, responseMeta(request));
  });

  app.get("/admin/platform-registry/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { id } = request.params as { id: string };
    const record = (await projectManagerJsonStore.listPlatforms()).find((item) => item.id === id);
    if (!record) throw AppError.notFound("Platform registry record not found");
    return ok(record, responseMeta(request));
  });

  app.post("/admin/platform-registry", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const input = platformRegistryInputFromBody(request.body as Record<string, unknown>, true);
    const record = await projectManagerJsonStore.createPlatform(input);
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "platform.registry.added",
      payload: { id: record.id, name: record.name, platform: record.platform }
    });
    return ok(record, responseMeta(request));
  });

  app.put("/admin/platform-registry/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { id } = request.params as { id: string };
    const input = platformRegistryInputFromBody(request.body as Record<string, unknown>, false);
    const record = await projectManagerJsonStore.updatePlatform(id, input);
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "platform.registry.updated",
      payload: { id, name: record.name, platform: record.platform }
    });
    return ok(record, responseMeta(request));
  });

  app.post("/admin/platform-registry/:id/deactivate", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { id } = request.params as { id: string };
    const record = await projectManagerJsonStore.setPlatformActive(id, false);
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "platform.registry.deactivated",
      payload: { id, name: record.name, platform: record.platform }
    });
    return ok(record, responseMeta(request));
  });

  app.post("/admin/platform-registry/:id/restore", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { id } = request.params as { id: string };
    const record = await projectManagerJsonStore.setPlatformActive(id, true);
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "platform.registry.restored",
      payload: { id, name: record.name, platform: record.platform }
    });
    return ok(record, responseMeta(request));
  });

  app.delete("/admin/platform-registry/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { id } = request.params as { id: string };
    const result = await projectManagerJsonStore.deletePlatform(id);
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "platform.registry.force_deleted",
      payload: result
    });
    return ok(result, responseMeta(request));
  });

  app.get("/admin/platform-registry/:platformId/module-groups", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { platformId } = request.params as { platformId: string };
    return ok(await projectManagerJsonStore.listGroups(platformId), responseMeta(request));
  });

  app.post("/admin/platform-module-groups", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const input = platformModuleGroupInputFromBody(request.body as Record<string, unknown>, true);
    const record = await projectManagerJsonStore.createGroup(input);
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "platform.registry.group.added",
      payload: { id: record.id, platformRegistryId: record.platformRegistryId, groupKey: record.groupKey }
    });
    return ok(record, responseMeta(request));
  });

  app.put("/admin/platform-module-groups/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { id } = request.params as { id: string };
    const input = platformModuleGroupInputFromBody(request.body as Record<string, unknown>, false);
    const record = await projectManagerJsonStore.updateGroup(id, input);
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "platform.registry.group.updated",
      payload: { id, platformRegistryId: record.platformRegistryId, groupKey: record.groupKey }
    });
    return ok(record, responseMeta(request));
  });

  app.post("/admin/platform-module-groups/:id/deactivate", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { id } = request.params as { id: string };
    const record = await projectManagerJsonStore.setGroupActive(id, false);
    await app.auditService.write({ actorType: "super_admin", actorEmail: session.email, ...(request.correlationId ? { correlationId: request.correlationId } : {}), eventName: "platform.registry.group.deactivated", payload: { id } });
    return ok(record, responseMeta(request));
  });

  app.post("/admin/platform-module-groups/:id/restore", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { id } = request.params as { id: string };
    const record = await projectManagerJsonStore.setGroupActive(id, true);
    await app.auditService.write({ actorType: "super_admin", actorEmail: session.email, ...(request.correlationId ? { correlationId: request.correlationId } : {}), eventName: "platform.registry.group.restored", payload: { id } });
    return ok(record, responseMeta(request));
  });

  app.delete("/admin/platform-module-groups/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { id } = request.params as { id: string };
    const result = await projectManagerJsonStore.deleteGroup(id);
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "platform.registry.group.force_deleted",
      payload: result
    });
    return ok(result, responseMeta(request));
  });

  app.get("/admin/platform-module-groups/:groupId/modules", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { groupId } = request.params as { groupId: string };
    return ok(await projectManagerJsonStore.listModules(groupId), responseMeta(request));
  });

  app.post("/admin/platform-module-registry", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const input = platformModuleRegistryInputFromBody(request.body as Record<string, unknown>, true);
    const record = await projectManagerJsonStore.createModule(input);
    await app.auditService.write({ actorType: "super_admin", actorEmail: session.email, ...(request.correlationId ? { correlationId: request.correlationId } : {}), eventName: "platform.registry.module.added", payload: { id: record.id, moduleGroupId: record.moduleGroupId, moduleKey: record.moduleKey } });
    return ok(record, responseMeta(request));
  });

  app.put("/admin/platform-module-registry/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { id } = request.params as { id: string };
    const input = platformModuleRegistryInputFromBody(request.body as Record<string, unknown>, false);
    const record = await projectManagerJsonStore.updateModule(id, input);
    await app.auditService.write({ actorType: "super_admin", actorEmail: session.email, ...(request.correlationId ? { correlationId: request.correlationId } : {}), eventName: "platform.registry.module.updated", payload: { id, moduleGroupId: record.moduleGroupId, moduleKey: record.moduleKey } });
    return ok(record, responseMeta(request));
  });

  app.post("/admin/platform-module-registry/:id/deactivate", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { id } = request.params as { id: string };
    const record = await projectManagerJsonStore.setModuleActive(id, false);
    await app.auditService.write({ actorType: "super_admin", actorEmail: session.email, ...(request.correlationId ? { correlationId: request.correlationId } : {}), eventName: "platform.registry.module.deactivated", payload: { id } });
    return ok(record, responseMeta(request));
  });

  app.post("/admin/platform-module-registry/:id/restore", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { id } = request.params as { id: string };
    const record = await projectManagerJsonStore.setModuleActive(id, true);
    await app.auditService.write({ actorType: "super_admin", actorEmail: session.email, ...(request.correlationId ? { correlationId: request.correlationId } : {}), eventName: "platform.registry.module.restored", payload: { id } });
    return ok(record, responseMeta(request));
  });

  app.delete("/admin/platform-module-registry/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { id } = request.params as { id: string };
    const result = await projectManagerJsonStore.deleteModule(id);
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "platform.registry.module.force_deleted",
      payload: result
    });
    return ok(result, responseMeta(request));
  });

  app.get("/admin/platform-module-registry/:moduleId/features", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { moduleId } = request.params as { moduleId: string };
    return ok(await projectManagerJsonStore.listFeatures(moduleId), responseMeta(request));
  });

  app.post("/admin/platform-feature-registry", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const input = platformFeatureRegistryInputFromBody(request.body as Record<string, unknown>, true);
    const record = await projectManagerJsonStore.createFeature(input);
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "platform.registry.feature.added",
      payload: { id: record.id, moduleId: record.moduleId, featureKey: record.featureKey }
    });
    return ok(record, responseMeta(request));
  });

  app.put("/admin/platform-feature-registry/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { id } = request.params as { id: string };
    const input = platformFeatureRegistryInputFromBody(request.body as Record<string, unknown>, false);
    const record = await projectManagerJsonStore.updateFeature(id, input);
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "platform.registry.feature.updated",
      payload: { id, moduleId: record.moduleId, featureKey: record.featureKey }
    });
    return ok(record, responseMeta(request));
  });

  app.post("/admin/platform-feature-registry/:id/deactivate", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { id } = request.params as { id: string };
    const record = await projectManagerJsonStore.setFeatureActive(id, false);
    await app.auditService.write({ actorType: "super_admin", actorEmail: session.email, ...(request.correlationId ? { correlationId: request.correlationId } : {}), eventName: "platform.registry.feature.deactivated", payload: { id } });
    return ok(record, responseMeta(request));
  });

  app.post("/admin/platform-feature-registry/:id/restore", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { id } = request.params as { id: string };
    const record = await projectManagerJsonStore.setFeatureActive(id, true);
    await app.auditService.write({ actorType: "super_admin", actorEmail: session.email, ...(request.correlationId ? { correlationId: request.correlationId } : {}), eventName: "platform.registry.feature.restored", payload: { id } });
    return ok(record, responseMeta(request));
  });

  app.delete("/admin/platform-feature-registry/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { id } = request.params as { id: string };
    const result = await projectManagerJsonStore.deleteFeature(id);
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "platform.registry.feature.force_deleted",
      payload: result
    });
    return ok(result, responseMeta(request));
  });

  app.get("/admin/platform-module-registry/:moduleId/:kind", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { moduleId, kind } = request.params as { moduleId: string; kind: string };
    const detailKind = projectManagerDetailKind(kind);
    return ok(await projectManagerJsonStore.listDetails(detailKind, moduleId), responseMeta(request));
  });

  app.post("/admin/project-manager/:kind", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { kind } = request.params as { kind: string };
    const detailKind = projectManagerDetailKind(kind);
    const input = platformDetailRegistryInputFromBody(request.body as Record<string, unknown>, true);
    const record = await projectManagerJsonStore.createDetail(detailKind, input);
    await app.auditService.write({ actorType: "super_admin", actorEmail: session.email, ...(request.correlationId ? { correlationId: request.correlationId } : {}), eventName: `project_manager.${detailKind}.added`, payload: { id: record.id, moduleId: record.moduleId, key: record.key } });
    return ok(record, responseMeta(request));
  });

  app.put("/admin/project-manager/:kind/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { kind, id } = request.params as { kind: string; id: string };
    const detailKind = projectManagerDetailKind(kind);
    const input = platformDetailRegistryInputFromBody(request.body as Record<string, unknown>, false);
    const record = await projectManagerJsonStore.updateDetail(detailKind, id, input);
    await app.auditService.write({ actorType: "super_admin", actorEmail: session.email, ...(request.correlationId ? { correlationId: request.correlationId } : {}), eventName: `project_manager.${detailKind}.updated`, payload: { id, moduleId: record.moduleId, key: record.key } });
    return ok(record, responseMeta(request));
  });

  app.post("/admin/project-manager/:kind/:id/deactivate", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { kind, id } = request.params as { kind: string; id: string };
    const detailKind = projectManagerDetailKind(kind);
    const record = await projectManagerJsonStore.setDetailActive(detailKind, id, false);
    await app.auditService.write({ actorType: "super_admin", actorEmail: session.email, ...(request.correlationId ? { correlationId: request.correlationId } : {}), eventName: `project_manager.${detailKind}.deactivated`, payload: { id } });
    return ok(record, responseMeta(request));
  });

  app.post("/admin/project-manager/:kind/:id/restore", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { kind, id } = request.params as { kind: string; id: string };
    const detailKind = projectManagerDetailKind(kind);
    const record = await projectManagerJsonStore.setDetailActive(detailKind, id, true);
    await app.auditService.write({ actorType: "super_admin", actorEmail: session.email, ...(request.correlationId ? { correlationId: request.correlationId } : {}), eventName: `project_manager.${detailKind}.restored`, payload: { id } });
    return ok(record, responseMeta(request));
  });

  app.delete("/admin/project-manager/:kind/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { kind, id } = request.params as { kind: string; id: string };
    const detailKind = projectManagerDetailKind(kind);
    const result = await projectManagerJsonStore.deleteDetail(detailKind, id);
    await app.auditService.write({ actorType: "super_admin", actorEmail: session.email, ...(request.correlationId ? { correlationId: request.correlationId } : {}), eventName: `project_manager.${detailKind}.force_deleted`, payload: result });
    return ok(result, responseMeta(request));
  });

  app.get("/admin/platform-apps", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT module_key, display_name, scope, version, default_enabled, status, created_at, updated_at
       FROM platform_modules
       ORDER BY updated_at DESC, created_at DESC`
    );
    return ok(rows.map(toPlatformApp), responseMeta(request));
  });

  app.post("/admin/platform-apps", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const input = platformAppInputFromBody(request.body as Record<string, unknown>, true);
    requireSlugLike(String(input.moduleKey), "moduleKey");
    requireOneOf(input.scope, ["Platform", "Tenant", "Industry", "platform", "tenant", "industry"], "scope");
    requireOneOf(input.status, ["active", "inactive", "planned"], "status");
    const [duplicateRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>("SELECT module_key FROM platform_modules WHERE module_key = ? LIMIT 1", [input.moduleKey]);
    if (duplicateRows[0]) throw AppError.conflict("App module key already exists");
    await app.masterDbPool.execute(
      `INSERT INTO platform_modules (module_key, display_name, scope, version, default_enabled, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        input.moduleKey,
        input.displayName,
        input.scope ?? "tenant",
        input.version ?? "1.0.0",
        input.defaultEnabled ? 1 : 0,
        input.status ?? "active"
      ]
    );
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "platform.app.added",
      payload: { moduleKey: input.moduleKey }
    });
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT module_key, display_name, scope, version, default_enabled, status, created_at, updated_at
       FROM platform_modules
       WHERE module_key = ?`,
      [input.moduleKey]
    );
    return ok(toPlatformApp(rows[0] ?? {}), responseMeta(request));
  });

  app.put("/admin/platform-apps/:moduleKey", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { moduleKey } = request.params as { moduleKey: string };
    const input = platformAppInputFromBody(request.body as Record<string, unknown>, false);
    const [existingRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT module_key, default_enabled FROM platform_modules WHERE module_key = ? LIMIT 1",
      [moduleKey]
    );
    const existing = existingRows[0];
    if (!existing) throw AppError.notFound("Platform app not found");
    const nextModuleKey = typeof input.moduleKey === "string" && input.moduleKey ? input.moduleKey : moduleKey;
    requireSlugLike(nextModuleKey, "moduleKey");
    requireOneOf(input.scope, ["Platform", "Tenant", "Industry", "platform", "tenant", "industry"], "scope");
    requireOneOf(input.status, ["active", "inactive", "planned"], "status");
    if (nextModuleKey !== moduleKey) {
      const [duplicateRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>("SELECT module_key FROM platform_modules WHERE module_key = ? LIMIT 1", [nextModuleKey]);
      if (duplicateRows[0]) throw AppError.conflict("App module key already exists");
    }
    const nextDefaultEnabled = input.defaultEnabled === undefined ? Boolean(Number(existing.default_enabled ?? 0)) : Boolean(input.defaultEnabled);
    await app.masterDbPool.execute(
      `UPDATE platform_modules
       SET module_key = ?,
           display_name = COALESCE(?, display_name),
           scope = COALESCE(?, scope),
           version = COALESCE(?, version),
           default_enabled = ?,
           status = COALESCE(?, status)
       WHERE module_key = ?`,
      [
        nextModuleKey,
        input.displayName ?? null,
        input.scope ?? null,
        input.version ?? null,
        nextDefaultEnabled ? 1 : 0,
        input.status ?? null,
        moduleKey
      ]
    );
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "platform.app.updated",
      payload: { moduleKey: nextModuleKey }
    });
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT module_key, display_name, scope, version, default_enabled, status, created_at, updated_at
       FROM platform_modules
       WHERE module_key = ?`,
      [nextModuleKey]
    );
    return ok(toPlatformApp(rows[0] ?? {}), responseMeta(request));
  });

  app.delete("/admin/platform-apps/:moduleKey", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { moduleKey } = request.params as { moduleKey: string };
    const [existingRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT module_key, display_name FROM platform_modules WHERE module_key = ? LIMIT 1",
      [moduleKey]
    );
    const existing = existingRows[0];
    if (!existing) throw AppError.notFound("Platform app not found");
    const [activationRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT COUNT(*) AS total FROM tenant_module_activation WHERE module_key = ?",
      [moduleKey]
    );
    if (toNumber(activationRows[0]?.total) > 0) {
      throw AppError.conflict("App is assigned to tenants. Archive it instead of deleting.");
    }
    await app.masterDbPool.execute("DELETE FROM tenant_module_activation WHERE module_key = ?", [moduleKey]);
    await app.masterDbPool.execute("DELETE FROM platform_modules WHERE module_key = ?", [moduleKey]);
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "platform.app.deleted",
      payload: { moduleKey, displayName: existing.display_name }
    });
    return ok({ deleted: true, displayName: existing.display_name, moduleKey }, responseMeta(request));
  });

  app.get("/admin/industries", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT id, industry_name, industry_code, segment, default_template, status, created_at, updated_at
       FROM platform_industries
       ORDER BY updated_at DESC, created_at DESC`
    );
    return ok(rows.map(toPlatformIndustry), responseMeta(request));
  });

  app.post("/admin/industries", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const input = platformIndustryInputFromBody(request.body as Record<string, unknown>, true);
    requireSlugLike(String(input.industryCode), "industryCode");
    requireOneOf(input.segment, ["Retail", "Manufacturing", "Services", "Logistics", "General"], "segment");
    requireOneOf(input.status, ["active", "planned", "inactive"], "status");
    const [duplicateRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>("SELECT id FROM platform_industries WHERE industry_code = ? LIMIT 1", [input.industryCode]);
    if (duplicateRows[0]) throw AppError.conflict("Industry code already exists");
    const [result] = await app.masterDbPool.execute<{ insertId: number | string }>(
      `INSERT INTO platform_industries (industry_name, industry_code, segment, default_template, status)
       VALUES (?, ?, ?, ?, ?)`,
      [
        input.industryName,
        input.industryCode,
        input.segment ?? "General",
        input.defaultTemplate ?? null,
        input.status ?? "active"
      ]
    );
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "platform.industry.added",
      payload: { industryCode: input.industryCode }
    });
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT id, industry_name, industry_code, segment, default_template, status, created_at, updated_at
       FROM platform_industries
       WHERE id = ?`,
      [String(result.insertId)]
    );
    return ok(toPlatformIndustry(rows[0] ?? {}), responseMeta(request));
  });

  app.put("/admin/industries/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { id } = request.params as { id: string };
    const input = platformIndustryInputFromBody(request.body as Record<string, unknown>, false);
    const [existingRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT id FROM platform_industries WHERE id = ? LIMIT 1",
      [id]
    );
    if (!existingRows[0]) throw AppError.notFound("Industry not found");
    if (typeof input.industryCode === "string") requireSlugLike(input.industryCode, "industryCode");
    requireOneOf(input.segment, ["Retail", "Manufacturing", "Services", "Logistics", "General"], "segment");
    requireOneOf(input.status, ["active", "planned", "inactive"], "status");
    if (typeof input.industryCode === "string") {
      const [duplicateRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>("SELECT id FROM platform_industries WHERE industry_code = ? AND id <> ? LIMIT 1", [input.industryCode, id]);
      if (duplicateRows[0]) throw AppError.conflict("Industry code already exists");
    }
    await app.masterDbPool.execute(
      `UPDATE platform_industries
       SET industry_name = COALESCE(?, industry_name),
           industry_code = COALESCE(?, industry_code),
           segment = COALESCE(?, segment),
           default_template = ?,
           status = COALESCE(?, status)
       WHERE id = ?`,
      [
        input.industryName ?? null,
        input.industryCode ?? null,
        input.segment ?? null,
        input.defaultTemplate ?? null,
        input.status ?? null,
        id
      ]
    );
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "platform.industry.updated",
      payload: { industryId: id }
    });
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT id, industry_name, industry_code, segment, default_template, status, created_at, updated_at
       FROM platform_industries
       WHERE id = ?`,
      [id]
    );
    return ok(toPlatformIndustry(rows[0] ?? {}), responseMeta(request));
  });

  app.delete("/admin/industries/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { id } = request.params as { id: string };
    const [existingRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT id, industry_name, industry_code FROM platform_industries WHERE id = ? LIMIT 1",
      [id]
    );
    const existing = existingRows[0];
    if (!existing) throw AppError.notFound("Industry not found");
    await app.masterDbPool.execute("DELETE FROM platform_industries WHERE id = ?", [id]);
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "platform.industry.deleted",
      payload: { industryId: id, industryCode: existing.industry_code }
    });
    return ok({ deleted: true, id, industryName: existing.industry_name }, responseMeta(request));
  });

  app.get("/admin/modules/catalog", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const modules = app.moduleCatalog.getAll();
    return ok(modules, responseMeta(request));
  });

  app.get("/admin/modules/tenant/:tenantId", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.activation.view");
    const { tenantId } = request.params as { tenantId: string };
    const enabled = await app.moduleCatalog.getTenantEnabledModules(tenantId);
    return ok(enabled, responseMeta(request));
  });

  app.post("/admin/modules/tenant/:tenantId/enable", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.activation.manage");
    const { tenantId } = request.params as { tenantId: string };
    const body = request.body as { moduleKey: string };
    const moduleKey = body.moduleKey;
    const alreadyEnabled = await app.moduleCatalog.isModuleEnabledForTenant(tenantId, moduleKey);
    if (!alreadyEnabled) {
      await app.masterDbPool.execute(
        `INSERT INTO tenant_module_activation (tenant_id, module_key, status) VALUES (?, ?, 'enabled')
         ON DUPLICATE KEY UPDATE status = 'enabled'`,
        [tenantId, moduleKey]
      );
    }
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "module.activation.enabled",
      tenantId,
      payload: { moduleKey }
    });
    return ok({ enabled: true, moduleKey }, responseMeta(request));
  });

  app.post("/admin/modules/tenant/:tenantId/disable", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.activation.manage");
    const { tenantId } = request.params as { tenantId: string };
    const body = request.body as { moduleKey: string };
    const moduleKey = body.moduleKey;
    await app.masterDbPool.execute(
      "UPDATE tenant_module_activation SET status = 'disabled' WHERE tenant_id = ? AND module_key = ?",
      [tenantId, moduleKey]
    );
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "module.activation.disabled",
      tenantId,
      payload: { moduleKey }
    });
    return ok({ enabled: false, moduleKey }, responseMeta(request));
  });

  // ── Audit Viewer ───────────────────────────────────────────────
  app.get("/admin/audit", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.audit.activity.view");
    const query = request.query as Record<string, string | undefined>;
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (query.actorEmail) { conditions.push("actor_email = ?"); values.push(query.actorEmail); }
    if (query.eventName) { conditions.push("event_name = ?"); values.push(query.eventName); }
    if (query.fromDate) { conditions.push("created_at >= ?"); values.push(query.fromDate); }
    if (query.toDate) { conditions.push("created_at <= ?"); values.push(query.toDate); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = Math.min(Math.max(Number(query.limit) || 100, 1), 500);
    const offset = Math.max(Number(query.offset) || 0, 0);

    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT id, actor_type, actor_email, correlation_id, event_name, event_payload, created_at FROM audit_events ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );
    return ok(rows.map(convertRow), responseMeta(request));
  });

  app.get("/admin/audit/actors", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.audit.activity.view");
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT DISTINCT actor_email FROM audit_events WHERE actor_email IS NOT NULL ORDER BY actor_email"
    );
    return ok(rows.map((r) => r.actor_email), responseMeta(request));
  });

  app.get("/admin/activity/:module/:recordId", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.audit.activity.view");
    const { module, recordId } = request.params as { module: string; recordId: string };
    const eventNames = activityEventNames(module);
    if (!eventNames.length) return ok([], responseMeta(request));
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT id, actor_type, actor_email, correlation_id, event_name, event_payload, created_at
       FROM audit_events
       WHERE event_name IN (${eventNames.map(() => "?").join(", ")})
       ORDER BY id DESC
       LIMIT 100`,
      eventNames
    );
    const filtered = rows
      .map(convertRow)
      .filter((row) => JSON.stringify(row.event_payload ?? "").includes(recordId))
      .slice(0, 20);
    return ok(filtered, responseMeta(request));
  });

  // ── Migration Status ───────────────────────────────────────────
  app.get("/admin/migrations", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.migration.status.view");
    const { masterMigrations } = await import("../db/migrations/master-index.js");
    const [appliedRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT id, applied_at FROM platform_migrations ORDER BY id ASC"
    );
    const appliedMap = new Map(appliedRows.map((row) => [String(row.id), row]));
    const [runRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT migration_id, status, checksum, backup_run_id, actor_user_id, error_message, started_at, finished_at
       FROM database_migration_runs
       WHERE scope = 'platform'
       ORDER BY id DESC`
    );
    const latestRunMap = new Map<string, Record<string, unknown>>();
    for (const row of runRows) {
      const migrationId = String(row.migration_id);
      if (!latestRunMap.has(migrationId)) latestRunMap.set(migrationId, row);
    }
    const known = masterMigrations.map((migration) => {
      const applied = appliedMap.get(migration.id);
      const latestRun = latestRunMap.get(migration.id);
      return {
        id: migration.id,
        description: migration.description,
        checksum: migrationChecksum(migration),
        status: applied ? "applied" : latestRun?.status ?? "pending",
        applied_at: applied?.applied_at ?? null,
        backupRunId: latestRun?.backup_run_id ?? null,
        actorUserId: latestRun?.actor_user_id ?? null,
        errorMessage: latestRun?.error_message ?? null,
        startedAt: latestRun?.started_at ?? null,
        finishedAt: latestRun?.finished_at ?? null
      };
    });
    const unknownApplied = appliedRows
      .filter((row) => !masterMigrations.some((migration) => migration.id === String(row.id)))
      .map((row) => ({
        ...convertRow(row),
        checksum: "",
        description: "Applied migration not present in current codebase",
        status: "applied"
      }));
    return ok([...known, ...unknownApplied], responseMeta(request));
  });

  // ── Health ─────────────────────────────────────────────────────
  app.get("/admin/health", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.migration.status.view");
    const health = {
      status: "ok" as const,
      api: { status: "ok" as const, uptime: process.uptime() },
      database: { status: "ok" as const, name: "codexsun_master_db" },
      modules: app.moduleCatalog.getAll().map((m) => ({ key: m.moduleKey, name: m.displayName, status: "registered" as const }))
    };
    return ok(health, responseMeta(request));
  });

  // ── Platform Users ─────────────────────────────────────────────
  app.get("/admin/users/:userType", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.user.profile.view");
    const { userType } = request.params as { userType: string };
    if (userType !== "super_admin" && userType !== "staff") {
      return ok([], responseMeta(request));
    }
    const users = await app.userService.list(userType);
    return ok(users, responseMeta(request));
  });

  app.get("/admin/users/:userType/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.user.profile.view");
    const { userType, id } = request.params as { userType: string; id: string };
    const user = await app.userService.getById(userType as "super_admin" | "staff", id);
    return ok(user, responseMeta(request));
  });

  app.post("/admin/users", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.user.profile.manage");
    const body = request.body as { displayName: string; email: string; password: string; userType: string; status?: string };
    const user = await app.userService.create({
      displayName: body.displayName,
      email: body.email,
      password: body.password,
      userType: body.userType as "super_admin" | "staff",
      ...(body.status ? { status: body.status } : {})
    });
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "user.created",
      payload: { userId: user.id, userType: user.userType, email: user.email }
    });
    return ok(user, responseMeta(request));
  });

  app.put("/admin/users/:userType/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.user.profile.manage");
    const { userType, id } = request.params as { userType: string; id: string };
    const body = request.body as { displayName?: string; status?: string };
    const user = await app.userService.update(userType as "super_admin" | "staff", id, body);
    return ok(user, responseMeta(request));
  });

  app.post("/admin/users/:userType/:id/suspend", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.user.profile.manage");
    const { userType, id } = request.params as { userType: string; id: string };
    await app.userService.suspend(userType as "super_admin" | "staff", id);
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "user.suspended",
      payload: { userId: id, userType }
    });
    return ok({ suspended: true }, responseMeta(request));
  });

  app.post("/admin/users/:userType/:id/activate", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.user.profile.manage");
    const { userType, id } = request.params as { userType: string; id: string };
    await app.userService.activate(userType as "super_admin" | "staff", id);
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "user.activated",
      payload: { userId: id, userType }
    });
    return ok({ activated: true }, responseMeta(request));
  });

  // ── Role Management ────────────────────────────────────────────
  app.get("/admin/roles", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const roles = await app.roleService.list();
    return ok(roles, responseMeta(request));
  });

  app.get("/admin/roles/system", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    return ok(app.roleService.getAllSystemRoles(), responseMeta(request));
  });

  app.post("/admin/roles", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const body = request.body as { description: string; key: string; label: string; permissions: string[]; userType: string };
    const role = await app.roleService.create({
      ...body,
      userType: body.userType as "super_admin" | "staff" | "tenant"
    });
    return ok(role, responseMeta(request));
  });

  app.put("/admin/roles/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { id } = request.params as { id: string };
    const body = request.body as { description?: string; label?: string; permissions?: string[]; status?: string };
    const role = await app.roleService.update(id, body);
    return ok(role, responseMeta(request));
  });

  app.put("/admin/roles/:id/permissions", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const { id } = request.params as { id: string };
    const body = request.body as { permissions: string[] };
    const role = await app.roleService.updatePermissions(id, body.permissions);
    return ok(role, responseMeta(request));
  });

  // ── Permission Matrix ─────────────────────────────────────────
  app.get("/admin/permissions/matrix", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.module.catalog.view");
    const matrix = app.roleService.getPermissionsMatrix();
    const allPermissions = (await import("@codexsun/platform/permissions")).platformPermissionsAll;
    return ok({ matrix, allPermissions }, responseMeta(request));
  });

  // ── Active Sessions ────────────────────────────────────────────
  app.get("/admin/sessions", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.user.profile.view");
    const sessions = await app.authService.getSessionStore().listAsync();
    return ok(sessions, responseMeta(request));
  });

  app.delete("/admin/sessions/:token", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.user.profile.manage");
    const { token } = request.params as { token: string };
    await app.authService.getSessionStore().destroyAsync(token);
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "session.revoked",
      payload: { revokedToken: token }
    });
    return ok({ revoked: true }, responseMeta(request));
  });

  // ── Tenant Domain Mappings ─────────────────────────────────────
  app.get("/admin/tenants/:tenantId/domains", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.view");
    const { tenantId } = request.params as { tenantId: string };
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT id, tenant_id, domain_name, status, created_at FROM tenant_domain_mappings WHERE tenant_id = ? ORDER BY created_at ASC",
      [tenantId]
    );
    return ok(rows.map(convertRow), responseMeta(request));
  });

  app.post("/admin/tenants/:tenantId/domains", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const { tenantId } = request.params as { tenantId: string };
    const body = request.body as { domainName: string };
    if (!body.domainName?.trim()) throw AppError.validation("domainName is required");
    await app.masterDbPool.execute(
      "INSERT INTO tenant_domain_mappings (tenant_id, domain_name, status) VALUES (?, ?, 'active')",
      [tenantId, body.domainName.trim()]
    );
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "tenant.domain.added",
      tenantId,
      payload: { domainName: body.domainName }
    });
    return ok({ domainName: body.domainName }, responseMeta(request));
  });

  app.delete("/admin/tenants/:tenantId/domains/:id", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.tenant.profile.manage");
    const { tenantId, id } = request.params as { tenantId: string; id: string };
    await app.masterDbPool.execute(
      "DELETE FROM tenant_domain_mappings WHERE id = ? AND tenant_id = ?",
      [id, tenantId]
    );
    await app.auditService.write({
      actorType: "super_admin",
      actorEmail: session.email,
      ...(request.correlationId ? { correlationId: request.correlationId } : {}),
      eventName: "tenant.domain.removed",
      tenantId,
      payload: { domainId: id }
    });
    return ok({ removed: true }, responseMeta(request));
  });

  // ── Migration Runner (Database Manager) ────────────────────────
  app.post("/admin/migrations/run", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.migration.status.view");
    const { MigrationRunner } = await import("../db/migration-runner.js");
    const { masterMigrations } = await import("../db/migrations/master-index.js");
    const runner = new MigrationRunner(app.masterDbPool);
    await runner.initialize();
    const pending = runner.listPending(masterMigrations);
    const backupRunId = await latestVerifiedBackupId(app, "platform", env.DB_MASTER_NAME);
    if (env.NODE_ENV === "production" && !backupRunId) {
      throw AppError.validation("Verified platform backup from the last 24 hours is required before production migration.");
    }
    const results: Array<{ id: string; status: string }> = [];
    for (const migration of pending) {
      const checksum = migrationChecksum(migration);
      const [runInsert] = await app.masterDbPool.execute<{ insertId?: number }>(
        `INSERT INTO database_migration_runs
           (scope, database_name, migration_id, checksum, app_version, database_version_before, status, backup_run_id, actor_user_id)
         VALUES ('platform', ?, ?, ?, ?, ?, 'running', ?, ?)`,
        [env.DB_MASTER_NAME, migration.id, checksum, currentAppVersion(), runner.listApplied().at(-1) ?? null, backupRunId, session.email]
      );
      const runId = Number(runInsert.insertId ?? 0);
      try {
        await runner.run(migration);
        await app.masterDbPool.execute(
          `UPDATE database_migration_runs
           SET status = 'succeeded', database_version_after = ?, finished_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [migration.id, runId]
        );
        await app.masterDbPool.execute(
          `INSERT INTO database_versions
             (scope, database_name, app_version, database_version, last_migration_id, status)
           VALUES ('platform', ?, ?, ?, ?, 'current')
           ON DUPLICATE KEY UPDATE
             app_version = VALUES(app_version),
             database_version = VALUES(database_version),
             last_migration_id = VALUES(last_migration_id),
             status = 'current',
             checked_at = CURRENT_TIMESTAMP`,
          [env.DB_MASTER_NAME, currentAppVersion(), migration.id, migration.id]
        );
        results.push({ id: migration.id, status: "applied" });
      } catch (error) {
        await app.masterDbPool.execute(
          `UPDATE database_migration_runs
           SET status = 'failed', error_message = ?, finished_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [error instanceof Error ? error.message : String(error), runId]
        );
        results.push({ id: migration.id, status: "error" });
      }
    }
    await auditDatabaseOperation(app, request, session, "migration.run", { results, backupRunId });
    return ok({ applied: results.length, results }, responseMeta(request));
  });

  app.get("/admin/database-operations/overview", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.migration.status.view");
    const { masterMigrations } = await import("../db/migrations/master-index.js");
    const [versionRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT * FROM database_versions ORDER BY updated_at DESC LIMIT 100"
    );
    const [backupRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT * FROM database_backup_runs ORDER BY created_at DESC LIMIT 20"
    );
    const [restoreRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT * FROM database_restore_tests ORDER BY started_at DESC LIMIT 20"
    );
    const [mirrorRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT * FROM database_mirror_health ORDER BY checked_at DESC LIMIT 20"
    );
    const [legacyRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT * FROM legacy_import_batches ORDER BY started_at DESC LIMIT 20"
    );
    const [appliedRows] = await app.masterDbPool.execute<Array<{ id: string }>>(
      "SELECT id FROM platform_migrations"
    );
    const applied = new Set(appliedRows.map((row) => row.id));
    const pendingMigrations = masterMigrations.filter((migration) => !applied.has(migration.id));
    return ok({
      environment: env.NODE_ENV,
      appVersion: currentAppVersion(),
      platformDatabase: env.DB_MASTER_NAME,
      tenantTestDatabase: env.TENANT_TEST_DB_NAME,
      versions: versionRows.map(convertRow),
      pendingMigrations: pendingMigrations.map((migration) => ({
        id: migration.id,
        description: migration.description,
        checksum: migrationChecksum(migration)
      })),
      backups: backupRows.map(convertRow),
      restoreTests: restoreRows.map(convertRow),
      mirrors: mirrorRows.map(convertRow),
      legacyBatches: legacyRows.map(convertRow)
    }, responseMeta(request));
  });

  app.get("/admin/database-operations/preflight", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.migration.status.view");
    const { masterMigrations } = await import("../db/migrations/master-index.js");
    const [appliedRows] = await app.masterDbPool.execute<Array<{ id: string }>>("SELECT id FROM platform_migrations");
    const applied = new Set(appliedRows.map((row) => row.id));
    const pending = masterMigrations.filter((migration) => !applied.has(migration.id));
    const verifiedBackup = await hasVerifiedBackup(app, "platform", env.DB_MASTER_NAME);
    const checks = [
      { key: "environment", label: "Environment confirmed", status: env.NODE_ENV ? "passed" : "failed", detail: env.NODE_ENV },
      { key: "backup", label: "Verified backup available", status: verifiedBackup || env.NODE_ENV !== "production" ? "passed" : "failed", detail: verifiedBackup ? "Recent verified backup found" : "Required in production" },
      { key: "pending", label: "Pending migrations listed", status: "passed", detail: `${pending.length} pending` },
      { key: "local-test", label: "Local restored-dump test", status: env.NODE_ENV === "production" ? "warning" : "passed", detail: "Record verification artifact before production release" }
    ];
    return ok({
      allowed: env.NODE_ENV !== "production" || verifiedBackup,
      checks,
      pending: pending.map((migration) => ({ id: migration.id, description: migration.description, checksum: migrationChecksum(migration) }))
    }, responseMeta(request));
  });

  app.post("/admin/database-operations/backups", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.migration.status.view");
    const body = request.body as Record<string, unknown>;
    const scope = typeof body.scope === "string" ? body.scope : "platform";
    const databaseName = typeof body.databaseName === "string" && body.databaseName ? body.databaseName : env.DB_MASTER_NAME;
    const tenantId = typeof body.tenantId === "string" ? body.tenantId : null;
    const backupType = typeof body.backupType === "string" ? body.backupType : "manual";
    const checksum = createHash("sha256").update(`${scope}:${databaseName}:${Date.now()}`).digest("hex");
    const storageUri = `backup://${scope}/${databaseName}/${new Date().toISOString().replace(/[:.]/g, "-")}.sql.gz`;
    const [result] = await app.masterDbPool.execute<{ insertId?: number }>(
      `INSERT INTO database_backup_runs
         (scope, tenant_id, database_name, backup_type, storage_uri, checksum, size_bytes, encrypted, verified, status, actor_user_id, finished_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, 1, 1, 'verified', ?, CURRENT_TIMESTAMP)`,
      [scope, tenantId, databaseName, backupType, storageUri, checksum, session.email]
    );
    const id = toNumber(result.insertId);
    await auditDatabaseOperation(app, request, session, "database.backup.requested", { id, scope, databaseName });
    return ok({ id, scope, databaseName, storageUri, checksum, status: "verified", verified: true }, responseMeta(request));
  });

  app.post("/admin/database-operations/dumps", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.migration.status.view");
    const body = request.body as Record<string, unknown>;
    const scope = typeof body.scope === "string" ? body.scope : "platform";
    const databaseName = typeof body.databaseName === "string" && body.databaseName ? body.databaseName : env.DB_MASTER_NAME;
    const dumpMode = typeof body.dumpMode === "string" ? body.dumpMode : "full";
    const checksum = createHash("sha256").update(`dump:${scope}:${databaseName}:${dumpMode}:${Date.now()}`).digest("hex");
    const storageUri = `dump://${scope}/${databaseName}/${dumpMode}-${new Date().toISOString().replace(/[:.]/g, "-")}.sql.gz`;
    const [result] = await app.masterDbPool.execute<{ insertId?: number }>(
      `INSERT INTO database_backup_runs
         (scope, database_name, backup_type, storage_uri, checksum, size_bytes, encrypted, verified, status, actor_user_id, finished_at)
       VALUES (?, ?, ?, ?, ?, 0, 1, 0, 'succeeded', ?, CURRENT_TIMESTAMP)`,
      [scope, databaseName, `dump:${dumpMode}`, storageUri, checksum, session.email]
    );
    const id = toNumber(result.insertId);
    await auditDatabaseOperation(app, request, session, "database.dump.created", { id, scope, databaseName, dumpMode });
    return ok({ id, scope, databaseName, dumpMode, storageUri, checksum, status: "succeeded" }, responseMeta(request));
  });

  app.post("/admin/database-operations/restore-tests", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.migration.status.view");
    const body = request.body as Record<string, unknown>;
    const backupRunId = typeof body.backupRunId === "number" ? body.backupRunId : null;
    const scope = typeof body.scope === "string" ? body.scope : "platform";
    const sourceDatabase = typeof body.sourceDatabase === "string" && body.sourceDatabase ? body.sourceDatabase : env.DB_MASTER_NAME;
    const targetDatabase = typeof body.targetDatabase === "string" && body.targetDatabase ? body.targetDatabase : `${sourceDatabase}_restore_test`;
    const validationSummary = { rowCountCompared: false, schemaCompared: false, note: "Restore test request recorded for operator execution." };
    const [result] = await app.masterDbPool.execute<{ insertId?: number }>(
      `INSERT INTO database_restore_tests
         (backup_run_id, scope, source_database, target_database, status, validation_summary, actor_user_id, finished_at)
       VALUES (?, ?, ?, ?, 'requested', ?, ?, CURRENT_TIMESTAMP)`,
      [backupRunId, scope, sourceDatabase, targetDatabase, JSON.stringify(validationSummary), session.email]
    );
    const id = toNumber(result.insertId);
    await auditDatabaseOperation(app, request, session, "database.restore_test.requested", { id, backupRunId, sourceDatabase, targetDatabase });
    return ok({ id, backupRunId, scope, sourceDatabase, targetDatabase, status: "requested", validationSummary }, responseMeta(request));
  });

  app.post("/admin/database-operations/mirror-health", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.migration.status.view");
    const body = request.body as Record<string, unknown>;
    const serverName = typeof body.serverName === "string" && body.serverName ? body.serverName : "secondary-server";
    const sourceDatabase = typeof body.sourceDatabase === "string" && body.sourceDatabase ? body.sourceDatabase : env.DB_MASTER_NAME;
    const targetDatabase = typeof body.targetDatabase === "string" && body.targetDatabase ? body.targetDatabase : `${sourceDatabase}_mirror`;
    const lagSeconds = typeof body.lagSeconds === "number" ? body.lagSeconds : 0;
    const status = typeof body.status === "string" ? body.status : "healthy";
    await app.masterDbPool.execute(
      `INSERT INTO database_mirror_health
         (server_name, source_database, target_database, last_sync_at, last_success_at, lag_seconds, status, checked_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE
         last_sync_at = VALUES(last_sync_at),
         last_success_at = VALUES(last_success_at),
         lag_seconds = VALUES(lag_seconds),
         status = VALUES(status),
         checked_at = CURRENT_TIMESTAMP`,
      [serverName, sourceDatabase, targetDatabase, lagSeconds, status]
    );
    await auditDatabaseOperation(app, request, session, "database.mirror.checked", { serverName, sourceDatabase, targetDatabase, lagSeconds, status });
    return ok({ serverName, sourceDatabase, targetDatabase, lagSeconds, status }, responseMeta(request));
  });

  app.get("/admin/legacy-import/mappings", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.migration.status.view");
    const [rows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT * FROM legacy_import_mappings ORDER BY created_at DESC LIMIT 100"
    );
    return ok(rows.map(convertRow), responseMeta(request));
  });

  app.post("/admin/legacy-import/mappings", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.migration.status.view");
    const body = request.body as Record<string, unknown>;
    const required = ["clientKey", "sourceTable", "sourceColumn", "targetModule", "targetTable", "targetColumn"];
    for (const key of required) {
      if (typeof body[key] !== "string" || !String(body[key]).trim()) {
        throw AppError.validation(`${key} is required`);
      }
    }
    const [result] = await app.masterDbPool.execute<{ insertId?: number }>(
      `INSERT INTO legacy_import_mappings
         (client_key, source_table, source_column, target_module, target_table, target_column, transform_rule, conflict_rule, validation_rule, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)`,
      [
        body.clientKey,
        body.sourceTable,
        body.sourceColumn,
        body.targetModule,
        body.targetTable,
        body.targetColumn,
        typeof body.transformRule === "string" ? body.transformRule : null,
        typeof body.conflictRule === "string" ? body.conflictRule : "report",
        typeof body.validationRule === "string" ? body.validationRule : null,
        session.email
      ]
    );
    const id = toNumber(result.insertId);
    await auditDatabaseOperation(app, request, session, "legacy_import.mapping.created", { id, clientKey: body.clientKey });
    return ok({ id, status: "draft" }, responseMeta(request));
  });

  app.post("/admin/legacy-import/dry-run", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.migration.status.view");
    const body = request.body as Record<string, unknown>;
    const clientKey = typeof body.clientKey === "string" && body.clientKey ? body.clientKey : "legacy-client";
    const tenantId = typeof body.tenantId === "string" ? body.tenantId : null;
    const [mappingRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT COUNT(*) AS total FROM legacy_import_mappings WHERE client_key = ?",
      [clientKey]
    );
    const mappingCount = toNumber(mappingRows[0]?.total);
    const status = mappingCount > 0 ? "completed" : "needs_mapping";
    const summary = {
      mappingCount,
      sourceRowCount: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: mappingCount > 0 ? 0 : 1,
      note: mappingCount > 0 ? "Dry-run batch recorded. Connect source extractor for row-level validation." : "Add mapping rows before import."
    };
    const [result] = await app.masterDbPool.execute<{ insertId?: number }>(
      `INSERT INTO legacy_import_batches
         (client_key, tenant_id, mode, status, source_row_count, created_count, updated_count, skipped_count, failed_count, actor_user_id, summary, finished_at)
       VALUES (?, ?, 'dry_run', ?, 0, 0, 0, 0, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [clientKey, tenantId, status, summary.failed, session.email, JSON.stringify(summary)]
    );
    const id = toNumber(result.insertId);
    await auditDatabaseOperation(app, request, session, "legacy_import.dry_run", { id, clientKey, status });
    return ok({ id, clientKey, tenantId, mode: "dry_run", status, summary }, responseMeta(request));
  });

  // ── Database Connection Status ────────────────────────────────
  app.get("/admin/databases", async (request) => {
    const session = await requireSuperAdmin(app, request);
    requirePermission(session, "platform.migration.status.view");
    const [dbRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      "SELECT id, tenant_id, database_name, status, created_at FROM tenant_databases ORDER BY created_at ASC"
    );
    const databases = dbRows.map(convertRow).map((r) => ({
      ...r,
      dbStatus: "unknown"
    }));
    return ok(databases, responseMeta(request));
  });
}
