import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type AddressTypeRecord = CommonRecord & {
    name: string;
};

export type AddressTypeCreateInput = CommonCreateInput & {
    name: string;
};

export type AddressTypeUpdateInput = CommonUpdateInput & {
    name?: string;
};
