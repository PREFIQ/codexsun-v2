import { BaseInMemoryRepository } from "../base/repository.js";
import type { BankAccountTypeRecord } from "./contracts.js";

export class BankAccountTypeRepository extends BaseInMemoryRepository<BankAccountTypeRecord> {}
