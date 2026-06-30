import { BaseInMemoryRepository } from "../base/repository.js";
import type { StateRecord } from "./contracts.js";

export class StateRepository extends BaseInMemoryRepository<StateRecord> {}
