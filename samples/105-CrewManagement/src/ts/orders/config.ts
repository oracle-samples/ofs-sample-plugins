import {
    OrderColumnId,
    PluginConfig,
    TableColumn,
} from "./types";

export const DEFAULT_SEARCH_FIELD = "customer_number";

export const DEFAULT_COLUMNS: OrderColumnId[] = [
    "activityId",
    "status",
    "date",
    "timeSlot",
    "workType",
    "address",
];

const ORDER_COLUMN_LABELS: Record<OrderColumnId, string> = {
    activityId: "Activity ID",
    status: "Status",
    date: "Date",
    timeSlot: "Time Slot",
    workType: "Work Type",
    customerName: "Customer Name",
    address: "Address",
};

const ORDER_COLUMN_PRIORITY: Record<OrderColumnId, number> = {
    status: 1,
    date: 2,
    timeSlot: 3,
    workType: 4,
    activityId: 5,
    customerName: 6,
    address: 7,
};

function isOrderColumnId(value: string): value is OrderColumnId {
    return value in ORDER_COLUMN_LABELS;
}

function parseBooleanFlag(rawValue: string | undefined): boolean {
    if (!rawValue) {
        return false;
    }

    return ["true", "1", "yes", "on"].includes(rawValue.trim().toLowerCase());
}

function normalizeOpenParams(
    openParams: unknown
): Record<string, string | undefined> {
    if (!openParams) {
        return {};
    }

    if (typeof openParams === "string") {
        const trimmed = openParams.trim();
        if (!trimmed) {
            return {};
        }

        if (trimmed.startsWith("{")) {
            try {
                return normalizeOpenParams(JSON.parse(trimmed));
            } catch (error) {
                return {};
            }
        }

        const searchParams = new URLSearchParams(trimmed);
        const normalizedParams: Record<string, string> = {};
        searchParams.forEach((value, key) => {
            normalizedParams[key] = value;
        });
        return normalizedParams;
    }

    if (typeof openParams === "object") {
        return Object.entries(openParams as Record<string, unknown>).reduce(
            (accumulator, [key, value]) => {
                accumulator[key] =
                    typeof value === "string" ? value : value?.toString();
                return accumulator;
            },
            {} as Record<string, string | undefined>
        );
    }

    return {};
}

function parseColumns(rawColumns: string | undefined): OrderColumnId[] {
    if (!rawColumns) {
        return DEFAULT_COLUMNS;
    }

    const columns = rawColumns
        .split(",")
        .map((column) => column.trim())
        .filter((column): column is string => column.length > 0)
        .filter(isOrderColumnId);

    return columns.length > 0 ? columns : DEFAULT_COLUMNS;
}

export function parsePluginConfig(openParams: unknown): PluginConfig {
    const normalizedOpenParams = normalizeOpenParams(openParams);
    const activityField =
        normalizedOpenParams.activityField?.trim() || DEFAULT_SEARCH_FIELD;
    const searchField =
        normalizedOpenParams.searchField?.trim() || activityField;

    return {
        activityField,
        searchField,
        enableLogging: parseBooleanFlag(normalizedOpenParams.enableLogging),
        columns: parseColumns(normalizedOpenParams.tableColumns),
    };
}

export function buildTableColumns(columnIds: OrderColumnId[]): TableColumn[] {
    return columnIds.map((columnId) => ({
        field: columnId,
        headerText: ORDER_COLUMN_LABELS[columnId],
        sortable: "disabled",
    }));
}

export function buildVisibleColumnOrder(
    columnIds: OrderColumnId[],
    maxColumns?: number
): OrderColumnId[] {
    if (!maxColumns || columnIds.length <= maxColumns) {
        return [...columnIds];
    }

    const prioritizedColumns = [...columnIds]
        .sort(
            (left, right) =>
                ORDER_COLUMN_PRIORITY[left] - ORDER_COLUMN_PRIORITY[right]
        )
        .slice(0, maxColumns);
    const visibleColumns = new Set(prioritizedColumns);

    return columnIds.filter((columnId) => visibleColumns.has(columnId));
}
