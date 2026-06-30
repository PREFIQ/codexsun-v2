export type CommonRecord = {
  id: string;
  uuid: string;
  tenantId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type CommonCreateInput = {
  tenantId: string;
  createdBy: string;
};

export type CommonUpdateInput = {
  tenantId: string;
  id: string;
  updatedBy: string;
};