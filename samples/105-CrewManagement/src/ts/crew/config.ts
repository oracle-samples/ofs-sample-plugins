import { CrewOpenConfig } from "./types";

export const DEFAULT_BUCKET_TYPES: string[] = [];
export const DEFAULT_TECHNICIAN_TYPES: string[] = [];

export const BUCKET_TABLE_COLUMNS = [
  { field: "resourceName", headerText: "Bucket" },
  { field: "resourceType", headerText: "Type" },
  { field: "resourceId", headerText: "Resource ID" },
] as const;

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") {
    return {};
  }
  return value as Record<string, unknown>;
}

function normalizeList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => `${entry}`.trim())
      .filter((entry) => entry.length > 0);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  return [];
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value === 1;
  }
  if (typeof value !== "string") {
    return false;
  }
  return ["true", "1", "yes", "on"].includes(value.trim().toLowerCase());
}

export function parseCrewOpenConfig(
  openParams: unknown,
  securedData: unknown
): CrewOpenConfig {
  const open = toRecord(openParams);
  const secured = toRecord(securedData);

  const bucketTypes = normalizeList(secured.bucketTypes);
  const techniciansTypes = normalizeList(secured.techniciansTypes);

  return {
    bucketTypes: bucketTypes.length > 0 ? bucketTypes : DEFAULT_BUCKET_TYPES,
    techniciansTypes:
      techniciansTypes.length > 0
        ? techniciansTypes
        : DEFAULT_TECHNICIAN_TYPES,
    enableLogging: parseBoolean(open.enableLogging),
  };
}
