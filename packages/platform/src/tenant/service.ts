import { AppError } from "@codexsun/framework/errors";
import type { TenantProfile } from "./contracts.js";
import type { TenantRepository } from "./repository.js";

export type CreateTenantInput = {
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
  tenantCode: string;
  tenantName: string;
  status?: string;
};

export type UpdateTenantInput = {
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
  tenantCode?: string;
  tenantName?: string;
  status?: string;
};

export type TenantDTO = {
  corporateId: string | null;
  dbHost: string;
  dbName: string;
  dbPort: number;
  dbSecretRef: string;
  dbType: string;
  dbUser: string;
  enabledModuleKeys: string[];
  id: string;
  mobile: string | null;
  payloadSettings: Record<string, unknown>;
  slug: string;
  tenantCode: string;
  tenantName: string;
  status: string;
};

export class TenantService {
  constructor(private readonly repository: TenantRepository) {}

  async list(): Promise<TenantDTO[]> {
    const profiles = await this.repository.list();
    return profiles.map(this.toDTO);
  }

  async getById(id: string): Promise<TenantDTO> {
    const profile = await this.repository.getById(id);
    if (!profile) {
      throw AppError.notFound("Tenant not found");
    }
    return this.toDTO(profile);
  }

  async create(input: CreateTenantInput): Promise<TenantDTO> {
    if (!input.tenantCode || !input.tenantName) {
      throw AppError.validation("tenantCode and tenantName are required");
    }

    const code = input.tenantCode.trim().toLowerCase();
    if (code.length < 2) {
      throw AppError.validation("Tenant code must be at least 2 characters");
    }

    const existing = await this.repository.findByCode(code);
    if (existing) {
      throw AppError.conflict("Tenant code already exists");
    }

    const status = input.status || "active";
    const validStatuses = ["active", "inactive", "provisioning", "suspended"];
    if (!validStatuses.includes(status)) {
      throw AppError.validation(`Invalid status: ${status}`);
    }

    const slug = normalizeSlug(input.slug ?? code);
    const payloadSettings = buildPayloadSettings(input.payloadSettings, input.enabledModuleKeys);
    const id = await this.repository.create({
      corporateId: normalizeOptional(input.corporateId),
      dbHost: input.dbHost?.trim() || "localhost",
      dbName: normalizeDatabaseName(input.dbName ?? code),
      dbPort: input.dbPort || 3306,
      dbSecretRef: input.dbSecretRef?.trim() || "DB_PASSWORD",
      dbType: input.dbType?.trim() || "mariadb",
      dbUser: input.dbUser?.trim() || "root",
      mobile: normalizeOptional(input.mobile),
      payloadSettings,
      slug,
      tenantCode: code,
      tenantName: input.tenantName.trim(),
      status
    });

    return {
      id,
      corporateId: normalizeOptional(input.corporateId),
      dbHost: input.dbHost?.trim() || "localhost",
      dbName: normalizeDatabaseName(input.dbName ?? code),
      dbPort: input.dbPort || 3306,
      dbSecretRef: input.dbSecretRef?.trim() || "DB_PASSWORD",
      dbType: input.dbType?.trim() || "mariadb",
      dbUser: input.dbUser?.trim() || "root",
      enabledModuleKeys: extractEnabledModuleKeys(payloadSettings),
      mobile: normalizeOptional(input.mobile),
      payloadSettings,
      slug,
      tenantCode: code,
      tenantName: input.tenantName.trim(),
      status
    };
  }

