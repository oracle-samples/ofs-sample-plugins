import { OFS, OFSResponse } from "@ofs-users/proxy";
import {
  AssetFetchDiagnosticEntry,
  AssetFetchDiagnostics,
  AssetPageResponse,
  CachedDataset,
  RuntimeConfig,
  TableColumn,
  TableRow,
} from "./types";

const FUSION_API_PREFIX = "/fscmRestApi/resources/11.13.18.05";
const RESPONSE_PREVIEW_LIMIT = 6000;

function normalizeFusionUrl(baseUrl: string, assetsPath: string): string {
  const trimmedBase = baseUrl.replace(/\/+$/, "");
  const trimmedPath = assetsPath.trim();

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

function normalizeOfsBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
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

function resolveItems(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (!response || typeof response !== "object") {
    return [];
  }

  const responseRecord = response as Record<string, unknown>;
  if (Array.isArray(responseRecord.items)) {
    return responseRecord.items;
  }

  return [responseRecord];
}

function shouldContinuePaging(response: AssetPageResponse, itemCount: number): boolean {
  return Boolean(response.hasMore) && itemCount > 0;
}

function serializePreview(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function truncatePreview(value: string): string {
  return value.length > RESPONSE_PREVIEW_LIMIT
    ? `${value.slice(0, RESPONSE_PREVIEW_LIMIT)}\n...[truncated ${value.length - RESPONSE_PREVIEW_LIMIT} chars]`
    : value;
}

function extractRequiredString(
  source: Record<string, unknown>,
  fieldName: string,
  errorMessage: string
): string {
  const value = source[fieldName];
  if (value === undefined || value === null) {
    throw new Error(errorMessage);
  }

  const normalized = String(value).trim();
  if (!normalized) {
    throw new Error(errorMessage);
  }

  return normalized;
}

export class AssetInitLoadingService {
  readonly endpoint: string;
  private diagnostics: AssetFetchDiagnosticEntry[] = [];

  constructor(
    private readonly faUrl: string,
    private readonly fsUrl: string,
    private readonly token: string,
    private readonly cacheKey: string,
    private readonly userLogin: string,
    private readonly config: RuntimeConfig,
    private readonly logger?: (...args: unknown[]) => void
  ) {
    this.endpoint = normalizeFusionUrl(faUrl, config.assetsPath);
  }

  private log(...args: unknown[]): void {
    if (this.logger) {
      this.logger(...args);
    }
  }

  async fetchDataset(): Promise<CachedDataset> {
    const proxy = new OFS({
      baseURL: normalizeOfsBaseUrl(this.fsUrl),
      token: this.token,
    });
    const userDetails = await this.fetchUserDetails(proxy);
    const mainResourceId = extractRequiredString(
      userDetails,
      "mainResourceId",
      "User details did not include mainResourceId."
    );
    const resourceDetails = await this.fetchResourceDetails(proxy, mainResourceId);
    const operatingOrganizationCode = extractRequiredString(
      resourceDetails,
      "mwo_resource_orgid",
      "Resource details did not include mwo_resource_orgid."
    );
    const rawItems = await this.fetchAllAssets(operatingOrganizationCode);
    const rows = rawItems.map((item, index) => this.toTableRow(item, index));
    const columnOrder = Array.from(
      rows.reduce((keys, row) => {
        Object.keys(row)
          .filter((key) => key !== "rowId")
          .forEach((key) => keys.add(key));
        return keys;
      }, new Set<string>())
    );
    const columnsByKey = columnOrder.reduce((columns, key) => {
      columns[key] = {
        field: key,
        headerText: humanizeHeader(key),
        weight: Math.min(6, Math.max(1, Math.ceil((key.length + 4) / 8))),
      } as TableColumn;
      return columns;
    }, {} as Record<string, TableColumn>);

    return {
      cacheKey: this.cacheKey,
      fetchedAt: new Date().toISOString(),
      endpoint: this.endpoint,
      rowCount: rows.length,
      rows,
      columnOrder,
      columnsByKey,
      diagnostics: {
        userLogin: this.userLogin,
        mainResourceId,
        operatingOrganizationCode,
        assetsPath: this.config.assetsPath,
        requests: [...this.diagnostics],
      } as AssetFetchDiagnostics,
    };
  }

  private recordProxyDiagnostic(
    step: "getUserDetails" | "getResource",
    response: OFSResponse
  ): void {
    this.diagnostics.push({
      step,
      requestUrl: response.url.toString(),
      status: response.status,
      statusText: response.description || (response.status < 400 ? "OK" : "Request failed"),
      responseBodyPreview: truncatePreview(serializePreview(response.data)),
    });
  }

  private async fetchUserDetails(proxy: OFS): Promise<Record<string, unknown>> {
    const response = await proxy.getUserDetails(this.userLogin);
    this.recordProxyDiagnostic("getUserDetails", response);
    this.log("[AssetInitLoadingService] fetched user details", {
      userLogin: this.userLogin,
      status: response.status,
      url: response.url.toString(),
    });

    if (response.status >= 400 || !response.data || typeof response.data !== "object") {
      throw new Error(
        `getUserDetails failed (${response.status}): ${response.description || "Unknown error"}`
      );
    }

    return response.data as unknown as Record<string, unknown>;
  }

  private async fetchResourceDetails(
    proxy: OFS,
    resourceId: string
  ): Promise<Record<string, unknown>> {
    const response = await proxy.getResource(resourceId);
    this.recordProxyDiagnostic("getResource", response);
    this.log("[AssetInitLoadingService] fetched resource details", {
      resourceId,
      status: response.status,
      url: response.url.toString(),
    });

    if (response.status >= 400 || !response.data || typeof response.data !== "object") {
      throw new Error(
        `getResource failed (${response.status}): ${response.description || "Unknown error"}`
      );
    }

    return response.data as unknown as Record<string, unknown>;
  }

  private toTableRow(item: unknown, index: number): TableRow {
    const flattened =
      item && typeof item === "object"
        ? flattenRecord(item)
        : { value: toDisplayString(item) };

    return {
      rowId:
        flattened.AssetId ||
        flattened.assetId ||
        flattened.AssetNumber ||
        flattened.assetNumber ||
        flattened.Id ||
        flattened.id ||
        `${index + 1}`,
      ...flattened,
    };
  }

  private async fetchAllAssets(operatingOrganizationCode: string): Promise<unknown[]> {
    const collected: unknown[] = [];
    let offset = 0;
    let pageNumber = 0;

    for (;;) {
      pageNumber += 1;
      const response = await this.fetchAssetsPage(
        offset,
        pageNumber,
        operatingOrganizationCode
      );
      const items = resolveItems(response);
      this.log("[AssetInitLoadingService] fetched assets page", {
        pageNumber,
        offset,
        operatingOrganizationCode,
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

  private async fetchAssetsPage(
    offset: number,
    pageNumber: number,
    operatingOrganizationCode: string
  ): Promise<AssetPageResponse> {
    const url = new URL(this.endpoint);
    url.searchParams.set(
      "OperatingOrganizationCode",
      operatingOrganizationCode
    );

    if (!url.searchParams.has("limit")) {
      url.searchParams.set("limit", String(this.config.pageLimit));
    }
    if (!url.searchParams.has("offset")) {
      url.searchParams.set("offset", String(offset));
    }

    const requestUrl = url.toString();
    this.log("[AssetInitLoadingService] request URL", requestUrl);

    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.token}`,
      },
    });

    const responseText = await response.text();
    this.log("[AssetInitLoadingService] response status", {
      requestUrl,
      status: response.status,
      statusText: response.statusText,
    });
    this.log("[AssetInitLoadingService] response body", responseText);
    this.diagnostics.push({
      step: "getAssets",
      pageNumber,
      requestUrl,
      status: response.status,
      statusText: response.statusText,
      responseBodyPreview: truncatePreview(responseText),
    });

    if (!response.ok) {
      throw new Error(
        `Installed base assets request failed (${response.status}): ${responseText || response.statusText}`
      );
    }

    return JSON.parse(responseText) as AssetPageResponse;
  }
}
