export type ProductItem = {
  itemId: string;
  tenantId: string;
  code: string;
  name: string;
  productTypeId?: string;
  hsnCodeId?: string;
  unitId?: string;
  taxId?: string;
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
  productTypeId?: string;
  hsnCodeId?: string;
  unitId?: string;
  taxId?: string;
  createdBy: string;
};

export type ProductUpdateInput = {
  tenantId: string;
  itemId: string;
  name?: string;
  productTypeId?: string;
  hsnCodeId?: string;
  unitId?: string;
  taxId?: string;
  updatedBy: string;
};

export const productPermissions = ["core.product.view", "core.product.manage"] as const;
export const productFeatureKey = "core" as const;
