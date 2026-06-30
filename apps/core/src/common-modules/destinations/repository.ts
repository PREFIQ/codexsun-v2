import { BaseInMemoryRepository } from "../base/repository.js";
import type { DestinationRecord } from "./contracts.js";

export class DestinationRepository extends BaseInMemoryRepository<DestinationRecord> {}
