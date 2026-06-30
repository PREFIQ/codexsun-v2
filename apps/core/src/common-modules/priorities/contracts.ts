import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type PriorityRecord = CommonRecord & {
    name: string;
    colour: string;
    tag: string;
};

export type PriorityCreateInput = CommonCreateInput & {
    name: string;
    colour: string;
    tag: string;
};

export type PriorityUpdateInput = CommonUpdateInput & {
    name?: string;
    colour?: string;
    tag?: string;
};
