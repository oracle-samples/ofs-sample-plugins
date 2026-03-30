import { expect } from "chai";
import { ResourcesService } from "../resources-service";
import { CrewsService } from "../crews-service";
import { BucketRow, CrewProxy } from "../types";

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

  it("builds consecutive-day crew assignments from nested assistants payload", async () => {
    const proxy: CrewProxy = {
      getAllResources: async () => ({ items: [] }),
      getAllResourceAssistants: async (resourceId: string) => {
        if (resourceId !== "t1") {
          return { items: [] };
        }

        return {
          items: [
            {
              date: "2026-03-24",
              assistants: [{ resourceDetails: { resourceId: "a1" } }],
            },
            {
              date: "2026-03-25",
              assistants: [{ resourceDetails: { resourceId: "a1" } }],
            },
            {
              date: "2026-03-26",
              assistants: [{ resourceDetails: { resourceId: "a2" } }],
            },
          ],
        };
      },
    };

    const technicians: BucketRow[] = [
      {
        resourceId: "t1",
        resourceName: "Lead 1",
        resourceType: "tech",
        parentResourceId: "b1",
      },
      {
        resourceId: "t2",
        resourceName: "Lead 2",
        resourceType: "tech",
        parentResourceId: "b1",
      },
    ];
    const resources: BucketRow[] = [
      ...technicians,
      { resourceId: "a1", resourceName: "Assistant 1", resourceType: "tech", parentResourceId: "b1" },
      { resourceId: "a2", resourceName: "Assistant 2", resourceType: "tech", parentResourceId: "b1" },
    ];

    const service = new CrewsService(proxy);
    const assignments = await service.loadCrewAssignments(
      technicians,
      "2026-03-24",
      "2026-03-27",
      resources
    );

    expect(assignments).to.have.length(2);
    expect(assignments[0].crewName).to.equal("Lead 1 Crew");
    expect(assignments[0].startDate).to.equal("2026-03-24");
    expect(assignments[0].endDate).to.equal("2026-03-25");
    expect(assignments[0].durationDays).to.equal(2);
    expect(assignments[0].membersLabel).to.contain("Assistant 1");

    expect(assignments[1].startDate).to.equal("2026-03-26");
    expect(assignments[1].endDate).to.equal("2026-03-26");
    expect(assignments[1].membersLabel).to.contain("Assistant 2");
  });
});
