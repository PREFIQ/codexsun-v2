import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type ContactGroupRecord = CommonRecord & {
    name: string;
};

export type ContactGroupCreateInput = CommonCreateInput & {
    name: string;
};

export type ContactGroupUpdateInput = CommonUpdateInput & {
    name?: string;
};
