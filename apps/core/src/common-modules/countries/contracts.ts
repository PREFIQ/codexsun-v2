import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type CountryRecord = CommonRecord & {
    name: string;
    code: string;
    phoneCode?: string;
};

export type CountryCreateInput = CommonCreateInput & {
    name: string;
    code: string;
    phoneCode?: string;
};

export type CountryUpdateInput = CommonUpdateInput & {
    name?: string;
    code?: string;
    phoneCode?: string;
};
