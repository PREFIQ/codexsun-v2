import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type UnitRecord = CommonRecord & {
    name: string;
};

export type UnitCreateInput = CommonCreateInput & {
    name: string;
};

export type UnitUpdateInput = CommonUpdateInput & {
    name?: string;
};
