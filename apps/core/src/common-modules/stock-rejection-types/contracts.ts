import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type StockRejectionTypeRecord = CommonRecord & {
    name: string;
};

export type StockRejectionTypeCreateInput = CommonCreateInput & {
    name: string;
};

export type StockRejectionTypeUpdateInput = CommonUpdateInput & {
    name?: string;
};
