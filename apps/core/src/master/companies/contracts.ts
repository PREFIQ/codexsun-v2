import type { AddressBlock } from "../../shared/address.js";
import type { BankAccountBlock } from "../../shared/bank-account.js";
import type { TaxIdentityBlock } from "../../shared/tax-identity.js";
import type { PhoneBlock, EmailBlock } from "../../shared/contact-info.js";

export type CompanyProfile = {
  companyId: string;
  tenantId: string;
  legalName: string;
  tradeName?: string;
  companyGroupId?: string;
  phone: PhoneBlock[];
  email: EmailBlock[];
  addresses: AddressBlock[];
  bankAccounts: BankAccountBlock[];
  taxIdentities: TaxIdentityBlock[];
  website?: string;
  logoUrl?: string;
  notes?: string;
  status: "active" | "archived";
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  deletedAt?: string;
};

export type CompanyCreateInput = {
  tenantId: string;
  legalName: string;
  tradeName?: string;
  companyGroupId?: string;
  phone?: PhoneBlock[];
  email?: EmailBlock[];
  addresses?: AddressBlock[];
  bankAccounts?: BankAccountBlock[];
  taxIdentities?: TaxIdentityBlock[];
  website?: string;
  logoUrl?: string;
  notes?: string;
  createdBy: string;
};

export type CompanyUpdateInput = {
  tenantId: string;
  companyId: string;
  legalName?: string;
  tradeName?: string;
  companyGroupId?: string;
  phone?: PhoneBlock[];
  email?: EmailBlock[];
  addresses?: AddressBlock[];
  bankAccounts?: BankAccountBlock[];
  taxIdentities?: TaxIdentityBlock[];
  website?: string;
  logoUrl?: string;
  notes?: string;
  updatedBy: string;
};

export type CompanyAddress = AddressBlock;
export type CompanyBankAccount = BankAccountBlock;
export type CompanyTaxDetail = TaxIdentityBlock;

export const companyPermissions = ["core.company.view", "core.company.manage"] as const;
export const companyFeatureKey = "core" as const;
