import { BaseInMemoryRepository } from "../base/repository.js";
import type { ContactTypeRecord } from "./contracts.js";

export class ContactTypeRepository extends BaseInMemoryRepository<ContactTypeRecord> {}
