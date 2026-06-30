import { BaseInMemoryRepository } from "../base/repository.js";
import type { PriorityRecord } from "./contracts.js";

export class PriorityRepository extends BaseInMemoryRepository<PriorityRecord> {}
