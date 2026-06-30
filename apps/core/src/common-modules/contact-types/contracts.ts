import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type ContactTypeRecord = CommonRecord & {
    name: string;
};

export type ContactTypeCreateInput = CommonCreateInput & {
    name: string;
};

export type ContactTypeUpdateInput = CommonUpdateInput & {
    name?: string;
};
