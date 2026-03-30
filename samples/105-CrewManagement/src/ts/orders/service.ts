import {
    ActivityRecord,
    ActivitySearchProxy,
    DetailField,
    OrderRow,
    PluginConfig,
    SameCustomerOrdersResult,
} from "./types";

export const ORDER_SEARCH_FIELDS = [
    "activityId",
    "status",
    "date",
    "timeSlot",
    "activityType",
    "customerName",
    "customerNumber",
    "streetAddress",
    "city",
    "state",
    "postalCode",
];

function readStringValue(
    activity: ActivityRecord,
    ...fieldNames: string[]
): string {
    for (const fieldName of fieldNames) {
        const value = activity[fieldName];
        if (typeof value === "string" && value.trim().length > 0) {
            return value.trim();
        }
        if (typeof value === "number") {
            return `${value}`;
        }
    }
    return "";
}

function buildAddress(activity: ActivityRecord): string {
    const address = readStringValue(activity, "address", "streetAddress");
    if (address) {
        return [
            address,
            readStringValue(activity, "city"),
            readStringValue(activity, "state"),
            readStringValue(activity, "postalCode"),
        ]
            .filter((part) => part.length > 0)
            .join(", ");
    }

    return [
        readStringValue(activity, "caddress"),
        readStringValue(activity, "ccity"),
        readStringValue(activity, "cstate"),
        readStringValue(activity, "czip"),
    ]
        .filter((part) => part.length > 0)
        .join(", ");
}

function formatDetailLabel(fieldName: string): string {
    return fieldName
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .trim()
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDetailValue(value: unknown): string {
    if (value === null || value === undefined) {
        return "";
    }

    if (typeof value === "string") {
        return value.trim();
    }

    if (typeof value === "number" || typeof value === "boolean") {
        return `${value}`;
    }

    if (Array.isArray(value)) {
        const formattedArrayValues = value
            .map((entry) => formatDetailValue(entry))
            .filter((entry) => entry.length > 0);

        return formattedArrayValues.join(", ");
    }

    try {
        return JSON.stringify(value);
    } catch (error) {
        return `${value}`;
    }
}

export function mapActivityToDetailFields(activity: ActivityRecord): DetailField[] {
    return Object.entries(activity)
        .map(([key, value]) => ({
            key,
            label: formatDetailLabel(key),
            value: formatDetailValue(value),
        }))
        .filter((field) => field.value.length > 0)
        .sort((left, right) => left.label.localeCompare(right.label));
}

export function mapActivityToOrderRow(activity: ActivityRecord): OrderRow {
    return {
        activityId: readStringValue(activity, "activityId", "aid"),
        status: readStringValue(activity, "status", "astatus"),
        date: readStringValue(activity, "date"),
        timeSlot: readStringValue(activity, "timeSlot"),
        workType: readStringValue(activity, "activityType", "atype"),
        customerName: readStringValue(activity, "customerName", "cname"),
        address: buildAddress(activity),
        detailFields: mapActivityToDetailFields(activity),
    };
}

export function extractActivityValue(
    activity: ActivityRecord,
    activityField: string
): string {
    return readStringValue(activity, activityField);
}

export class SameCustomerOrdersService {
    constructor(private readonly proxy: ActivitySearchProxy) {}

    async loadOrders(
        activity: ActivityRecord,
        config: PluginConfig
    ): Promise<SameCustomerOrdersResult> {
        const searchValue = extractActivityValue(activity, config.activityField);

        if (!searchValue) {
            throw new Error(
                `Activity field "${config.activityField}" is empty on the current activity.`
            );
        }

        const response = await this.proxy.searchActivitiesByField(
            config.searchField,
            searchValue,
            ORDER_SEARCH_FIELDS
        );

        if (response.status < 200 || response.status >= 300) {
            throw new Error(
                response.description ||
                    "Unable to load the orders for this customer."
            );
        }

        const orders = Array.isArray(response.data?.items)
            ? response.data.items.map(mapActivityToOrderRow)
            : [];

        return {
            searchValue,
            orders,
        };
    }
}
