import { BaseInMemoryRepository } from "../base/repository.js";
import type { PincodeRecord } from "./contracts.js";

export class PincodeRepository extends BaseInMemoryRepository<PincodeRecord> {}
