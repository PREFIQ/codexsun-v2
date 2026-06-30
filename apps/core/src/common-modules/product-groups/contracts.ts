import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type ProductGroupRecord = CommonRecord & {
    name: string;
};

export type ProductGroupCreateInput = CommonCreateInput & {
    name: string;
};

export type ProductGroupUpdateInput = CommonUpdateInput & {
    name?: string;
};
