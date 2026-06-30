import { BaseInMemoryRepository } from "../base/repository.js";
import type { ProductGroupRecord } from "./contracts.js";

export class ProductGroupRepository extends BaseInMemoryRepository<ProductGroupRecord> {}
