import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type TaxRecord = CommonRecord & {
    ratePercent: number;
    description: string;
};

export type TaxCreateInput = CommonCreateInput & {
    ratePercent: number;
    description: string;
};

export type TaxUpdateInput = CommonUpdateInput & {
    ratePercent?: number;
    description?: string;
};
