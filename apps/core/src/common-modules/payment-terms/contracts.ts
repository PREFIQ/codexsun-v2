import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type PaymentTermRecord = CommonRecord & {
    name: string;
};

export type PaymentTermCreateInput = CommonCreateInput & {
    name: string;
};

export type PaymentTermUpdateInput = CommonUpdateInput & {
    name?: string;
};
