import { BaseInMemoryRepository } from "../base/repository.js";
import type { CurrencyRecord } from "./contracts.js";

export class CurrencyRepository extends BaseInMemoryRepository<CurrencyRecord> {}
