import { DetailField, DetailFieldLayoutMetadata } from "./types";

export const DEFAULT_DETAIL_FIELD_LAYOUT_METADATA: DetailFieldLayoutMetadata = {
    shortDetailFields: [],
    longDetailFields: [],
};

function normalizeFieldList(rawValue: unknown): string[] {
    if (!Array.isArray(rawValue)) {
        return [];
    }

    const normalizedFields = rawValue
        .map((field) => (typeof field === "string" ? field.trim() : ""))
        .filter((field) => field.length > 0);

    return [...new Set(normalizedFields)];
}

export function parseDetailFieldLayoutMetadata(
    descriptor: unknown
): DetailFieldLayoutMetadata {
    const metadata =
        descriptor &&
        typeof descriptor === "object" &&
        "metadata" in (descriptor as Record<string, unknown>)
            ? (descriptor as { metadata?: unknown }).metadata
            : undefined;

    if (!metadata || typeof metadata !== "object") {
        return DEFAULT_DETAIL_FIELD_LAYOUT_METADATA;
    }

    return {
        shortDetailFields: normalizeFieldList(
            (metadata as Record<string, unknown>).shortDetailFields
        ),
        longDetailFields: normalizeFieldList(
            (metadata as Record<string, unknown>).longDetailFields
        ),
    };
}

export async function loadDetailFieldLayoutMetadata(
    fetchImpl: typeof fetch = fetch
): Promise<DetailFieldLayoutMetadata> {
    const descriptorLocations = [
        "./plugin_descriptor.json",
        "../plugin_descriptor.json",
    ];

    for (const descriptorLocation of descriptorLocations) {
        try {
            const response = await fetchImpl(descriptorLocation);
            if (!response.ok) {
                continue;
            }

            const descriptor = await response.json();
            return parseDetailFieldLayoutMetadata(descriptor);
        } catch (error) {
            continue;
        }
    }

    return DEFAULT_DETAIL_FIELD_LAYOUT_METADATA;
}

function buildFieldOrderMap(fields: string[]): Map<string, number> {
    return new Map(fields.map((field, index) => [field, index]));
}

function sortDetailFields(
    fields: DetailField[],
    preferredOrder: string[]
): DetailField[] {
    const preferredOrderMap = buildFieldOrderMap(preferredOrder);

    return [...fields].sort((left, right) => {
        const leftOrder = preferredOrderMap.get(left.key);
        const rightOrder = preferredOrderMap.get(right.key);

        if (leftOrder !== undefined && rightOrder !== undefined) {
            return leftOrder - rightOrder;
        }

        if (leftOrder !== undefined) {
            return -1;
        }

        if (rightOrder !== undefined) {
            return 1;
        }

        return left.label.localeCompare(right.label);
    });
}

export function splitDetailFieldsByLayout(
    fields: DetailField[],
    metadata: DetailFieldLayoutMetadata
): {
    shortFields: DetailField[];
    longFields: DetailField[];
} {
    const shortFieldNames = new Set(metadata.shortDetailFields);
    const shortFields = fields.filter((field) => shortFieldNames.has(field.key));
    const longFields = fields.filter((field) => !shortFieldNames.has(field.key));

    return {
        shortFields: sortDetailFields(shortFields, metadata.shortDetailFields),
        longFields: sortDetailFields(longFields, metadata.longDetailFields),
    };
}
