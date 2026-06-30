import { BaseInMemoryRepository } from "../base/repository.js";
import type { PaymentTermRecord } from "./contracts.js";

export class PaymentTermRepository extends BaseInMemoryRepository<PaymentTermRecord> {}
