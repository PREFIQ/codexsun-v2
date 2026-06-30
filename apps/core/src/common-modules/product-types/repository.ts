import { BaseInMemoryRepository } from "../base/repository.js";
import type { ProductTypeRecord } from "./contracts.js";

export class ProductTypeRepository extends BaseInMemoryRepository<ProductTypeRecord> {}
