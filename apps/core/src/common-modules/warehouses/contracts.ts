import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type WarehouseRecord = CommonRecord & {
    name: string;
};

export type WarehouseCreateInput = CommonCreateInput & {
    name: string;
};

export type WarehouseUpdateInput = CommonUpdateInput & {
    name?: string;
};
