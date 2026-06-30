import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type AccountingYearRecord = CommonRecord & {
    name: string;
    startDate: string;
    endDate: string;
    booksStart: string;
    isCurrentYear: boolean;
};

export type AccountingYearCreateInput = CommonCreateInput & {
    name: string;
    startDate: string;
    endDate: string;
    booksStart: string;
    isCurrentYear: boolean;
};

export type AccountingYearUpdateInput = CommonUpdateInput & {
    name?: string;
    startDate?: string;
    endDate?: string;
    booksStart?: string;
    isCurrentYear?: boolean;
};
