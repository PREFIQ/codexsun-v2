import { BaseInMemoryRepository } from "../base/repository.js";
import type { AccountingYearRecord } from "./contracts.js";

export class AccountingYearRepository extends BaseInMemoryRepository<AccountingYearRecord> {}
