import { AppError } from "@codexsun/framework/errors";
import { ok } from "@codexsun/framework/http";
import { createHash, randomUUID } from "node:crypto";
import { access, copyFile, lstat, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { requireSession, requireSuperAdmin, requireTenantMatch } from "../auth/guards.js";
import { env } from "../env.js";
import type { FastifyInstance, FastifyReply } from "fastify";

type MediaAssetRow = {
  asset_id: string;
  scope: string;
  tenant_id: string | null;
  tenant_slug: string;
  category: string;
  visibility: string;
  folder: string;
  file_name: string;
  original_name: string;
  mime_type: string;
  extension: string;
  size_bytes: number | string;
  storage_path: string;
  public_url: string | null;
  checksum: string | null;
  alt_text: string | null;
  caption: string | null;
  is_active: number | boolean;
  created_by: string;
  updated_by: string;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at: Date | string | null;
};

type TenantMediaSettings = {
  defaultCategory: string;
  defaultFolder: string;
  defaultVisibility: "private" | "tenant" | "public";
  maxUploadMb: number;
  publicAssetsEnabled: boolean;
};

const defaultMediaSettings: TenantMediaSettings = {
  defaultCategory: "files",
  defaultFolder: "media",
  defaultVisibility: "private",
  maxUploadMb: 10,
  publicAssetsEnabled: false
};

export async function registerMediaRoutes(app: FastifyInstance) {
  await ensurePublicStorageLink();

  app.get("/storage/*", async (request, reply: FastifyReply) => {
    const publicPath = publicStoragePath((request.params as { "*": string })["*"]);
    const file = await readFile(publicPath);
    return reply.send(file);
  });

  app.get("/media/assets", async (request) => {
    const session = await requireSession(app, request);
    requireTenantMatch(request, session);
    const tenantId = request.tenantId!;
    const query = request.query as { category?: string; visibility?: string };
    const records = await listAssets(app, {
      tenantId,
      ...(query.category ? { category: query.category } : {}),
      ...(query.visibility ? { visibility: query.visibility } : {})
    });
    return ok(records, responseMeta(request));
  });

  app.post("/media/assets", async (request) => {
    const session = await requireSession(app, request);
    requireTenantMatch(request, session);
    const tenantId = request.tenantId!;
    const tenant = await tenantInfo(app, tenantId);
    const settings = await tenantMediaSettings(app, tenantId);
    const body = request.body as Record<string, unknown>;
    const originalName = stringField(body.originalName) || stringField(body.fileName);
    const dataUrl = stringField(body.dataUrl);
    if (!originalName) throw AppError.validation("fileName is required");
    if (!dataUrl) throw AppError.validation("dataUrl is required");
    await ensureTenantStorageRoot(tenant.slug);

    const parsed = parseDataUrl(dataUrl, stringField(body.mimeType));
    const category = safeSegment(stringField(body.category) || settings.defaultCategory || "files");
    const visibility = mediaVisibility(stringField(body.visibility) || settings.defaultVisibility, settings);
    const folder = safeFolder(stringField(body.folder) || settings.defaultFolder || "media");
    const maxBytes = Math.max(1, settings.maxUploadMb) * 1024 * 1024;
    if (parsed.buffer.byteLength > maxBytes) {
      throw AppError.validation(`File is larger than the ${settings.maxUploadMb} MB tenant media limit`);
    }

    const assetId = randomUUID();
    const extension = extensionFromName(originalName) || extensionFromMime(parsed.mimeType);
    const storageRoot = mediaStorageRoot();
    const fileName = await uniqueStorageFileName(storageRoot, tenant.slug, visibility, folder, safeFileName(originalName, extension));
    const relativePath = path.posix.join(tenant.slug, visibility, folder, fileName);
    const storagePath = path.join(storageRoot, ...relativePath.split("/"));
    const tempPath = path.join(storageRoot, ".tmp", tenant.slug, assetId, fileName);
    await mkdir(path.dirname(tempPath), { recursive: true });
    await writeFile(tempPath, parsed.buffer);
    await mkdir(path.dirname(storagePath), { recursive: true });
    await copyFile(tempPath, storagePath);
    await rm(path.dirname(tempPath), { recursive: true, force: true });

    const checksum = createHash("sha256").update(parsed.buffer).digest("hex");
    const publicUrl = visibility === "public" ? `/storage/${relativePath}` : `/media/assets/${assetId}/content`;
    await app.masterDbPool.execute(
      `INSERT INTO platform_media_assets
         (asset_id, scope, tenant_id, tenant_slug, category, visibility, folder, file_name, original_name,
          mime_type, extension, size_bytes, storage_path, public_url, checksum, alt_text, caption, created_by, updated_by)
       VALUES (?, 'tenant', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        assetId,
        tenantId,
        tenant.slug,
        category,
        visibility,
        folder,
        fileName,
        originalName,
        parsed.mimeType,
        extension,
        parsed.buffer.byteLength,
        storagePath,
        publicUrl,
        checksum,
        stringField(body.altText) || null,
        stringField(body.caption) || null,
        session.email,
        session.email
      ]
    );
    await auditMedia(app, request, session.email, "media.asset.created", { assetId, tenantId, category, visibility });
    return ok((await getAsset(app, assetId, tenantId))!, responseMeta(request));
  });

  app.get("/media/assets/:assetId/content", async (request, reply: FastifyReply) => {
    const { assetId } = request.params as { assetId: string };
    const publicAsset = await getAssetById(app, assetId);
    if (publicAsset?.visibility === "public") {
      const file = await readFile(publicAsset.storagePath);
      return reply.type(publicAsset.mimeType).send(file);
    }
    const session = await mediaContentSession(app, request);
    const tenantId = request.tenantId ?? stringField((request.query as Record<string, unknown>).tenantId);
    requireTenantMatch({ tenantId }, session);
    const asset = await getAsset(app, assetId, tenantId);
    if (!asset) throw AppError.notFound("Media asset not found");
    const file = await readFile(asset.storagePath);
    return reply.type(asset.mimeType).send(file);
  });

  app.post("/media/assets/:assetId/archive", async (request) => {
    const session = await requireSession(app, request);
    requireTenantMatch(request, session);
    const { assetId } = request.params as { assetId: string };
    await app.masterDbPool.execute(
      "UPDATE platform_media_assets SET is_active = 0, deleted_at = CURRENT_TIMESTAMP, updated_by = ? WHERE asset_id = ? AND tenant_id = ?",
      [session.email, assetId, request.tenantId]
    );
    await auditMedia(app, request, session.email, "media.asset.archived", { assetId, tenantId: request.tenantId });
    return ok({ archived: true }, responseMeta(request));
  });

  app.post("/media/assets/:assetId/restore", async (request) => {
    const session = await requireSession(app, request);
    requireTenantMatch(request, session);
    const { assetId } = request.params as { assetId: string };
    await app.masterDbPool.execute(
      "UPDATE platform_media_assets SET is_active = 1, deleted_at = NULL, updated_by = ? WHERE asset_id = ? AND tenant_id = ?",
      [session.email, assetId, request.tenantId]
    );
    await auditMedia(app, request, session.email, "media.asset.restored", { assetId, tenantId: request.tenantId });
    return ok({ restored: true }, responseMeta(request));
  });

  app.get("/admin/media/settings", async (request) => {
    await requireSuperAdmin(app, request);
    const [assetRows] = await app.masterDbPool.execute<Array<Record<string, unknown>>>(
      `SELECT COUNT(*) AS total,
              SUM(is_active = 1) AS active,
              SUM(visibility = 'public') AS publicAssets,
              COALESCE(SUM(size_bytes), 0) AS sizeBytes
       FROM platform_media_assets`
    );
    const [tenantRows] = await app.masterDbPool.execute<Array<{ id: number | string; tenant_code: string; tenant_name: string; slug: string | null; payload_settings: string | null }>>(
      "SELECT id, tenant_code, tenant_name, slug, payload_settings FROM tenants ORDER BY tenant_name ASC"
    );
    const totals = assetRows[0] ?? {};
    return ok({
      publicStorageRoot: env.STORAGE_PUBLIC_ROOT,
      storageRoot: mediaStorageRoot(),
      totals: {
        total: toNumber(totals.total),
        active: toNumber(totals.active),
        publicAssets: toNumber(totals.publicAssets),
        sizeBytes: toNumber(totals.sizeBytes)
      },
      tenants: tenantRows.map((tenant) => ({
        id: String(tenant.id),
        tenantCode: tenant.tenant_code,
        tenantName: tenant.tenant_name,
        slug: tenant.slug ?? tenant.tenant_code,
        media: mediaSettingsFromPayload(parseJsonObject(tenant.payload_settings))
      }))
    }, responseMeta(request));
  });

  app.get("/admin/media/assets", async (request) => {
    await requireSuperAdmin(app, request);
    return ok(await listAssets(app, {}), responseMeta(request));
  });
}

async function listAssets(app: FastifyInstance, filters: { category?: string; tenantId?: string; visibility?: string }) {
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (filters.tenantId) {
    conditions.push("tenant_id = ?");
    values.push(filters.tenantId);
  }
  if (filters.category) {
    conditions.push("category = ?");
    values.push(filters.category);
  }
  if (filters.visibility) {
    conditions.push("visibility = ?");
    values.push(filters.visibility);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await app.masterDbPool.execute<MediaAssetRow[]>(
    `SELECT * FROM platform_media_assets ${where} ORDER BY updated_at DESC, created_at DESC LIMIT 300`,
    values
  );
  return rows.map(toMediaAsset);
}

async function getAsset(app: FastifyInstance, assetId: string, tenantId: string) {
  const [rows] = await app.masterDbPool.execute<MediaAssetRow[]>(
    "SELECT * FROM platform_media_assets WHERE asset_id = ? AND tenant_id = ? LIMIT 1",
    [assetId, tenantId]
  );
  return rows[0] ? toMediaAsset(rows[0]) : null;
}

async function getAssetById(app: FastifyInstance, assetId: string) {
  const [rows] = await app.masterDbPool.execute<MediaAssetRow[]>(
    "SELECT * FROM platform_media_assets WHERE asset_id = ? LIMIT 1",
    [assetId]
  );
  return rows[0] ? toMediaAsset(rows[0]) : null;
}

async function tenantInfo(app: FastifyInstance, tenantId: string) {
  const [rows] = await app.masterDbPool.execute<Array<{ slug: string | null; tenant_code: string }>>(
    "SELECT tenant_code, slug FROM tenants WHERE id = ? LIMIT 1",
    [tenantId]
  );
  const tenant = rows[0];
  if (!tenant) throw AppError.notFound("Tenant not found");
  return { slug: safeSegment(tenant.slug || tenant.tenant_code) };
}

async function tenantMediaSettings(app: FastifyInstance, tenantId: string): Promise<TenantMediaSettings> {
  const [rows] = await app.masterDbPool.execute<Array<{ payload_settings: string | null }>>(
    "SELECT payload_settings FROM tenants WHERE id = ? LIMIT 1",
    [tenantId]
  );
  return mediaSettingsFromPayload(parseJsonObject(rows[0]?.payload_settings));
}

function mediaSettingsFromPayload(payload: Record<string, unknown>): TenantMediaSettings {
  const media = isPlainObject(payload.media) ? payload.media : {};
  const visibility = stringField(media.defaultVisibility);
  return {
    defaultCategory: safeSegment(stringField(media.defaultCategory) || defaultMediaSettings.defaultCategory),
    defaultFolder: safeFolder(stringField(media.defaultFolder) || defaultMediaSettings.defaultFolder),
    defaultVisibility: visibility === "tenant" || visibility === "public" || visibility === "private" ? visibility : defaultMediaSettings.defaultVisibility,
    maxUploadMb: Math.max(1, Number(media.maxUploadMb ?? defaultMediaSettings.maxUploadMb) || defaultMediaSettings.maxUploadMb),
    publicAssetsEnabled: Boolean(media.publicAssetsEnabled)
  };
}

function mediaVisibility(value: string | undefined, settings: TenantMediaSettings) {
  if (value === "public" && !settings.publicAssetsEnabled) {
    throw AppError.validation("Public media assets are disabled for this tenant");
  }
  if (value === "public" || value === "tenant" || value === "private") return value;
  return "private";
}

function parseDataUrl(dataUrl: string, fallbackMimeType: string | undefined) {
  const match = dataUrl.match(/^data:([^;,]+)?(?:;base64)?,(.*)$/);
  if (!match) throw AppError.validation("dataUrl must be a valid data URL");
  const mimeType = match[1] || fallbackMimeType || "application/octet-stream";
  const buffer = Buffer.from(match[2] ?? "", "base64");
  return { buffer, mimeType };
}

function toMediaAsset(row: MediaAssetRow) {
  return {
    assetId: row.asset_id,
    scope: row.scope,
    tenantId: row.tenant_id,
    tenantSlug: row.tenant_slug,
    category: row.category,
    visibility: row.visibility,
    folder: row.folder,
    fileName: row.file_name,
    originalName: row.original_name,
    mimeType: row.mime_type,
    extension: row.extension,
    sizeBytes: toNumber(row.size_bytes),
    storagePath: row.storage_path,
    publicUrl: row.public_url ?? `/media/assets/${row.asset_id}/content`,
    checksum: row.checksum,
    altText: row.alt_text ?? "",
    caption: row.caption ?? "",
    isActive: Boolean(row.is_active),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString(),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : new Date(row.updated_at).toISOString(),
    ...(row.deleted_at ? { deletedAt: row.deleted_at instanceof Date ? row.deleted_at.toISOString() : new Date(row.deleted_at).toISOString() } : {})
  };
}

async function auditMedia(app: FastifyInstance, request: { correlationId?: string; tenantId?: string }, actorEmail: string, eventName: string, payload: Record<string, unknown>) {
  await app.auditService.write({
    actorType: "tenant",
    actorEmail,
    ...(request.correlationId ? { correlationId: request.correlationId } : {}),
    ...(request.tenantId ? { tenantId: request.tenantId } : {}),
    eventName,
    payload
  });
}

async function mediaContentSession(app: FastifyInstance, request: {
  cookies?: Record<string, string | undefined>;
  headers: Record<string, unknown>;
  query: unknown;
}) {
  const query = isPlainObject(request.query) ? request.query : {};
  const queryToken = stringField(query.token);
  if (queryToken) {
    try {
      return await app.authService.getSession(queryToken);
    } catch {
      throw AppError.unauthorized("Invalid or expired session");
    }
  }
  return requireSession(app, request);
}

function parseJsonObject(value: string | null | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return isPlainObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stringField(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function safeSegment(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "media";
}

function safeFolder(value: string) {
  return value.split("/").map(safeSegment).filter(Boolean).join("/") || "media";
}

function safeFileName(value: string, fallbackExtension: string) {
  const parsed = path.parse(value.trim());
  const baseName = safeSegment(parsed.name || "file");
  const extension = safeSegment(parsed.ext.replace(/^\./, "") || fallbackExtension || "bin");
  return `${baseName}.${extension}`;
}

async function ensureTenantStorageRoot(tenantSlug: string) {
  const storageRoot = mediaStorageRoot();
  await Promise.all([
    mkdir(path.join(storageRoot, tenantSlug, "private"), { recursive: true }),
    mkdir(path.join(storageRoot, tenantSlug, "public"), { recursive: true })
  ]);
}

async function ensurePublicStorageLink() {
  const storageRoot = mediaStorageRoot();
  const publicRoot = mediaPublicRoot();
  await mkdir(storageRoot, { recursive: true });
  await mkdir(path.dirname(publicRoot), { recursive: true });
  try {
    const stat = await lstat(publicRoot);
    if (stat.isSymbolicLink() || stat.isDirectory()) return;
  } catch {
    // Create the Laravel-style public/storage -> storage/app link when it is missing.
  }
  try {
    await symlink(path.resolve(storageRoot), publicRoot, "junction");
  } catch {
    await mkdir(publicRoot, { recursive: true });
  }
}

function mediaStorageRoot() {
  return path.resolve(env.STORAGE_ROOT);
}

function mediaPublicRoot() {
  return path.resolve(env.STORAGE_PUBLIC_ROOT);
}

function publicStoragePath(value: string) {
  const parts = value.split(/[\\/]+/).map(safeSegment).filter(Boolean);
  if (parts.length < 3 || parts[1] !== "public") {
    throw AppError.notFound("Public media asset not found");
  }
  const filePath = path.join(mediaStorageRoot(), ...parts);
  const relative = path.relative(mediaStorageRoot(), filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw AppError.notFound("Public media asset not found");
  }
  return filePath;
}

async function uniqueStorageFileName(storageRoot: string, tenantSlug: string, visibility: string, folder: string, fileName: string) {
  const parsed = path.parse(fileName);
  for (let index = 0; index < 1000; index += 1) {
    const candidate = index === 0 ? fileName : `${parsed.name}-${index + 1}${parsed.ext}`;
    const candidatePath = path.join(storageRoot, tenantSlug, visibility, ...folder.split("/"), candidate);
    if (!(await fileExists(candidatePath))) return candidate;
  }
  return `${parsed.name}-${randomUUID()}${parsed.ext}`;
}

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function extensionFromName(fileName: string) {
  return path.extname(fileName).replace(".", "").toLowerCase();
}

function extensionFromMime(mimeType: string) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/svg+xml") return "svg";
  if (mimeType === "application/pdf") return "pdf";
  return "bin";
}

function toNumber(value: unknown): number {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  return Number(value) || 0;
}

function responseMeta(request: { correlationId?: string; id: string; tenantId?: string }) {
  return {
    requestId: request.id,
    ...(request.correlationId ? { correlationId: request.correlationId } : {}),
    ...(request.tenantId ? { tenantId: request.tenantId } : {})
  };
}
