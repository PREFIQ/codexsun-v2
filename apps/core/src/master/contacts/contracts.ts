export type AddressBookEntry = {
  id: string;
  uuid: string;
  ownerType: string;
  ownerId: string;
  addressTypeId?: string;
  addressLine1?: string;
  addressLine2?: string;
  cityId?: string;
  districtId?: string;
  stateId?: string;
  countryId?: string;
  pincodeId?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  isActive: boolean;
};

export type ContactEmail = {
  id: string;
  uuid: string;
  contactId: string;
  email: string;
  emailType?: string;
  isPrimary: boolean;
  isActive: boolean;
};

export type ContactPhone = {
  id: string;
  uuid: string;
  contactId: string;
  phoneNumber: string;
  phoneType?: string;
  isPrimary: boolean;
  isActive: boolean;
};

export type ContactSocialLink = {
  id: string;
  uuid: string;
  contactId: string;
  platform: string;
  url: string;
  isActive: boolean;
};

export type ContactBankAccount = {
  id: string;
  uuid: string;
  contactId: string;
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  ifsc?: string;
  branch?: string;
  isPrimary: boolean;
  isActive: boolean;
};

export type ContactGstDetail = {
  id: string;
  uuid: string;
  contactId: string;
  gstin?: string;
  state?: string;
  isDefault: boolean;
  isActive: boolean;
};

export type ContactProfile = {
  contactId: string;
  tenantId: string;
  code: string;
  name: string;
  contactTypeId?: string;
  contactGroupId?: string;
  ledgerId?: string;
  ledgerName?: string;
  legalName?: string;
  pan?: string;
  gstin?: string;
  msmeType?: string;
  msmeNo?: string;
  tan?: string;
  tdsAvailable?: boolean;
  tcsAvailable?: boolean;
  openingBalance?: number;
  balanceType?: string;
  creditLimit?: number;
  website?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  description?: string;
  addressBook: AddressBookEntry[];
  contactEmails: ContactEmail[];
  contactPhones: ContactPhone[];
  contactSocialLinks: ContactSocialLink[];
  contactBankAccounts: ContactBankAccount[];
  contactGstDetails: ContactGstDetail[];
  status: "active" | "archived";
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  deletedAt?: string;
};

export type ContactCreateInput = {
  tenantId: string;
  code?: string;
  name: string;
  contactTypeId?: string;
  contactGroupId?: string;
  ledgerId?: string;
  ledgerName?: string;
  legalName?: string;
  pan?: string;
  gstin?: string;
  msmeType?: string;
  msmeNo?: string;
  tan?: string;
  tdsAvailable?: boolean;
  tcsAvailable?: boolean;
  openingBalance?: number;
  balanceType?: string;
  creditLimit?: number;
  website?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  description?: string;
  addressBook?: AddressBookEntry[];
  contactEmails?: ContactEmail[];
  contactPhones?: ContactPhone[];
  contactSocialLinks?: ContactSocialLink[];
  contactBankAccounts?: ContactBankAccount[];
  contactGstDetails?: ContactGstDetail[];
  createdBy: string;
};

export type ContactUpdateInput = {
  tenantId: string;
  contactId: string;
  code?: string;
  name?: string;
  contactTypeId?: string;
  contactGroupId?: string;
  ledgerId?: string;
  ledgerName?: string;
  legalName?: string;
  pan?: string;
  gstin?: string;
  msmeType?: string;
  msmeNo?: string;
  tan?: string;
  tdsAvailable?: boolean;
  tcsAvailable?: boolean;
  openingBalance?: number;
  balanceType?: string;
  creditLimit?: number;
  website?: string;
  primaryEmail?: string;
  primaryPhone?: string;
  description?: string;
  addressBook?: AddressBookEntry[];
  contactEmails?: ContactEmail[];
  contactPhones?: ContactPhone[];
  contactSocialLinks?: ContactSocialLink[];
  contactBankAccounts?: ContactBankAccount[];
  contactGstDetails?: ContactGstDetail[];
  updatedBy: string;
};

export const contactPermissions = ["core.contact.view", "core.contact.manage"] as const;
export const contactFeatureKey = "core" as const;
