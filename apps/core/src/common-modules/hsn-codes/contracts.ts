import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type HsnCodeRecord = CommonRecord & {
    code: string;
    description: string;
};

export type HsnCodeCreateInput = CommonCreateInput & {
    code: string;
    description: string;
};

export type HsnCodeUpdateInput = CommonUpdateInput & {
    code?: string;
    description?: string;
};
