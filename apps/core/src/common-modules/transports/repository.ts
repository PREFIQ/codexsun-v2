import { BaseInMemoryRepository } from "../base/repository.js";
import type { TransportRecord } from "./contracts.js";

export class TransportRepository extends BaseInMemoryRepository<TransportRecord> {}
