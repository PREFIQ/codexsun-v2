import { BaseInMemoryRepository } from "../base/repository.js";
import type { CountryRecord } from "./contracts.js";

export class CountryRepository extends BaseInMemoryRepository<CountryRecord> {}
