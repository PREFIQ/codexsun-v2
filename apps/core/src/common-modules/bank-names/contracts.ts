import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type BankNameRecord = CommonRecord & {
    name: string;
};

export type BankNameCreateInput = CommonCreateInput & {
    name: string;
};

export type BankNameUpdateInput = CommonUpdateInput & {
    name?: string;
};
