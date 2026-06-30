import { BaseInMemoryRepository } from "../base/repository.js";
import type { OrderTypeRecord } from "./contracts.js";

export class OrderTypeRepository extends BaseInMemoryRepository<OrderTypeRecord> {}
