import { BaseInMemoryRepository } from "../base/repository.js";
import type { MonthRecord } from "./contracts.js";

export class MonthRepository extends BaseInMemoryRepository<MonthRecord> {}
