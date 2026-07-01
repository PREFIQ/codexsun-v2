import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type BankAccountTypeRecord = CommonRecord & {
  name: string;
};

export type BankAccountTypeCreateInput = CommonCreateInput & {
  name: string;
};

export type BankAccountTypeUpdateInput = CommonUpdateInput & {
  name?: string;
};
