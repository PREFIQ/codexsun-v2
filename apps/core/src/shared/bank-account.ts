export type BankAccountBlock = {
  accountId: string;
  accountHolderName: string;
  accountNumber: string;
  accountTypeId?: string;
  ifscCode: string;
  bankName?: string;
  branchName?: string;
  isDefault: boolean;
};
