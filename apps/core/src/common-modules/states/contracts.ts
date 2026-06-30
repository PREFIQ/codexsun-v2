import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type StateRecord = CommonRecord & {
    name: string;
    code: string;
    countryId: number;
};

export type StateCreateInput = CommonCreateInput & {
    name: string;
    code: string;
    countryId: number;
};

export type StateUpdateInput = CommonUpdateInput & {
    name?: string;
    code?: string;
    countryId?: number;
};
