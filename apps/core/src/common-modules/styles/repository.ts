import { BaseInMemoryRepository } from "../base/repository.js";
import type { StyleRecord } from "./contracts.js";

export class StyleRepository extends BaseInMemoryRepository<StyleRecord> {}
