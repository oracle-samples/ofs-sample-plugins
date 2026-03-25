import { BucketRow, CrewProxy, OFSResource } from "./types";

function asString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return `${value}`.trim();
}

function mapResource(resource: OFSResource): BucketRow {
  return {
    resourceId: asString(resource.resourceId),
    resourceName: asString(resource.name) || asString(resource.resourceId),
    resourceType: asString(resource.resourceType),
    parentResourceId: asString(resource.parentResourceId),
  };
}

export class ResourcesService {
  constructor(private readonly proxy: CrewProxy) {}

  private async loadAllResources(): Promise<BucketRow[]> {
    const response = await this.proxy.getAllResources({
      fields: ["resourceId", "name", "resourceType", "parentResourceId"],
    });

    const allResources = Array.isArray(response?.items) ? response.items : [];
    return allResources.map(mapResource);
  }

  async loadBuckets(bucketTypes: string[]): Promise<BucketRow[]> {
    const allResources = await this.loadAllResources();

    const allowedTypes = new Set(bucketTypes.map((type) => type.toLowerCase()));

    const buckets = allResources
      .filter((resource) =>
        allowedTypes.size === 0
          ? true
          : allowedTypes.has(resource.resourceType.toLowerCase())
      )
      .sort((left, right) => left.resourceName.localeCompare(right.resourceName));

    return buckets;
  }

  async loadDescendantTechnicians(
    selectedBucketResourceId: string,
    techniciansTypes: string[]
  ): Promise<BucketRow[]> {
    const allResources = await this.loadAllResources();
    const byParent = new Map<string, BucketRow[]>();

    for (const resource of allResources) {
      const parentId = resource.parentResourceId;
      if (!byParent.has(parentId)) {
        byParent.set(parentId, []);
      }
      byParent.get(parentId)!.push(resource);
    }

    const descendants: BucketRow[] = [];
    const queue: string[] = [selectedBucketResourceId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = byParent.get(current) || [];
      for (const child of children) {
        descendants.push(child);
        if (child.resourceId) {
          queue.push(child.resourceId);
        }
      }
    }

    const allowedTypes = new Set(techniciansTypes.map((type) => type.toLowerCase()));

    return descendants
      .filter((resource) =>
        allowedTypes.size === 0
          ? true
          : allowedTypes.has(resource.resourceType.toLowerCase())
      );
  }
}
