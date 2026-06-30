import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type SalesAccountTypeRecord = CommonRecord & {
    name: string;
    description?: string;
};

export type SalesAccountTypeCreateInput = CommonCreateInput & {
    name: string;
    description?: string;
};

export type SalesAccountTypeUpdateInput = CommonUpdateInput & {
    name?: string;
    description?: string;
};
