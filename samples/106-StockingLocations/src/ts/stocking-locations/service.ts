import {
  StockingLocationRow,
  TechnicianSubinventoriesResponse,
  TechnicianSubinventoryItem,
} from "./types";

const API_PATH = "/fscmRestApi/resources/11.13.18.05/technicianSubinventories";
const PAGE_LIMIT = 500;

function asString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

function mapItem(item: TechnicianSubinventoryItem): StockingLocationRow {
  const partyId = asString(item.PartyId);
  const partyName = asString(item.PartyName);
  const organizationCode = asString(item.OrganizationCode);
  const subinventory = asString(item.Subinventory);
  const stockLocationName = asString(item.StockLocationName);
  const techSubinventoryId =
    asString(item.TechSubinventoryId) ||
    `${partyId || "no-party"}:${organizationCode || "no-org"}:${subinventory || stockLocationName || "no-subinventory"}`;

  return {
    techSubinventoryId,
    partyId,
    partyName,
    organizationCode,
    organizationName: asString(item.OrganizationName),
    subinventory,
    stockLocationName,
    defaultFlag: asString(item.DefaultFlag),
    enabledFlag: asString(item.EnabledFlag),
    allowPartsOrdersFlag: asString(item.AllowPartsOrdersFlag),
    technicianLabel: partyName || partyId || "Unassigned",
  };
}

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, "");

  if (trimmed.endsWith("/technicianSubinventories")) {
    return trimmed;
  }
  if (trimmed.endsWith("/fscmRestApi/resources/11.13.18.05")) {
    return `${trimmed}/technicianSubinventories`;
  }
  if (trimmed.includes("/fscmRestApi/resources/11.13.18.05/technicianSubinventories")) {
    return trimmed;
  }

  return `${trimmed}${API_PATH}`;
}

export class StockingLocationsService {
  readonly endpoint: string;

  constructor(
    baseUrl: string,
    private readonly token: string,
    private readonly logger?: (...args: unknown[]) => void
  ) {
    this.endpoint = normalizeBaseUrl(baseUrl);
  }

  private log(...args: unknown[]): void {
    if (this.logger) {
      this.logger(...args);
    }
  }

  async fetchAllLocations(): Promise<StockingLocationRow[]> {
    const collected = new Map<string, StockingLocationRow>();
    let offset = 0;
    let pageNumber = 0;

    for (;;) {
      pageNumber += 1;
      const page = await this.fetchPage(offset);
      const items = Array.isArray(page.items) ? page.items : [];
      this.log("[StockingLocationsService] fetched page", {
        pageNumber,
        offset,
        count: page.count,
        limit: page.limit,
        hasMore: page.hasMore,
        items: items.length,
      });

      for (const item of items) {
        const mapped = mapItem(item);
        const key = mapped.techSubinventoryId || `${mapped.partyId}:${mapped.subinventory}:${mapped.organizationCode}`;
        collected.set(key, mapped);
      }

      if (!page.hasMore || items.length === 0) {
        break;
      }

      offset = typeof page.offset === "number"
        ? page.offset + (typeof page.limit === "number" ? page.limit : items.length)
        : offset + items.length;
    }

    return Array.from(collected.values()).sort((left, right) => {
      const nameCompare = left.stockLocationName.localeCompare(right.stockLocationName);
      if (nameCompare !== 0) {
        return nameCompare;
      }
      const orgCompare = left.organizationCode.localeCompare(right.organizationCode);
      if (orgCompare !== 0) {
        return orgCompare;
      }
      return left.subinventory.localeCompare(right.subinventory);
    });
  }

  private async fetchPage(offset: number): Promise<TechnicianSubinventoriesResponse> {
    const url = new URL(this.endpoint);
    url.searchParams.set("limit", String(PAGE_LIMIT));
    url.searchParams.set("offset", String(offset));

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Fusion API request failed (${response.status}): ${detail || response.statusText}`);
    }

    return (await response.json()) as TechnicianSubinventoriesResponse;
  }
}
