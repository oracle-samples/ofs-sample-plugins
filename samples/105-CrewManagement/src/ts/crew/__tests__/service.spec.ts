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

  it("maps assistants to calendar rows", async () => {
    const proxy: CrewProxy = {
      getAllResources: async () => ({ items: [] }),
      getAllResourceAssistants: async () => ({
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
    ]);

    expect(rows).to.have.length(1);
    expect(rows[0].assistantsCount).to.equal(2);
    expect(rows[0].assistantsLabel).to.contain("Assistant 1");
  });
});
