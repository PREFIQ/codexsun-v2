import { BaseInMemoryRepository } from "../base/repository.js";
import type { UnitRecord } from "./contracts.js";

export class UnitRepository extends BaseInMemoryRepository<UnitRecord> {}
