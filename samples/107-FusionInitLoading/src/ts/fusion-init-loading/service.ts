import {
  CachedDataset,
  FusionPageResponse,
  RuntimeConfig,
  TableColumn,
  TableRow,
} from "./types";
import { buildCacheKey } from "./config";

const FUSION_API_PREFIX = "/fscmRestApi/resources/11.13.18.05";

function normalizeFusionUrl(baseUrl: string, fusionPath: string): string {
  const trimmedBase = baseUrl.replace(/\/+$/, "");
  const trimmedPath = fusionPath.trim();

  if (/^https?:\/\//i.test(trimmedPath)) {
    return trimmedPath;
  }

  if (trimmedPath.startsWith("/fscmRestApi/")) {
    return `${trimmedBase}${trimmedPath}`;
  }

  if (trimmedPath.startsWith("/")) {
    return `${trimmedBase}${FUSION_API_PREFIX}${trimmedPath}`;
  }

  return `${trimmedBase}${FUSION_API_PREFIX}/${trimmedPath}`;
}

function toDisplayString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) =>
        typeof entry === "object" ? JSON.stringify(entry) : toDisplayString(entry)
      )
      .join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function flattenRecord(
  input: unknown,
  prefix = "",
  output: Record<string, string> = {}
): Record<string, string> {
  if (input === null || input === undefined) {
    if (prefix) {
      output[prefix] = "";
    }
    return output;
  }

  if (Array.isArray(input)) {
    output[prefix] = toDisplayString(input);
    return output;
  }

  if (typeof input !== "object") {
    output[prefix] = toDisplayString(input);
    return output;
  }

  const entries = Object.entries(input as Record<string, unknown>);
  if (entries.length === 0) {
    if (prefix) {
      output[prefix] = "";
    }
    return output;
  }

  for (const [key, value] of entries) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    if (
      value !== null &&
      value !== undefined &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      flattenRecord(value, nextPrefix, output);
    } else {
      output[nextPrefix] = toDisplayString(value);
    }
  }

  return output;
}

function humanizeHeader(key: string): string {
  return key
    .split(".")
    .map((segment) =>
      segment
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" / ");
}

function resolveItems(response: unknown, itemsPath?: string): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (!response || typeof response !== "object") {
    return [];
  }

  const responseRecord = response as Record<string, unknown>;

  if (itemsPath) {
    const selected = itemsPath
      .split(".")
      .reduce<unknown>((current, key) => {
        if (!current || typeof current !== "object") {
          return undefined;
        }
        return (current as Record<string, unknown>)[key];
      }, responseRecord);

    return Array.isArray(selected) ? selected : [];
  }

  if (Array.isArray(responseRecord.items)) {
    return responseRecord.items;
  }

  return [responseRecord];
}

function shouldContinuePaging(response: FusionPageResponse, itemCount: number): boolean {
  return Boolean(response.hasMore) && itemCount > 0;
}

export class FusionInitLoadingService {
  readonly endpoint: string;

  constructor(
    baseUrl: string,
    private readonly token: string,
    private readonly config: RuntimeConfig,
    private readonly logger?: (...args: unknown[]) => void
  ) {
    this.endpoint = normalizeFusionUrl(baseUrl, config.fusionPath);
  }

  private log(...args: unknown[]): void {
    if (this.logger) {
      this.logger(...args);
    }
  }

  async fetchDataset(): Promise<CachedDataset> {
    const rawItems = await this.fetchAllItems();
    const rows = rawItems.map((item, index) => this.toTableRow(item, index));
    const columnOrder = Array.from(
      rows.reduce((keys, row) => {
        Object.keys(row)
          .filter((key) => key !== "rowId")
          .forEach((key) => keys.add(key));
        return keys;
      }, new Set<string>())
    );
    const columnsByKey = columnOrder.reduce((columns, key, index) => {
      columns[key] = {
        field: key,
        headerText: humanizeHeader(key),
        weight: Math.min(6, Math.max(1, Math.ceil((key.length + 4) / 8))),
      } as TableColumn;
      return columns;
    }, {} as Record<string, TableColumn>);

    return {
      cacheKey: buildCacheKey(this.config),
      fetchedAt: new Date().toISOString(),
      endpoint: this.endpoint,
      rowCount: rows.length,
      rows,
      columnOrder,
      columnsByKey,
    };
  }

  private toTableRow(item: unknown, index: number): TableRow {
    const flattened =
      item && typeof item === "object"
        ? flattenRecord(item)
        : { value: toDisplayString(item) };

    return {
      rowId:
        flattened.id ||
        flattened.Id ||
        flattened.ID ||
        flattened.Code ||
        flattened.code ||
        `${index + 1}`,
      ...flattened,
    };
  }

  private async fetchAllItems(): Promise<unknown[]> {
    const collected: unknown[] = [];
    let offset = 0;
    let pageNumber = 0;

    for (;;) {
      pageNumber += 1;
      const response = await this.fetchPage(offset);
      const items = resolveItems(response, this.config.itemsPath);
      this.log("[FusionInitLoadingService] fetched page", {
        pageNumber,
        offset,
        hasMore: response.hasMore,
        count: response.count,
        limit: response.limit,
        items: items.length,
      });

      collected.push(...items);

      if (!shouldContinuePaging(response, items.length)) {
        break;
      }

      offset =
        typeof response.offset === "number"
          ? response.offset + (typeof response.limit === "number" ? response.limit : items.length)
          : offset + items.length;
    }

    return collected;
  }

  private async fetchPage(offset: number): Promise<FusionPageResponse> {
    const url = new URL(this.endpoint);

    Object.entries(this.config.queryParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    if (!url.searchParams.has("limit")) {
      url.searchParams.set("limit", String(this.config.pageLimit));
    }
    if (!url.searchParams.has("offset")) {
      url.searchParams.set("offset", String(offset));
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        `Fusion API request failed (${response.status}): ${detail || response.statusText}`
      );
    }

    return (await response.json()) as FusionPageResponse;
  }
}
