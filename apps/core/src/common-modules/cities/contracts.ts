import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type CityRecord = CommonRecord & {
    name: string;
    districtId: number;
};

export type CityCreateInput = CommonCreateInput & {
    name: string;
    districtId: number;
};

export type CityUpdateInput = CommonUpdateInput & {
    name?: string;
    districtId?: number;
};
