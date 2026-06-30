import { BaseInMemoryRepository } from "../base/repository.js";
import type { BrandRecord } from "./contracts.js";

export class BrandRepository extends BaseInMemoryRepository<BrandRecord> {}
