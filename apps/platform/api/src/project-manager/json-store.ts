import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { AppError } from "@codexsun/framework/errors";

export type ProjectManagerPlatform = {
  active: boolean;
  description: string;
  id: string;
  name: string;
  platform: string;
  status: string;
  updatedAt: string;
};

export type ProjectManagerModuleGroup = {
  active: boolean;
  description: string;
  groupKey: string;
  id: string;
  name: string;
  platformRegistryId: string;
  sortOrder: number;
  status: string;
  updatedAt: string;
};

export type ProjectManagerModule = {
  active: boolean;
  description: string;
  id: string;
  moduleGroupId: string;
  moduleKey: string;
  name: string;
  routePath: string;
  sortOrder: number;
  status: string;
  updatedAt: string;
};

export type ProjectManagerFeature = {
  active: boolean;
  description: string;
  featureKey: string;
  id: string;
  moduleId: string;
  name: string;
  permissionKey: string;
  routePath: string;
  sortOrder: number;
  status: string;
  type: string;
  updatedAt: string;
};

export type ProjectManagerDetailKind = "action" | "api" | "screen" | "database" | "planning" | "note";

export type ProjectManagerDetailRecord = {
  active: boolean;
  auditEvent: string;
  componentPath: string;
  dependencyKeys: string[];
  description: string;
  defaultValue: string;
  featureId: string;
  fieldName: string;
  fieldNature: string;
  fieldType: string;
  id: string;
  indexed: boolean;
  kind: ProjectManagerDetailKind;
  key: string;
  lifecycleAction: boolean;
  method: string;
  migrationId: string;
  moduleId: string;
  name: string;
  nullable: boolean;
  operation: string;
  ownerTeam: string;
  pageType: string;
  permissionKey: string;
  relation: string;
  richNotes: string;
  riskLevel: string;
  routePath: string;
  scope: string;
  softDelete: boolean;
  sortOrder: number;
  status: string;
  subscriptionFlagKey: string;
  tableName: string;
  tableScope: string;
  tenantRequired: boolean;
  testPath: string;
  unique: boolean;
  updatedAt: string;
  version: string;
};

type JsonDatabase = {
  actions: ProjectManagerDetailRecord[];
  apis: ProjectManagerDetailRecord[];
  databaseObjects: ProjectManagerDetailRecord[];
  features: ProjectManagerFeature[];
  modules: ProjectManagerModule[];
  groups: ProjectManagerModuleGroup[];
  notes: ProjectManagerDetailRecord[];
  planning: ProjectManagerDetailRecord[];
  platforms: ProjectManagerPlatform[];
  screens: ProjectManagerDetailRecord[];
};

const databaseDir = join(process.cwd(), "project-manager-json");
const platformFile = join(databaseDir, "platform-registry.json");
const groupFile = join(databaseDir, "module-groups.json");
const moduleFile = join(databaseDir, "module-registry.json");
const featureFile = join(databaseDir, "feature-registry.json");
const actionFile = join(databaseDir, "action-registry.json");
const apiFile = join(databaseDir, "api-registry.json");
const screenFile = join(databaseDir, "screen-registry.json");
const databaseObjectFile = join(databaseDir, "database-registry.json");
const planningFile = join(databaseDir, "planning-registry.json");
const noteFile = join(databaseDir, "model-notes.json");
const resultFile = join(databaseDir, "result.json");

