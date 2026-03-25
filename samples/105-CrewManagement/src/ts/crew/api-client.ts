import { CrewProxy, OFSAssistant, OFSResource } from "./types";

type ListPayload<T> = {
  items?: T[];
  totalResults?: number;
};

function joinFields(fields?: string[]): string | undefined {
  if (!fields || fields.length === 0) {
    return undefined;
  }
  return fields.join(",");
}

function toQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      search.set(key, `${value}`);
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export class CrewApiClient implements CrewProxy {
  constructor(
    private readonly baseURL: string,
    private readonly authorization: string
  ) {}

  async getAllResources(params?: {
    fields?: string[];
  }): Promise<ListPayload<OFSResource>> {
    return this.getAllPages<OFSResource>("/rest/ofscCore/v1/resources", {
      fields: joinFields(params?.fields),
    });
  }

  async getAllResourceAssistants(
    resourceId: string,
    params?: { fields?: string[] }
  ): Promise<ListPayload<OFSAssistant>> {
    return this.getAllPages<OFSAssistant>(
      `/rest/ofscCore/v1/resources/${encodeURIComponent(resourceId)}/assistants`,
      {
        fields: joinFields(params?.fields),
      }
    );
  }

  private async getAllPages<T>(
    path: string,
    baseParams: Record<string, string | undefined>
  ): Promise<ListPayload<T>> {
    const allItems: T[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const page = await this.getPage<T>(path, {
        ...baseParams,
        offset,
        limit,
      });

      const items = Array.isArray(page.items) ? page.items : [];
      allItems.push(...items);

      if (items.length < limit) {
        break;
      }

      offset += limit;
    }

    return {
      totalResults: allItems.length,
      items: allItems,
    };
  }

  private async getPage<T>(
    path: string,
    params: Record<string, string | number | undefined>
  ): Promise<ListPayload<T>> {
    const normalizedBase = this.baseURL.endsWith("/")
      ? this.baseURL.slice(0, -1)
      : this.baseURL;
    const url = `${normalizedBase}${path}${toQuery(params)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: this.authorization,
      },
    });

    if (!response.ok) {
      throw new Error(`OFS request failed (${response.status}) for ${path}`);
    }

    const data = (await response.json()) as ListPayload<T>;
    return data;
  }
}
