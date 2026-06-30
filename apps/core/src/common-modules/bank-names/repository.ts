import { BaseInMemoryRepository } from "../base/repository.js";
import type { BankNameRecord } from "./contracts.js";

export class BankNameRepository extends BaseInMemoryRepository<BankNameRecord> {}
