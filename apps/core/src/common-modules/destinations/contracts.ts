import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type DestinationRecord = CommonRecord & {
    name: string;
};

export type DestinationCreateInput = CommonCreateInput & {
    name: string;
};

export type DestinationUpdateInput = CommonUpdateInput & {
    name?: string;
};
