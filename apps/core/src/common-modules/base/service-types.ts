import type { CommonRecord } from "./contracts.js";

export interface CommonModuleService {
  list(tenantId: string): Promise<CommonRecord[]>;
  getById(tenantId: string, id: string): Promise<CommonRecord>;
  create(input: Record<string, unknown>): Promise<CommonRecord>;
  update(input: Record<string, unknown>): Promise<CommonRecord>;
  archive(tenantId: string, id: string): Promise<void>;
  restore(tenantId: string, id: string): Promise<void>;
  forceDelete?: (tenantId: string, id: string) => Promise<void>;
}

export type CommonModuleServiceMap = Record<string, CommonModuleService>;

export interface CommonModuleDefinition {
  key: string;
  label: string;
}
