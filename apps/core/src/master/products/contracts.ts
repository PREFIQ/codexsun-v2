export type ProductItem = {
  itemId: string;
  tenantId: string;
  code: string;
  name: string;
  productTypeId?: number;
  hsnCodeId?: number;
  unitId?: number;
  taxId?: number;
  status: "active" | "archived";
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  deletedAt?: string;
};

export type ProductCreateInput = {
  tenantId: string;
  code: string;
  name: string;
  productTypeId?: number;
  hsnCodeId?: number;
  unitId?: number;
  taxId?: number;
  createdBy: string;
};

export type ProductUpdateInput = {
  tenantId: string;
  itemId: string;
  name?: string;
  productTypeId?: number;
  hsnCodeId?: number;
  unitId?: number;
  taxId?: number;
  updatedBy: string;
};

export const productPermissions = ["core.product.view", "core.product.manage"] as const;
export const productFeatureKey = "core" as const;