export const projectManagerJsonStore = {
  async listPlatforms() {
    const db = await loadDatabase();
    return sortByUpdated(db.platforms);
  },

  async createPlatform(input: Partial<ProjectManagerPlatform>) {
    const db = await loadDatabase();
    const name = required(input.name, "name");
    const platform = required(input.platform, "platform");
    if (db.platforms.some((item) => same(item.name, name) && same(item.platform, platform))) {
      throw AppError.conflict("Platform registry record already exists");
    }
    const record = withStatus({
      active: input.active ?? true,
      description: input.description ?? "",
      id: nextId("platform"),
      name,
      platform,
      updatedAt: now()
    });
    db.platforms.unshift(record);
    await saveDatabase(db);
    return record;
  },

  async updatePlatform(id: string, input: Partial<ProjectManagerPlatform>) {
    const db = await loadDatabase();
    const current = findById(db.platforms, id, "Platform registry record not found");
    const next = withStatus({
      ...current,
      ...defined({
        active: input.active,
        description: input.description,
        name: input.name,
        platform: input.platform
      }),
      updatedAt: now()
    });
    if (db.platforms.some((item) => item.id !== id && same(item.name, next.name) && same(item.platform, next.platform))) {
      throw AppError.conflict("Platform registry record already exists");
    }
    db.platforms = db.platforms.map((item) => (item.id === id ? next : item));
    await saveDatabase(db);
    return next;
  },

  async setPlatformActive(id: string, active: boolean) {
    return this.updatePlatform(id, { active });
  },

  async deletePlatform(id: string) {
    const db = await loadDatabase();
    const current = findById(db.platforms, id, "Platform registry record not found");
    const groupIds = new Set(db.groups.filter((group) => group.platformRegistryId === id).map((group) => group.id));
    const moduleIds = new Set(db.modules.filter((module) => groupIds.has(module.moduleGroupId)).map((module) => module.id));
    deleteDetailsByModuleIds(db, moduleIds);
    db.features = db.features.filter((feature) => !moduleIds.has(feature.moduleId));
    db.modules = db.modules.filter((module) => !groupIds.has(module.moduleGroupId));
    db.groups = db.groups.filter((group) => group.platformRegistryId !== id);
    db.platforms = db.platforms.filter((platform) => platform.id !== id);
    await saveDatabase(db);
    return { deleted: true, id, name: current.name };
  },

  async listGroups(platformRegistryId: string) {
    const db = await loadDatabase();
    return db.groups.filter((group) => group.platformRegistryId === platformRegistryId).sort(byOrder);
  },

  async createGroup(input: Partial<ProjectManagerModuleGroup>) {
    const db = await loadDatabase();
    const platformRegistryId = required(input.platformRegistryId, "platformRegistryId");
    findById(db.platforms, platformRegistryId, "Platform registry record not found");
    const groupKey = required(input.groupKey, "groupKey");
    const name = required(input.name, "name");
    if (db.groups.some((item) => item.platformRegistryId === platformRegistryId && same(item.groupKey, groupKey))) {
      throw AppError.conflict("Module group key already exists for this platform");
    }
    const record = withStatus({
      active: input.active ?? true,
      description: input.description ?? "",
      groupKey,
      id: nextId("group"),
      name,
      platformRegistryId,
      sortOrder: Number(input.sortOrder ?? 0),
      updatedAt: now()
    });
    db.groups.push(record);
    await saveDatabase(db);
    return record;
  },

  async updateGroup(id: string, input: Partial<ProjectManagerModuleGroup>) {
    const db = await loadDatabase();
    const current = findById(db.groups, id, "Module group not found");
    const next = withStatus({
      ...current,
      ...defined({
        active: input.active,
        description: input.description,
        groupKey: input.groupKey,
        name: input.name,
        platformRegistryId: input.platformRegistryId
      }),
      sortOrder: input.sortOrder === undefined ? current.sortOrder : Number(input.sortOrder),
      updatedAt: now()
    });
    if (db.groups.some((item) => item.id !== id && item.platformRegistryId === next.platformRegistryId && same(item.groupKey, next.groupKey))) {
      throw AppError.conflict("Module group key already exists for this platform");
    }
    db.groups = db.groups.map((item) => (item.id === id ? next : item));
    await saveDatabase(db);
    return next;
  },

  async setGroupActive(id: string, active: boolean) {
    return this.updateGroup(id, { active });
  },

  async deleteGroup(id: string) {
    const db = await loadDatabase();
    const current = findById(db.groups, id, "Module group not found");
    const moduleIds = new Set(db.modules.filter((module) => module.moduleGroupId === id).map((module) => module.id));
    deleteDetailsByModuleIds(db, moduleIds);
    db.features = db.features.filter((feature) => !moduleIds.has(feature.moduleId));
    db.modules = db.modules.filter((module) => module.moduleGroupId !== id);
    db.groups = db.groups.filter((group) => group.id !== id);
    await saveDatabase(db);
    return { deleted: true, id, name: current.name };
  },

  async listModules(moduleGroupId: string) {
    const db = await loadDatabase();
    return db.modules.filter((module) => module.moduleGroupId === moduleGroupId).sort(byOrder);
  },

  async createModule(input: Partial<ProjectManagerModule>) {
    const db = await loadDatabase();
    const moduleGroupId = required(input.moduleGroupId, "moduleGroupId");
    findById(db.groups, moduleGroupId, "Module group not found");
    const moduleKey = required(input.moduleKey, "moduleKey");
    const name = required(input.name, "name");
    if (db.modules.some((item) => item.moduleGroupId === moduleGroupId && same(item.moduleKey, moduleKey))) {
      throw AppError.conflict("Module key already exists for this group");
    }
    const record = withStatus({
      active: input.active ?? true,
      description: input.description ?? "",
      id: nextId("module"),
      moduleGroupId,
      moduleKey,
      name,
      routePath: input.routePath ?? "",
      sortOrder: Number(input.sortOrder ?? 0),
      updatedAt: now()
    });
    db.modules.push(record);
    await saveDatabase(db);
    return record;
  },

  async updateModule(id: string, input: Partial<ProjectManagerModule>) {
    const db = await loadDatabase();
    const current = findById(db.modules, id, "Module registry record not found");
    const next = withStatus({
      ...current,
      ...defined({
        active: input.active,
        description: input.description,
        moduleGroupId: input.moduleGroupId,
        moduleKey: input.moduleKey,
        name: input.name,
        routePath: input.routePath
      }),
      sortOrder: input.sortOrder === undefined ? current.sortOrder : Number(input.sortOrder),
      updatedAt: now()
    });
    if (db.modules.some((item) => item.id !== id && item.moduleGroupId === next.moduleGroupId && same(item.moduleKey, next.moduleKey))) {
      throw AppError.conflict("Module key already exists for this group");
    }
    db.modules = db.modules.map((item) => (item.id === id ? next : item));
    await saveDatabase(db);
    return next;
  },

  async setModuleActive(id: string, active: boolean) {
    return this.updateModule(id, { active });
  },

  async deleteModule(id: string) {
    const db = await loadDatabase();
    const current = findById(db.modules, id, "Module registry record not found");
    deleteDetailsByModuleIds(db, new Set([id]));
    db.features = db.features.filter((feature) => feature.moduleId !== id);
    db.modules = db.modules.filter((module) => module.id !== id);
    await saveDatabase(db);
    return { deleted: true, id, name: current.name };
  },

  async listFeatures(moduleId: string) {
    const db = await loadDatabase();
    return db.features.filter((feature) => feature.moduleId === moduleId).sort(byOrder);
  },

  async createFeature(input: Partial<ProjectManagerFeature>) {
    const db = await loadDatabase();
    const moduleId = required(input.moduleId, "moduleId");
    findById(db.modules, moduleId, "Module registry record not found");
    const featureKey = required(input.featureKey, "featureKey");
    const name = required(input.name, "name");
    if (db.features.some((item) => item.moduleId === moduleId && same(item.featureKey, featureKey))) {
      throw AppError.conflict("Feature key already exists for this module");
    }
    const record = withStatus({
      active: input.active ?? true,
      description: input.description ?? "",
      featureKey,
      id: nextId("feature"),
      moduleId,
      name,
      permissionKey: input.permissionKey ?? "",
      routePath: input.routePath ?? "",
      sortOrder: Number(input.sortOrder ?? 0),
      type: input.type ?? "page",
      updatedAt: now()
    });
    db.features.push(record);
    await saveDatabase(db);
    return record;
  },

  async updateFeature(id: string, input: Partial<ProjectManagerFeature>) {
    const db = await loadDatabase();
    const current = findById(db.features, id, "Feature registry record not found");
    const next = withStatus({
      ...current,
      ...defined({
        active: input.active,
        description: input.description,
        featureKey: input.featureKey,
        moduleId: input.moduleId,
        name: input.name,
        permissionKey: input.permissionKey,
        routePath: input.routePath,
        type: input.type
      }),
      sortOrder: input.sortOrder === undefined ? current.sortOrder : Number(input.sortOrder),
      updatedAt: now()
    });
    findById(db.modules, next.moduleId, "Module registry record not found");
    if (db.features.some((item) => item.id !== id && item.moduleId === next.moduleId && same(item.featureKey, next.featureKey))) {
      throw AppError.conflict("Feature key already exists for this module");
    }
    db.features = db.features.map((item) => (item.id === id ? next : item));
    await saveDatabase(db);
    return next;
  },

  async setFeatureActive(id: string, active: boolean) {
    return this.updateFeature(id, { active });
  },

  async deleteFeature(id: string) {
    const db = await loadDatabase();
    const current = findById(db.features, id, "Feature registry record not found");
    db.features = db.features.filter((feature) => feature.id !== id);
    await saveDatabase(db);
    return { deleted: true, id, name: current.name };
  },

  async listDetails(kind: ProjectManagerDetailKind, moduleId: string) {
    const db = await loadDatabase();
    return detailBucket(db, kind).filter((record) => record.moduleId === moduleId).sort(byOrder);
  },

  async createDetail(kind: ProjectManagerDetailKind, input: Partial<ProjectManagerDetailRecord>) {
    const db = await loadDatabase();
    const moduleId = required(input.moduleId, "moduleId");
    findById(db.modules, moduleId, "Module registry record not found");
    const key = required(input.key, "key");
    const name = required(input.name, "name");
    const bucket = detailBucket(db, kind);
    if (bucket.some((item) => item.moduleId === moduleId && same(item.key, key))) {
      throw AppError.conflict(`${detailKindLabel(kind)} key already exists for this module`);
    }
    const record = normalizeDetail(kind, { ...input, id: nextId(kind), key, moduleId, name, updatedAt: now() });
    bucket.push(record);
    await saveDatabase(db);
    return record;
  },

  async updateDetail(kind: ProjectManagerDetailKind, id: string, input: Partial<ProjectManagerDetailRecord>) {
    const db = await loadDatabase();
    const bucket = detailBucket(db, kind);
    const current = findById(bucket, id, `${detailKindLabel(kind)} record not found`);
    const next = normalizeDetail(kind, { ...current, ...defined(input), updatedAt: now() });
    findById(db.modules, next.moduleId, "Module registry record not found");
    if (bucket.some((item) => item.id !== id && item.moduleId === next.moduleId && same(item.key, next.key))) {
      throw AppError.conflict(`${detailKindLabel(kind)} key already exists for this module`);
    }
    replaceDetailBucket(db, kind, bucket.map((item) => (item.id === id ? next : item)));
    await saveDatabase(db);
    return next;
  },

  async setDetailActive(kind: ProjectManagerDetailKind, id: string, active: boolean) {
    return this.updateDetail(kind, id, { active });
  },

  async deleteDetail(kind: ProjectManagerDetailKind, id: string) {
    const db = await loadDatabase();
    const bucket = detailBucket(db, kind);
    const current = findById(bucket, id, `${detailKindLabel(kind)} record not found`);
    replaceDetailBucket(db, kind, bucket.filter((record) => record.id !== id));
    await saveDatabase(db);
    return { deleted: true, id, name: current.name };
  },

  async result() {
    const db = await loadDatabase();
    return buildResult(db);
  }
};

