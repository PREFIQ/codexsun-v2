import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type CurrencyRecord = CommonRecord & {
    name: string;
};

export type CurrencyCreateInput = CommonCreateInput & {
    name: string;
};

export type CurrencyUpdateInput = CommonUpdateInput & {
    name?: string;
};
