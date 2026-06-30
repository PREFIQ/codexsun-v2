export type WorkOrderProfile = {
  orderId: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  status: "active" | "archived";
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  deletedAt?: string;
};

export type WorkOrderCreateInput = {
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  createdBy: string;
};

export type WorkOrderUpdateInput = {
  tenantId: string;
  orderId: string;
  name?: string;
  description?: string;
  updatedBy: string;
};

export const workOrderPermissions = ["core.work-order.view", "core.work-order.manage"] as const;
export const workOrderFeatureKey = "core" as const;