async function loadDatabase(): Promise<JsonDatabase> {
  await ensureFiles();
  return {
    actions: await readJson<ProjectManagerDetailRecord[]>(actionFile),
    apis: await readJson<ProjectManagerDetailRecord[]>(apiFile),
    databaseObjects: await readJson<ProjectManagerDetailRecord[]>(databaseObjectFile),
    features: await readJson<ProjectManagerFeature[]>(featureFile),
    groups: await readJson<ProjectManagerModuleGroup[]>(groupFile),
    modules: await readJson<ProjectManagerModule[]>(moduleFile),
    notes: await readJson<ProjectManagerDetailRecord[]>(noteFile),
    planning: await readJson<ProjectManagerDetailRecord[]>(planningFile),
    screens: await readJson<ProjectManagerDetailRecord[]>(screenFile),
    platforms: await readJson<ProjectManagerPlatform[]>(platformFile)
  };
}

async function saveDatabase(db: JsonDatabase) {
  await mkdir(databaseDir, { recursive: true });
  await writeJson(platformFile, db.platforms);
  await writeJson(groupFile, db.groups.sort(byOrder));
  await writeJson(moduleFile, db.modules.sort(byOrder));
  await writeJson(featureFile, db.features.sort(byOrder));
  await writeJson(actionFile, db.actions.sort(byOrder));
  await writeJson(apiFile, db.apis.sort(byOrder));
  await writeJson(screenFile, db.screens.sort(byOrder));
  await writeJson(databaseObjectFile, db.databaseObjects.sort(byOrder));
  await writeJson(planningFile, db.planning.sort(byOrder));
  await writeJson(noteFile, db.notes.sort(byOrder));
  await writeJson(resultFile, buildResult(db));
}

