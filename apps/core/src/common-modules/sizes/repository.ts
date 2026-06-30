import { BaseInMemoryRepository } from "../base/repository.js";
import type { SizeRecord } from "./contracts.js";

export class SizeRepository extends BaseInMemoryRepository<SizeRecord> {}
