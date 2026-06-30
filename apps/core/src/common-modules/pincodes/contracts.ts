import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type PincodeRecord = CommonRecord & {
    name: string;
};

export type PincodeCreateInput = CommonCreateInput & {
    name: string;
};

export type PincodeUpdateInput = CommonUpdateInput & {
    name?: string;
};