async function ensureFiles() {
  await mkdir(databaseDir, { recursive: true });
  await ensureJson(platformFile, seedPlatforms());
  await ensureJson(groupFile, seedGroups());
  await ensureJson(moduleFile, seedModules());
  await ensureJson(featureFile, seedFeatures());
  await ensureDetailJson(actionFile, seedDetails("action"));
  await ensureDetailJson(apiFile, seedDetails("api"));
  await ensureDetailJson(screenFile, seedDetails("screen"));
  await ensureDetailJson(databaseObjectFile, seedDetails("database"));
  await ensureDetailJson(planningFile, seedDetails("planning"));
  await ensureDetailJson(noteFile, seedDetails("note"));
  await writeJson(resultFile, buildResult({
    actions: await readJson<ProjectManagerDetailRecord[]>(actionFile),
    apis: await readJson<ProjectManagerDetailRecord[]>(apiFile),
    databaseObjects: await readJson<ProjectManagerDetailRecord[]>(databaseObjectFile),
    features: await readJson<ProjectManagerFeature[]>(featureFile),
    groups: await readJson<ProjectManagerModuleGroup[]>(groupFile),
    modules: await readJson<ProjectManagerModule[]>(moduleFile),
    notes: await readJson<ProjectManagerDetailRecord[]>(noteFile),
    planning: await readJson<ProjectManagerDetailRecord[]>(planningFile),
    platforms: await readJson<ProjectManagerPlatform[]>(platformFile)
    ,
    screens: await readJson<ProjectManagerDetailRecord[]>(screenFile)
  }));
}

async function ensureJson<T>(filePath: string, fallback: T) {
  try {
    await readFile(filePath, "utf8");
  } catch {
    await writeJson(filePath, fallback);
  }
}

async function ensureDetailJson(filePath: string, fallback: ProjectManagerDetailRecord[]) {
  try {
    const existing = await readJson<ProjectManagerDetailRecord[]>(filePath);
    const existingIds = new Set(existing.map((record) => record.id));
    const merged = [...existing, ...fallback.filter((record) => !existingIds.has(record.id))];
    await writeJson(filePath, merged);
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

function withStatus<T extends { active: boolean }>(record: T): T & { status: string } {
  return { ...record, status: record.active ? "active" : "inactive" };
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

function byOrder(a: { sortOrder?: number; name: string }, b: { sortOrder?: number; name: string }) {
  return Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0) || a.name.localeCompare(b.name);
}

function sortByUpdated<T extends { updatedAt?: string }>(records: T[]) {
  return [...records].sort((a, b) => String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? "")));
}

