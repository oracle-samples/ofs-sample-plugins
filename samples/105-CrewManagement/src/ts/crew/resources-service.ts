import { BucketRow, CrewProxy, DescendantsScope, OFSResource } from "./types";

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
  constructor(
    private readonly proxy: CrewProxy,
    private readonly logger?: (...args: unknown[]) => void
  ) {}

  private log(...args: unknown[]): void {
    if (this.logger) {
      this.logger(...args);
    }
  }

  async fetchAllResources(): Promise<BucketRow[]> {
    this.log("[ResourcesService] fetchAllResources: requesting all resources from OFS");
    const response = await this.proxy.getAllResources({
      fields: ["resourceId", "name", "resourceType", "parentResourceId"],
    });

    const allResources = Array.isArray(response?.items) ? response.items : [];
    const mapped = allResources.map(mapResource);
    this.log("[ResourcesService] fetchAllResources: received resources", {
      total: mapped.length,
    });
    return mapped;
  }

  filterBuckets(allResources: BucketRow[], bucketTypes: string[]): BucketRow[] {
    const allowedTypes = new Set(bucketTypes.map((type) => type.toLowerCase()));

    return allResources
      .filter((resource) =>
        allowedTypes.size === 0
          ? true
          : allowedTypes.has(resource.resourceType.toLowerCase())
      )
      .sort((left, right) => left.resourceName.localeCompare(right.resourceName));
  }

  findDescendantTechnicians(
    allResources: BucketRow[],
    selectedBucketResourceId: string,
    techniciansTypes: string[],
    scope: DescendantsScope = "all"
  ): BucketRow[] {
    this.log("[ResourcesService] findDescendantTechnicians: start", {
      selectedBucketResourceId,
      scope,
      totalResourcesInCache: allResources.length,
      techniciansTypes,
    });
    const byParent = new Map<string, BucketRow[]>();

    for (const resource of allResources) {
      const parentId = resource.parentResourceId;
      if (!byParent.has(parentId)) {
        byParent.set(parentId, []);
      }
      byParent.get(parentId)!.push(resource);
    }

    const descendants: BucketRow[] = [];
    if (scope === "direct") {
      descendants.push(...(byParent.get(selectedBucketResourceId) || []));
      this.log("[ResourcesService] findDescendantTechnicians: direct descendants found", {
        selectedBucketResourceId,
        directChildrenCount: descendants.length,
        directChildrenIds: descendants.map((d) => d.resourceId),
      });
    } else {
      const queue: string[] = [selectedBucketResourceId];
      while (queue.length > 0) {
        const current = queue.shift()!;
        const children = byParent.get(current) || [];
        this.log("[ResourcesService] findDescendantTechnicians: BFS iteration", {
          currentParent: current,
          queueLengthBeforeEnqueue: queue.length,
          childrenCount: children.length,
          childIds: children.map((c) => c.resourceId),
        });
        for (const child of children) {
          descendants.push(child);
          if (child.resourceId) {
            queue.push(child.resourceId);
          }
        }
      }
    }

    const allowedTypes = new Set(techniciansTypes.map((type) => type.toLowerCase()));

    const technicians = descendants
      .filter((resource) =>
        allowedTypes.size === 0
          ? true
          : allowedTypes.has(resource.resourceType.toLowerCase())
      );
    this.log("[ResourcesService] findDescendantTechnicians: finished", {
      totalDescendants: descendants.length,
      totalTechniciansAfterTypeFilter: technicians.length,
      technicianIds: technicians.map((t) => t.resourceId),
    });
    return technicians;
  }

  async loadBuckets(bucketTypes: string[]): Promise<BucketRow[]> {
    const allResources = await this.fetchAllResources();
    return this.filterBuckets(allResources, bucketTypes);
  }

  async loadDescendantTechnicians(
    selectedBucketResourceId: string,
    techniciansTypes: string[],
    scope: DescendantsScope = "all"
  ): Promise<BucketRow[]> {
    const allResources = await this.fetchAllResources();
    return this.findDescendantTechnicians(
      allResources,
      selectedBucketResourceId,
      techniciansTypes,
      scope
    );
  }
}
