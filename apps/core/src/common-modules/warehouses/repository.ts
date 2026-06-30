import { BaseInMemoryRepository } from "../base/repository.js";
import type { WarehouseRecord } from "./contracts.js";

export class WarehouseRepository extends BaseInMemoryRepository<WarehouseRecord> {}
