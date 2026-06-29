import { AppError } from "@codexsun/framework/errors";
import type { TenantProfile } from "./contracts.js";
import type { TenantRepository } from "./repository.js";

export type CreateTenantInput = {
  tenantCode: string;
  tenantName: string;
  status?: string;
};

export type UpdateTenantInput = {
  tenantName?: string;
  status?: string;
};

export type TenantDTO = {
  id: string;
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

    const id = await this.repository.create({
      tenantCode: code,
      tenantName: input.tenantName.trim(),
      status
    });

    return {
      id,
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

    if (input.status) {
      const validStatuses = ["active", "inactive", "provisioning", "suspended"];
      if (!validStatuses.includes(input.status)) {
        throw AppError.validation(`Invalid status: ${input.status}`);
      }
    }

    await this.repository.update(id, input);

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
      id: profile.id,
      tenantCode: profile.tenantCode,
      tenantName: profile.name,
      status: profile.status
    };
  }
}
