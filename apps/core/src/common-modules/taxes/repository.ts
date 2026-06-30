import { BaseInMemoryRepository } from "../base/repository.js";
import type { TaxRecord } from "./contracts.js";

export class TaxRepository extends BaseInMemoryRepository<TaxRecord> {}
