import { BaseInMemoryRepository } from "../base/repository.js";
import type { SalesAccountTypeRecord } from "./contracts.js";

export class SalesAccountTypeRepository extends BaseInMemoryRepository<SalesAccountTypeRecord> {}
