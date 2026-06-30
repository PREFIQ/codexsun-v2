import { BaseInMemoryRepository } from "../base/repository.js";
import type { ProductCategoryRecord } from "./contracts.js";

export class ProductCategoryRepository extends BaseInMemoryRepository<ProductCategoryRecord> {}
