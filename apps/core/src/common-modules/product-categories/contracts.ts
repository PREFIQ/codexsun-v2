import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type ProductCategoryRecord = CommonRecord & {
    name: string;
};

export type ProductCategoryCreateInput = CommonCreateInput & {
    name: string;
};

export type ProductCategoryUpdateInput = CommonUpdateInput & {
    name?: string;
};
