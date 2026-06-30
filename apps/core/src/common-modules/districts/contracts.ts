import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type DistrictRecord = CommonRecord & {
    name: string;
    stateId: number;
};

export type DistrictCreateInput = CommonCreateInput & {
    name: string;
    stateId: number;
};

export type DistrictUpdateInput = CommonUpdateInput & {
    name?: string;
    stateId?: number;
};
