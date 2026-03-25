import { expect } from "chai";
import { ResourcesService } from "../resources-service";
import { CrewsService } from "../crews-service";
import { CrewProxy } from "../types";

describe("Crew services", () => {
  it("filters buckets by configured bucket types", async () => {
    const proxy: CrewProxy = {
      getAllResources: async () => ({
        items: [
          { resourceId: "1", name: "Bucket A", resourceType: "bucket", parentResourceId: "" },
          { resourceId: "2", name: "Tech A", resourceType: "tech", parentResourceId: "1" },
        ],
      }),
      getAllResourceAssistants: async () => ({ items: [] }),
    };

    const service = new ResourcesService(proxy);
    const buckets = await service.loadBuckets(["bucket"]);

    expect(buckets).to.have.length(1);
    expect(buckets[0].resourceId).to.equal("1");
  });

  it("supports direct vs all descendant technician lookup", async () => {
    const proxy: CrewProxy = {
      getAllResources: async () => ({
        items: [
          { resourceId: "1", name: "Bucket A", resourceType: "bucket", parentResourceId: "" },
          { resourceId: "2", name: "Region A", resourceType: "region", parentResourceId: "1" },
          { resourceId: "3", name: "Tech Direct", resourceType: "tech", parentResourceId: "1" },
          { resourceId: "4", name: "Tech Nested", resourceType: "tech", parentResourceId: "2" },
        ],
      }),
      getAllResourceAssistants: async () => ({ items: [] }),
    };

    const service = new ResourcesService(proxy);
    const allResources = await service.fetchAllResources();
    const direct = service.findDescendantTechnicians(allResources, "1", ["tech"], "direct");
    const all = service.findDescendantTechnicians(allResources, "1", ["tech"], "all");

    expect(direct.map((r) => r.resourceId)).to.deep.equal(["3"]);
    expect(all.map((r) => r.resourceId)).to.have.members(["3", "4"]);
  });

  it("maps assistants to calendar rows", async () => {
    const proxy: CrewProxy = {
      getAllResources: async () => ({ items: [] }),
      getAllResourceAssistants: async (_resourceId: string, params: { dateFrom: string; dateTo: string; fields?: string[] }) => ({
        items: [
          { resourceId: "a1", name: "Assistant 1" },
          { resourceId: "a2", name: "Assistant 2" },
        ],
      }),
    };

    const service = new CrewsService(proxy);
    const rows = await service.loadCrewCalendarRows([
      {
        resourceId: "t1",
        resourceName: "Technician 1",
        resourceType: "tech",
        parentResourceId: "1",
      },
    ], "2026-03-01", "2026-03-31");

    expect(rows).to.have.length(1);
    expect(rows[0].assistantsCount).to.equal(2);
    expect(rows[0].assistantsLabel).to.contain("Assistant 1");
  });

  it("normalizes nested assistants payload and filters out technicians without assistants", async () => {
    const proxy: CrewProxy = {
      getAllResources: async () => ({ items: [] }),
      getAllResourceAssistants: async (resourceId: string) => {
        if (resourceId === "t1") {
          return {
            items: [
              {
                date: "2026-03-24",
                assistants: [
                  {
                    resourceDetails: { resourceId: "FSL_01" },
                    teamWorkActivities: [{ activityId: 4250616 }],
                  },
                ],
              },
            ],
          };
        }
        return { items: [] };
      },
    };

    const service = new CrewsService(proxy);
    const rows = await service.loadCrewCalendarRows(
      [
        {
          resourceId: "t1",
          resourceName: "Michael Riddick",
          resourceType: "tech",
          parentResourceId: "1",
        },
        {
          resourceId: "t2",
          resourceName: "No Assistant Tech",
          resourceType: "tech",
          parentResourceId: "1",
        },
      ],
      "2026-03-01",
      "2026-03-31"
    );

    expect(rows).to.have.length(1);
    expect(rows[0].technicianResourceId).to.equal("t1");
    expect(rows[0].assistantsCount).to.equal(1);
    expect(rows[0].assistantsLabel).to.equal("FSL_01");
  });
});