function buildResult(db: JsonDatabase) {
  return {
    generatedAt: now(),
    platforms: db.platforms.map((platform) => ({
      ...platform,
      groups: db.groups
        .filter((group) => group.platformRegistryId === platform.id)
        .sort(byOrder)
        .map((group) => ({
          ...group,
          modules: db.modules
            .filter((module) => module.moduleGroupId === group.id)
            .sort(byOrder)
            .map((module) => ({
              ...module,
              actions: db.actions.filter((record) => record.moduleId === module.id).sort(byOrder),
              apis: db.apis.filter((record) => record.moduleId === module.id).sort(byOrder),
              database: db.databaseObjects.filter((record) => record.moduleId === module.id).sort(byOrder),
              features: db.features.filter((feature) => feature.moduleId === module.id).sort(byOrder),
              notes: db.notes.filter((record) => record.moduleId === module.id).sort(byOrder),
              planning: db.planning.filter((record) => record.moduleId === module.id).sort(byOrder),
              screens: db.screens.filter((record) => record.moduleId === module.id).sort(byOrder)
            }))
        }))
    }))
  };
}

function detailBucket(db: JsonDatabase, kind: ProjectManagerDetailKind) {
  if (kind === "action") return db.actions;
  if (kind === "api") return db.apis;
  if (kind === "screen") return db.screens;
  if (kind === "database") return db.databaseObjects;
  if (kind === "planning") return db.planning;
  return db.notes;
}

function replaceDetailBucket(db: JsonDatabase, kind: ProjectManagerDetailKind, records: ProjectManagerDetailRecord[]) {
  if (kind === "action") db.actions = records;
  else if (kind === "api") db.apis = records;
  else if (kind === "screen") db.screens = records;
  else if (kind === "database") db.databaseObjects = records;
  else if (kind === "planning") db.planning = records;
  else db.notes = records;
}

function deleteDetailsByModuleIds(db: JsonDatabase, moduleIds: Set<string>) {
  db.actions = db.actions.filter((record) => !moduleIds.has(record.moduleId));
  db.apis = db.apis.filter((record) => !moduleIds.has(record.moduleId));
  db.screens = db.screens.filter((record) => !moduleIds.has(record.moduleId));
  db.databaseObjects = db.databaseObjects.filter((record) => !moduleIds.has(record.moduleId));
  db.planning = db.planning.filter((record) => !moduleIds.has(record.moduleId));
  db.notes = db.notes.filter((record) => !moduleIds.has(record.moduleId));
}

function normalizeDetail(kind: ProjectManagerDetailKind, input: Partial<ProjectManagerDetailRecord>): ProjectManagerDetailRecord {
  return withStatus({
    active: input.active ?? true,
    auditEvent: input.auditEvent ?? "",
    componentPath: input.componentPath ?? "",
    defaultValue: input.defaultValue ?? "",
    dependencyKeys: Array.isArray(input.dependencyKeys) ? input.dependencyKeys : stringList(input.dependencyKeys),
    description: input.description ?? "",
    featureId: input.featureId ?? "",
    fieldName: input.fieldName ?? "",
    fieldNature: input.fieldNature ?? "",
    fieldType: input.fieldType ?? "",
    id: required(input.id, "id"),
    indexed: Boolean(input.indexed ?? false),
    kind,
    key: required(input.key, "key"),
    lifecycleAction: Boolean(input.lifecycleAction ?? false),
    method: input.method ?? "",
    migrationId: input.migrationId ?? "",
    moduleId: required(input.moduleId, "moduleId"),
    name: required(input.name, "name"),
    nullable: Boolean(input.nullable ?? false),
    operation: input.operation ?? "",
    ownerTeam: input.ownerTeam ?? "",
    pageType: input.pageType ?? "",
    permissionKey: input.permissionKey ?? "",
    relation: input.relation ?? "",
    richNotes: input.richNotes ?? "",
    riskLevel: input.riskLevel ?? "medium",
    routePath: input.routePath ?? "",
    scope: input.scope ?? "super_admin",
    softDelete: Boolean(input.softDelete ?? false),
    sortOrder: Number(input.sortOrder ?? 0),
    subscriptionFlagKey: input.subscriptionFlagKey ?? "",
    tableName: input.tableName ?? "",
    tableScope: input.tableScope ?? "",
    tenantRequired: Boolean(input.tenantRequired ?? false),
    testPath: input.testPath ?? "",
    unique: Boolean(input.unique ?? false),
    updatedAt: input.updatedAt ?? now(),
    version: input.version ?? "1.0.0"
  });
}