  async update(id: string, input: UpdateTenantInput): Promise<TenantDTO> {
    const existing = await this.repository.getById(id);
    if (!existing) {
      throw AppError.notFound("Tenant not found");
    }

    let tenantCode: string | undefined;
    if (input.tenantCode !== undefined) {
      tenantCode = input.tenantCode.trim().toLowerCase();
      if (tenantCode.length < 2) {
        throw AppError.validation("Tenant code must be at least 2 characters");
      }
      const tenantWithCode = await this.repository.findByCode(tenantCode);
      if (tenantWithCode && tenantWithCode.id !== id) {
        throw AppError.conflict("Tenant code already exists");
      }
    }

    if (input.status) {
      const validStatuses = ["active", "inactive", "provisioning", "suspended"];
      if (!validStatuses.includes(input.status)) {
        throw AppError.validation(`Invalid status: ${input.status}`);
      }
    }

    const payloadSettings = input.payloadSettings !== undefined || input.enabledModuleKeys !== undefined
      ? buildPayloadSettings(input.payloadSettings ?? existing.payloadSettings, input.enabledModuleKeys)
      : undefined;
    await this.repository.update(id, {
      ...(input.corporateId !== undefined ? { corporateId: normalizeOptional(input.corporateId) } : {}),
      ...(input.dbHost !== undefined ? { dbHost: input.dbHost.trim() || "localhost" } : {}),
      ...(input.dbName !== undefined ? { dbName: normalizeDatabaseName(input.dbName) } : {}),
      ...(input.dbPort !== undefined ? { dbPort: input.dbPort || 3306 } : {}),
      ...(input.dbSecretRef !== undefined ? { dbSecretRef: input.dbSecretRef.trim() || "DB_PASSWORD" } : {}),
      ...(input.dbType !== undefined ? { dbType: input.dbType.trim() || "mariadb" } : {}),
      ...(input.dbUser !== undefined ? { dbUser: input.dbUser.trim() || "root" } : {}),
      ...(input.mobile !== undefined ? { mobile: normalizeOptional(input.mobile) } : {}),
      ...(payloadSettings !== undefined ? { payloadSettings } : {}),
      ...(input.slug !== undefined ? { slug: normalizeSlug(input.slug) } : {}),
      ...(tenantCode !== undefined ? { tenantCode } : {}),
      ...(input.tenantName !== undefined ? { tenantName: input.tenantName.trim() } : {}),
      ...(input.status !== undefined ? { status: input.status } : {})
    });

    const updated = await this.repository.getById(id);
    return this.toDTO(updated!);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repository.getById(id);
    if (!existing) {
      throw AppError.notFound("Tenant not found");
    }
    if (existing.status === "inactive") {
      throw AppError.conflict("Tenant is already archived");
    }
    await this.repository.delete(id);
  }

  private toDTO(profile: TenantProfile): TenantDTO {
    return {
      corporateId: profile.corporateId,
      dbHost: profile.dbHost,
      dbName: profile.dbName,
      dbPort: profile.dbPort,
      dbSecretRef: profile.dbSecretRef,
      dbType: profile.dbType,
      dbUser: profile.dbUser,
      enabledModuleKeys: extractEnabledModuleKeys(profile.payloadSettings),
      id: profile.id,
      mobile: profile.mobile,
      payloadSettings: profile.payloadSettings,
      slug: profile.slug,
      tenantCode: profile.tenantCode,
      tenantName: profile.name,
      status: profile.status
    };
  }
}

function normalizeOptional(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeSlug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "");
}

function normalizeDatabaseName(value: string): string {
  const normalized = normalizeSlug(value).replace(/_db$/, "");
  return normalized ? `${normalized}_db` : "tenant_db";
}

function buildPayloadSettings(
  current: Record<string, unknown> | undefined,
  enabledModuleKeys: string[] | undefined
): Record<string, unknown> {
  const settings = { ...(current ?? {}) };
  if (enabledModuleKeys !== undefined) {
    settings.apps = { enabled: enabledModuleKeys };
  }
  return settings;
}

function extractEnabledModuleKeys(settings: Record<string, unknown>): string[] {
  const apps = settings.apps;
  if (!apps || typeof apps !== "object" || Array.isArray(apps)) return [];
  const enabled = (apps as { enabled?: unknown }).enabled;
  return Array.isArray(enabled) ? enabled.filter((item): item is string => typeof item === "string") : [];
}
