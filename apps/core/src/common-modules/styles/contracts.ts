import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type StyleRecord = CommonRecord & {
    name: string;
};

export type StyleCreateInput = CommonCreateInput & {
    name: string;
};

export type StyleUpdateInput = CommonUpdateInput & {
    name?: string;
};
