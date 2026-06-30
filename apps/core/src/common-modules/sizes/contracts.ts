import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type SizeRecord = CommonRecord & {
    name: string;
};

export type SizeCreateInput = CommonCreateInput & {
    name: string;
};

export type SizeUpdateInput = CommonUpdateInput & {
    name?: string;
};
