import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type ColourRecord = CommonRecord & {
    name: string;
};

export type ColourCreateInput = CommonCreateInput & {
    name: string;
};

export type ColourUpdateInput = CommonUpdateInput & {
    name?: string;
};
