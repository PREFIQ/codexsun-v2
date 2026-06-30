import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type OrderTypeRecord = CommonRecord & {
    name: string;
};

export type OrderTypeCreateInput = CommonCreateInput & {
    name: string;
};

export type OrderTypeUpdateInput = CommonUpdateInput & {
    name?: string;
};
