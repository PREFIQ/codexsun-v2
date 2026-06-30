import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type MonthRecord = CommonRecord & {
    name: string;
};

export type MonthCreateInput = CommonCreateInput & {
    name: string;
};

export type MonthUpdateInput = CommonUpdateInput & {
    name?: string;
};
