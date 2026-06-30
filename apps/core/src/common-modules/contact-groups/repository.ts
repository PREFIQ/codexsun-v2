import { BaseInMemoryRepository } from "../base/repository.js";
import type { ContactGroupRecord } from "./contracts.js";

export class ContactGroupRepository extends BaseInMemoryRepository<ContactGroupRecord> {}
