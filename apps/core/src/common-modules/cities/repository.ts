import { BaseInMemoryRepository } from "../base/repository.js";
import type { CityRecord } from "./contracts.js";

export class CityRepository extends BaseInMemoryRepository<CityRecord> {}
