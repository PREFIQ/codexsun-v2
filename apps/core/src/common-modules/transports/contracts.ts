import type { CommonRecord, CommonCreateInput, CommonUpdateInput } from "../base/contracts.js";

export type TransportRecord = CommonRecord & {
    name: string;
    gst?: string;
    vehicleNo?: string;
    address?: string;
    contactNo?: string;
    contactPerson?: string;
};

export type TransportCreateInput = CommonCreateInput & {
    name: string;
    gst?: string;
    vehicleNo?: string;
    address?: string;
    contactNo?: string;
    contactPerson?: string;
};

export type TransportUpdateInput = CommonUpdateInput & {
    name?: string;
    gst?: string;
    vehicleNo?: string;
    address?: string;
    contactNo?: string;
    contactPerson?: string;
};
