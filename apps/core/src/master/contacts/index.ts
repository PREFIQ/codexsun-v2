export type {
  ContactProfile, AddressBookEntry, ContactEmail, ContactPhone,
  ContactSocialLink, ContactBankAccount, ContactGstDetail,
  ContactCreateInput, ContactUpdateInput
} from "./contracts.js";
export { contactPermissions, contactFeatureKey } from "./contracts.js";
export type { ContactRepository } from "./repository.js";
export { InMemoryContactRepository } from "./repository.js";
export { ContactService } from "./service.js";
