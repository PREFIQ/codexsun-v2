import { BaseInMemoryRepository } from "../base/repository.js";
import type { DistrictRecord } from "./contracts.js";

export class DistrictRepository extends BaseInMemoryRepository<DistrictRecord> {}
