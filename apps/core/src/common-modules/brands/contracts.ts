import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type BrandRecord = CommonRecord & {
    name: string;
};

export type BrandCreateInput = CommonCreateInput & {
    name: string;
};

export type BrandUpdateInput = CommonUpdateInput & {
    name?: string;
};
