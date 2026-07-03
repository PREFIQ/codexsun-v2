import type { ProductItem } from "./contracts.js";
import type { CompatibleDbPool } from "@codexsun/framework/db";

export interface ProductRepository {
  list(tenantId: string): Promise<ProductItem[]>;
  getById(tenantId: string, itemId: string): Promise<ProductItem | null>;
  getByCode(tenantId: string, code: string): Promise<ProductItem | null>;
  create(product: ProductItem): Promise<void>;
  update(product: ProductItem): Promise<void>;
  archive(tenantId: string, itemId: string): Promise<void>;
  restore(tenantId: string, itemId: string): Promise<void>;
}

export class DatabaseProductRepository implements ProductRepository {
  constructor(private readonly pool: CompatibleDbPool) {}

  async list(tenantId: string): Promise<ProductItem[]> {
    const [rows] = await this.pool.execute<ProductRow[]>(
      `SELECT *
       FROM tenant_products
       WHERE tenant_id = ? AND deleted_at IS NULL
       ORDER BY name ASC, created_at ASC`,
      [tenantId]
    );
    return rows.map(rowToProduct);
  }

  async getById(tenantId: string, itemId: string): Promise<ProductItem | null> {
    const [rows] = await this.pool.execute<ProductRow[]>(
      `SELECT *
       FROM tenant_products
       WHERE tenant_id = ? AND item_id = ?
       LIMIT 1`,
      [tenantId, itemId]
    );
    return rows[0] ? rowToProduct(rows[0]) : null;
  }

  async getByCode(tenantId: string, code: string): Promise<ProductItem | null> {
    const [rows] = await this.pool.execute<ProductRow[]>(
      `SELECT *
       FROM tenant_products
       WHERE tenant_id = ? AND code = ? AND deleted_at IS NULL
       LIMIT 1`,
      [tenantId, code]
    );
    return rows[0] ? rowToProduct(rows[0]) : null;
  }

  async create(product: ProductItem): Promise<void> {
    await this.pool.execute(
      `INSERT INTO tenant_products (
         tenant_id, item_id, code, name, product_type_id, hsn_code_id, unit_id, tax_id,
         image_url, opening_stock, opening_price, status, created_by, updated_by,
         created_at, updated_at, deleted_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         code = VALUES(code),
         name = VALUES(name),
         product_type_id = VALUES(product_type_id),
         hsn_code_id = VALUES(hsn_code_id),
         unit_id = VALUES(unit_id),
         tax_id = VALUES(tax_id),
         image_url = VALUES(image_url),
         opening_stock = VALUES(opening_stock),
         opening_price = VALUES(opening_price),
         status = VALUES(status),
         updated_by = VALUES(updated_by),
         updated_at = VALUES(updated_at),
         deleted_at = VALUES(deleted_at)`,
      productValues(product)
    );
  }

  async update(product: ProductItem): Promise<void> {
    await this.create(product);
  }

  async archive(tenantId: string, itemId: string): Promise<void> {
    await this.pool.execute(
      `UPDATE tenant_products
       SET status = 'archived', deleted_at = COALESCE(deleted_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP
       WHERE tenant_id = ? AND item_id = ?`,
      [tenantId, itemId]
    );
  }

  async restore(tenantId: string, itemId: string): Promise<void> {
    await this.pool.execute(
      `UPDATE tenant_products
       SET status = 'active', deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE tenant_id = ? AND item_id = ?`,
      [tenantId, itemId]
    );
  }
}

type ProductRow = {
  code: string;
  created_at: Date | string;
  created_by: string;
  deleted_at: Date | string | null;
  hsn_code_id: string | null;
  image_url: string | null;
  item_id: string;
  name: string;
  opening_price: number | string | null;
  opening_stock: number | string | null;
  product_type_id: string | null;
  status: string;
  tax_id: string | null;
  tenant_id: string;
  unit_id: string | null;
  updated_at: Date | string;
  updated_by: string;
};

function productValues(product: ProductItem) {
  return [
    product.tenantId,
    product.itemId,
    product.code,
    product.name,
    nullable(product.productTypeId),
    nullable(product.hsnCodeId),
    nullable(product.unitId),
    nullable(product.taxId),
    nullable(product.imageUrl),
    numberValue(product.openingStock),
    numberValue(product.openingPrice),
    product.status,
    product.createdBy,
    product.updatedBy,
    toSqlTimestamp(product.createdAt),
    toSqlTimestamp(product.updatedAt),
    product.deletedAt ? toSqlTimestamp(product.deletedAt) : null
  ];
}

function rowToProduct(row: ProductRow): ProductItem {
  const product: ProductItem = {
    itemId: String(row.item_id),
    tenantId: String(row.tenant_id),
    code: String(row.code),
    name: String(row.name),
    imageUrl: stringOrUndefined(row.image_url) ?? "",
    openingStock: numberValue(row.opening_stock),
    openingPrice: numberValue(row.opening_price),
    status: row.status === "archived" ? "archived" : "active",
    createdBy: String(row.created_by ?? ""),
    createdAt: fromSqlTimestamp(row.created_at),
    updatedBy: String(row.updated_by ?? ""),
    updatedAt: fromSqlTimestamp(row.updated_at),
    ...(row.deleted_at ? { deletedAt: fromSqlTimestamp(row.deleted_at) } : {})
  };
  const productTypeId = stringOrUndefined(row.product_type_id);
  const hsnCodeId = stringOrUndefined(row.hsn_code_id);
  const unitId = stringOrUndefined(row.unit_id);
  const taxId = stringOrUndefined(row.tax_id);
  if (productTypeId) product.productTypeId = productTypeId;
  if (hsnCodeId) product.hsnCodeId = hsnCodeId;
  if (unitId) product.unitId = unitId;
  if (taxId) product.taxId = taxId;
  return product;
}

function nullable(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function stringOrUndefined(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value).trim();
  return text || undefined;
}

function numberValue(value: unknown) {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function toSqlTimestamp(value: string) {
  return value.includes("T") ? value.slice(0, 19).replace("T", " ") : value;
}

function fromSqlTimestamp(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
