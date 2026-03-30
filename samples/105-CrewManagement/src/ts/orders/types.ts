export type ActivityRecord = Record<string, unknown>;

export type OrderColumnId =
    | "activityId"
    | "status"
    | "date"
    | "timeSlot"
    | "workType"
    | "customerName"
    | "address";

export interface PluginConfig {
    activityField: string;
    searchField: string;
    enableLogging: boolean;
    columns: OrderColumnId[];
}

export interface DetailField {
    key: string;
    label: string;
    value: string;
}

export interface DetailFieldLayoutMetadata {
    shortDetailFields: string[];
    longDetailFields: string[];
}

export interface OrderRow {
    activityId: string;
    status: string;
    date: string;
    timeSlot: string;
    workType: string;
    customerName: string;
    address: string;
    detailFields: DetailField[];
}

export interface TableColumn {
    field: OrderColumnId;
    headerText: string;
    sortable: "disabled";
}

export interface ActivitySearchResponseData {
    items?: ActivityRecord[];
    totalResults?: number;
}

export interface ActivitySearchResponse {
    status: number;
    description?: string;
    data?: ActivitySearchResponseData;
}

export interface ActivitySearchProxy {
    searchActivitiesByField(
        fieldName: string,
        fieldValue: string,
        fields: string[]
    ): Promise<ActivitySearchResponse>;
}

export interface SameCustomerOrdersResult {
    searchValue: string;
    orders: OrderRow[];
}
