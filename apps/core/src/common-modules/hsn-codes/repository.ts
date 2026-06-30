import { BaseInMemoryRepository } from "../base/repository.js";
import type { HsnCodeRecord } from "./contracts.js";

export class HsnCodeRepository extends BaseInMemoryRepository<HsnCodeRecord> {}
