import { BaseInMemoryRepository } from "../base/repository.js";
import type { ColourRecord } from "./contracts.js";

export class ColourRepository extends BaseInMemoryRepository<ColourRecord> {}
