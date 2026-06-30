import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type ProductTypeRecord = CommonRecord & {
    name: string;
};

export type ProductTypeCreateInput = CommonCreateInput & {
    name: string;
};

export type ProductTypeUpdateInput = CommonUpdateInput & {
    name?: string;
};