function stringList(value: unknown) {
  if (typeof value !== "string") return [];
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function detailKindLabel(kind: ProjectManagerDetailKind) {
  if (kind === "api") return "API registry";
  if (kind === "database") return "Database registry";
  if (kind === "planning") return "Planning registry";
  if (kind === "note") return "Model note";
  return `${kind.charAt(0).toUpperCase()}${kind.slice(1)} registry`;
}

function seedPlatforms(): ProjectManagerPlatform[] {
  const updatedAt = now();
  return [
    withStatus({ active: true, description: "Super Admin Desk development reference.", id: "platform-super-admin", name: "SUPER ADMIN", platform: "super-admin", updatedAt }),
    withStatus({ active: true, description: "Staff Admin Desk development reference.", id: "platform-admin", name: "ADMIN", platform: "admin", updatedAt }),
    withStatus({ active: true, description: "Tenant workspace development reference.", id: "platform-tenants", name: "TENANTS", platform: "tenants", updatedAt })
  ];
}

function seedGroups(): ProjectManagerModuleGroup[] {
  const updatedAt = now();
  const rows = [
    ["group-sa-admin", "platform-super-admin", "admin", "Admin", "Tenant, domain, subscription, app, and industry references.", 10],
    ["group-sa-foundation", "platform-super-admin", "platform-foundation", "Platform Foundation", "Audit, health, settings, and feature references.", 20],
    ["group-sa-project-manager", "platform-super-admin", "project-manager", "Project Manager", "Development planning and debug reference map.", 30],
    ["group-sa-database", "platform-super-admin", "database", "Database", "Database operation references.", 40],
    ["group-sa-access", "platform-super-admin", "access-control", "Access Control", "User, role, permission, and session references.", 50],
    ["group-sa-operations", "platform-super-admin", "operations", "Operations", "Queue, support, workbench, and docs references.", 60],
    ["group-sa-apps-compliance", "platform-super-admin", "apps-compliance", "Apps & Compliance", "ZETRO and GST references.", 70]
  ] as const;
  return rows.map(([id, platformRegistryId, groupKey, name, description, sortOrder]) =>
    withStatus({ active: true, description, groupKey, id, name, platformRegistryId, sortOrder, updatedAt })
  );
}

function seedModules(): ProjectManagerModule[] {
  const updatedAt = now();
  const rows = [
    ["module-sa-tenant", "group-sa-admin", "tenant", "Tenant", "/sa/tenants", "Tenant registry reference.", 10],
    ["module-sa-domain", "group-sa-admin", "domain", "Domain", "/sa/domains", "Domain mapping reference.", 20],
    ["module-sa-plan", "group-sa-admin", "plan", "Plan", "/sa/plans", "Plan reference.", 30],
    ["module-sa-subscription", "group-sa-admin", "subscription", "Subscription", "/sa/subscriptions", "Subscription reference.", 40],
    ["module-sa-apps", "group-sa-admin", "apps", "Apps", "/sa/modules", "App catalog reference.", 50],
    ["module-sa-industry", "group-sa-admin", "industry", "Industry", "/sa/industries", "Industry reference.", 60],
    ["module-sa-module-registry", "group-sa-admin", "module-registry", "Module Registry", "/sa/platform-registry", "Project Manager module registry reference.", 70],
    ["module-sa-compliance", "group-sa-foundation", "compliance", "Compliance", "/sa/audit", "Audit reference.", 10],
    ["module-sa-health", "group-sa-foundation", "health", "Health", "/sa/health", "Health reference.", 20],
    ["module-sa-settings", "group-sa-foundation", "settings", "Settings", "/sa/settings", "Settings reference.", 30],
    ["module-sa-features", "group-sa-foundation", "features", "Features", "/sa/features", "Feature flag reference.", 40],
    ["module-sa-platform-registry", "group-sa-project-manager", "platform-registry", "Platform Registry", "/sa/platform-registry", "Platform, group, and module JSON reference.", 10],
    ["module-sa-database-manager", "group-sa-database", "database-manager", "Database Manager", "/sa/database", "Database manager reference.", 10],
    ["module-sa-migrations", "group-sa-database", "migrations", "Migrations", "/sa/migrations", "Migration reference.", 20],
    ["module-sa-users", "group-sa-access", "users", "Users", "/sa/users", "Users reference.", 10],
    ["module-sa-roles", "group-sa-access", "roles", "Roles", "/sa/roles", "Roles reference.", 20],
    ["module-sa-permissions", "group-sa-access", "permissions", "Permissions", "/sa/permissions", "Permissions reference.", 30],
    ["module-sa-sessions", "group-sa-access", "sessions", "Sessions", "/sa/sessions", "Sessions reference.", 40],
    ["module-sa-queue", "group-sa-operations", "queue", "Queue", "/sa/queue", "Queue reference.", 10],
    ["module-sa-support", "group-sa-operations", "support", "Support", "/sa/support", "Support reference.", 20],
    ["module-sa-workbench", "group-sa-operations", "workbench", "Workbench", "/sa/workbench", "Workbench reference.", 30],
    ["module-sa-dev-docs", "group-sa-operations", "dev-docs", "Dev Docs", "/sa/devdocs", "Developer documentation reference.", 40],
    ["module-sa-zetro", "group-sa-apps-compliance", "zetro", "ZETRO", "/sa/zetro", "ZETRO reference.", 10],
    ["module-sa-gst", "group-sa-apps-compliance", "gst", "GST", "/sa/gst", "GST reference.", 20]
  ] as const;
  return rows.map(([id, moduleGroupId, moduleKey, name, routePath, description, sortOrder]) =>
    withStatus({ active: true, description, id, moduleGroupId, moduleKey, name, routePath, sortOrder, updatedAt })
  );
}

function seedFeatures(): ProjectManagerFeature[] {
  const updatedAt = now();
  const rows = [
    ["feature-sa-tenant-list", "module-sa-tenant", "tenant-list", "List tenants", "page", "/sa/tenants", "platform.tenant.profile.view", "Tenant list page reference.", 10],
    ["feature-sa-tenant-create", "module-sa-tenant", "tenant-create", "Create tenant", "action", "/sa/tenants", "platform.tenant.profile.manage", "New tenant action reference.", 20],
    ["feature-sa-tenant-show", "module-sa-tenant", "tenant-show", "Show tenant", "page", "/sa/tenants/:id", "platform.tenant.profile.view", "Tenant show page reference.", 30],
    ["feature-sa-tenant-update", "module-sa-tenant", "tenant-update", "Update tenant", "action", "/sa/tenants/:id", "platform.tenant.profile.manage", "Tenant update action reference.", 40],
    ["feature-sa-platform-registry-list", "module-sa-platform-registry", "platform-registry-list", "List platform registry", "page", "/sa/platform-registry", "platform.module.catalog.view", "Project Manager platform list reference.", 10],
    ["feature-sa-module-feature-registry", "module-sa-platform-registry", "feature-registry", "Feature registry", "workflow", "/sa/platform-registry", "platform.module.catalog.view", "Module feature mapping workflow.", 20]
  ] as const;
  return rows.map(([id, moduleId, featureKey, name, type, routePath, permissionKey, description, sortOrder]) =>
    withStatus({ active: true, description, featureKey, id, moduleId, name, permissionKey, routePath, sortOrder, type, updatedAt })
  );
}

function seedDetails(kind: ProjectManagerDetailKind): ProjectManagerDetailRecord[] {
  if (kind === "action") {
    return [
      normalizeDetail("action", { id: "action-sa-tenant-create", moduleId: "module-sa-tenant", featureId: "feature-sa-tenant-create", key: "tenant.create", name: "Create tenant", permissionKey: "platform.tenant.profile.manage", routePath: "/sa/tenants", scope: "super_admin", sortOrder: 10, description: "Create a tenant workspace reference." }),
      normalizeDetail("action", { id: "action-sa-tenant-update", moduleId: "module-sa-tenant", featureId: "feature-sa-tenant-update", key: "tenant.update", name: "Update tenant", permissionKey: "platform.tenant.profile.manage", routePath: "/sa/tenants/:id", scope: "super_admin", sortOrder: 20, description: "Update tenant profile and lifecycle fields." })
    ];
  }
  if (kind === "api") {
    return [
      normalizeDetail("api", { id: "api-sa-tenant-list", moduleId: "module-sa-tenant", key: "tenant.api.list", operation: "list", name: "List tenants", method: "GET", routePath: "/admin/tenants", permissionKey: "platform.tenant.profile.view", auditEvent: "tenant.list.viewed", riskLevel: "low", scope: "super_admin", sortOrder: 10 }),
      normalizeDetail("api", { id: "api-sa-tenant-create", moduleId: "module-sa-tenant", key: "tenant.api.create", operation: "create", name: "Create tenant", method: "POST", routePath: "/admin/tenants", permissionKey: "platform.tenant.profile.manage", auditEvent: "tenant.created", lifecycleAction: true, riskLevel: "high", scope: "super_admin", sortOrder: 20 }),
      normalizeDetail("api", { id: "api-sa-tenant-show", moduleId: "module-sa-tenant", key: "tenant.api.show", operation: "show", name: "Show tenant", method: "GET", routePath: "/admin/tenants/:id", permissionKey: "platform.tenant.profile.view", riskLevel: "low", scope: "super_admin", sortOrder: 30 }),
      normalizeDetail("api", { id: "api-sa-tenant-update", moduleId: "module-sa-tenant", key: "tenant.api.update", operation: "edit", name: "Update tenant", method: "PUT", routePath: "/admin/tenants/:id", permissionKey: "platform.tenant.profile.manage", auditEvent: "tenant.updated", riskLevel: "medium", scope: "super_admin", sortOrder: 40 }),
      normalizeDetail("api", { id: "api-sa-tenant-suspend", moduleId: "module-sa-tenant", key: "tenant.api.suspend", operation: "suspend", name: "Suspend tenant", method: "POST", routePath: "/admin/tenants/:id/suspend", permissionKey: "platform.tenant.profile.manage", auditEvent: "tenant.suspended", lifecycleAction: true, riskLevel: "high", scope: "super_admin", sortOrder: 50 }),
      normalizeDetail("api", { id: "api-sa-tenant-restore", moduleId: "module-sa-tenant", key: "tenant.api.restore", operation: "restore", name: "Restore tenant", method: "POST", routePath: "/admin/tenants/:id/restore", permissionKey: "platform.tenant.profile.manage", auditEvent: "tenant.restored", lifecycleAction: true, riskLevel: "high", scope: "super_admin", sortOrder: 60 }),
      normalizeDetail("api", { id: "api-sa-tenant-delete", moduleId: "module-sa-tenant", key: "tenant.api.delete", operation: "delete", name: "Delete tenant", method: "DELETE", routePath: "/admin/tenants/:id", permissionKey: "platform.tenant.profile.manage", auditEvent: "tenant.deleted", lifecycleAction: true, riskLevel: "critical", scope: "super_admin", sortOrder: 70 })
    ];
  }
  if (kind === "screen") {
    return [
      normalizeDetail("screen", { id: "screen-sa-tenant-list", moduleId: "module-sa-tenant", key: "tenant.list", name: "Tenant list", routePath: "/sa/tenants", componentPath: "apps/platform/web/src/pages/sa/TenantList.tsx", pageType: "list", testPath: "apps/platform/web/e2e", scope: "super_admin", sortOrder: 10 }),
      normalizeDetail("screen", { id: "screen-sa-tenant-upsert", moduleId: "module-sa-tenant", key: "tenant.upsert", name: "Tenant upsert dialog", componentPath: "apps/platform/web/src/pages/sa/TenantList.tsx", pageType: "upsert", scope: "super_admin", sortOrder: 20 })
    ];
  }
  if (kind === "database") {
    return [
      normalizeDetail("database", { id: "database-sa-tenants-id", moduleId: "module-sa-tenant", key: "tenants.id", name: "Tenant id", tableName: "tenants", fieldName: "id", fieldType: "uuid", fieldNature: "primary key", tableScope: "master", indexed: true, unique: true, nullable: false, scope: "system", sortOrder: 10 }),
      normalizeDetail("database", { id: "database-sa-tenants-name", moduleId: "module-sa-tenant", key: "tenants.name", name: "Tenant name", tableName: "tenants", fieldName: "name", fieldType: "text", fieldNature: "business identity", tableScope: "master", indexed: true, nullable: false, scope: "system", sortOrder: 20 }),
      normalizeDetail("database", { id: "database-sa-tenants-slug", moduleId: "module-sa-tenant", key: "tenants.slug", name: "Tenant slug", tableName: "tenants", fieldName: "slug", fieldType: "text", fieldNature: "routing identity", tableScope: "master", indexed: true, unique: true, nullable: false, scope: "system", sortOrder: 30 }),
      normalizeDetail("database", { id: "database-sa-tenants-status", moduleId: "module-sa-tenant", key: "tenants.status", name: "Tenant status", tableName: "tenants", fieldName: "status", fieldType: "enum", fieldNature: "lifecycle state", tableScope: "master", defaultValue: "active", indexed: true, nullable: false, scope: "system", sortOrder: 40 }),
      normalizeDetail("database", { id: "database-sa-tenants-plan-id", moduleId: "module-sa-tenant", key: "tenants.plan_id", name: "Plan link", tableName: "tenants", fieldName: "plan_id", fieldType: "uuid", fieldNature: "foreign key", relation: "plans.id", tableScope: "master", indexed: true, nullable: true, scope: "system", sortOrder: 50 }),
      normalizeDetail("database", { id: "database-sa-tenants-created-at", moduleId: "module-sa-tenant", key: "tenants.created_at", name: "Created at", tableName: "tenants", fieldName: "created_at", fieldType: "timestamp", fieldNature: "audit timestamp", tableScope: "master", nullable: false, scope: "system", sortOrder: 60 }),
      normalizeDetail("database", { id: "database-sa-tenants-deleted-at", moduleId: "module-sa-tenant", key: "tenants.deleted_at", name: "Deleted at", tableName: "tenants", fieldName: "deleted_at", fieldType: "timestamp", fieldNature: "soft delete marker", tableScope: "master", softDelete: true, nullable: true, scope: "system", sortOrder: 70 })
    ];
  }
  if (kind === "planning") {
    return [
      normalizeDetail("planning", { id: "planning-sa-tenant-coverage", moduleId: "module-sa-tenant", key: "tenant.coverage", name: "Complete tenant registry coverage", ownerTeam: "Platform", status: "planned", scope: "super_admin", sortOrder: 10, richNotes: "<p>Track list, show, upsert, lifecycle, permission, API, screen, and table coverage for Tenant.</p>" })
    ];
  }
  return [
    normalizeDetail("note", { id: "note-sa-tenant-model", moduleId: "module-sa-tenant", key: "tenant.model", name: "Tenant model notes", ownerTeam: "Platform", scope: "super_admin", sortOrder: 10, richNotes: "<p>Tenant is the anchor model for workspace provisioning, domains, subscriptions, and module activation.</p>" })
  ];
}
