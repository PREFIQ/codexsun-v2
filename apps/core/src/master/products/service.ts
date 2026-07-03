import { AppError } from "@codexsun/framework/errors";
import type { ProductItem, ProductCreateInput, ProductUpdateInput } from "./contracts.js";
import type { ProductRepository } from "./repository.js";

export class ProductService {
  constructor(private readonly repository: ProductRepository) {}

  async list(tenantId: string): Promise<ProductItem[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId);
  }

  async getById(tenantId: string, itemId: string): Promise<ProductItem> {
    const product = await this.repository.getById(tenantId, itemId);
    if (!product) throw AppError.notFound("Product not found");
    return product;
  }

  async getByCode(tenantId: string, code: string): Promise<ProductItem> {
    const product = await this.repository.getByCode(tenantId, code);
    if (!product) throw AppError.notFound("Product not found");
    return product;
  }

  async create(input: ProductCreateInput): Promise<ProductItem> {
    if (!input.tenantId) throw AppError.validation("tenantId is required");
    if (!input.code?.trim()) throw AppError.validation("code is required");
    if (!input.name?.trim()) throw AppError.validation("name is required");
    const existing = await this.repository.getByCode(input.tenantId, input.code);
    if (existing) throw AppError.conflict(`Product with code '${input.code}' already exists`);
    const product: ProductItem = {
      itemId: crypto.randomUUID(),
      tenantId: input.tenantId,
      code: input.code,
      name: input.name,
      ...(input.productTypeId !== undefined ? { productTypeId: input.productTypeId } : {}),
      ...(input.hsnCodeId !== undefined ? { hsnCodeId: input.hsnCodeId } : {}),
      ...(input.unitId !== undefined ? { unitId: input.unitId } : {}),
      ...(input.taxId !== undefined ? { taxId: input.taxId } : {}),
      imageUrl: input.imageUrl ?? "",
      openingStock: numberOrZero(input.openingStock),
      openingPrice: numberOrZero(input.openingPrice),
      status: "active",
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
      updatedBy: input.createdBy,
      updatedAt: new Date().toISOString()
    };
    await this.repository.create(product);
    return product;
  }

  async update(input: ProductUpdateInput): Promise<ProductItem> {
    const existing = await this.getById(input.tenantId, input.itemId);
    const nextCode = input.code?.trim();
    if (nextCode && nextCode !== existing.code) {
      const duplicate = await this.repository.getByCode(input.tenantId, nextCode);
      if (duplicate && duplicate.itemId !== input.itemId) throw AppError.conflict(`Product with code '${nextCode}' already exists`);
    }
    const updated: ProductItem = {
      ...existing,
      ...(nextCode ? { code: nextCode } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.productTypeId !== undefined ? { productTypeId: input.productTypeId } : {}),
      ...(input.hsnCodeId !== undefined ? { hsnCodeId: input.hsnCodeId } : {}),
      ...(input.unitId !== undefined ? { unitId: input.unitId } : {}),
      ...(input.taxId !== undefined ? { taxId: input.taxId } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
      ...(input.openingStock !== undefined ? { openingStock: numberOrZero(input.openingStock) } : {}),
      ...(input.openingPrice !== undefined ? { openingPrice: numberOrZero(input.openingPrice) } : {}),
      updatedBy: input.updatedBy,
      updatedAt: new Date().toISOString()
    };
    await this.repository.update(updated);
    return updated;
  }

  async archive(tenantId: string, itemId: string): Promise<void> {
    const existing = await this.getById(tenantId, itemId);
    if (existing.status === "archived") throw AppError.conflict("Product is already archived");
    await this.repository.archive(tenantId, itemId);
  }

  async restore(tenantId: string, itemId: string): Promise<void> {
    const existing = await this.repository.getById(tenantId, itemId);
    if (!existing) throw AppError.notFound("Product not found");
    if (existing.status === "active") throw AppError.conflict("Product is already active");
    await this.repository.restore(tenantId, itemId);
  }
}

function numberOrZero(value: unknown) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}
