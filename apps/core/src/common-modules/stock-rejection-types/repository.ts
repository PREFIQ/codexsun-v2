import { BaseInMemoryRepository } from "../base/repository.js";
import type { StockRejectionTypeRecord } from "./contracts.js";

export class StockRejectionTypeRepository extends BaseInMemoryRepository<StockRejectionTypeRecord> {}
