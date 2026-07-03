export type ProductItem = {
  itemId: string;
  tenantId: string;
  code: string;
  name: string;
  productTypeId?: string;
  hsnCodeId?: string;
  unitId?: string;
  taxId?: string;
  imageUrl?: string;
  openingStock: number;
  openingPrice: number;
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
  imageUrl?: string;
  openingStock?: number;
  openingPrice?: number;
  createdBy: string;
};

export type ProductUpdateInput = {
  tenantId: string;
  itemId: string;
  code?: string;
  name?: string;
  productTypeId?: string;
  hsnCodeId?: string;
  unitId?: string;
  taxId?: string;
  imageUrl?: string;
  openingStock?: number;
  openingPrice?: number;
  updatedBy: string;
};

export const productPermissions = ["core.product.view", "core.product.manage"] as const;
export const productFeatureKey = "core" as const;
