import { expect } from "chai";
import { parseCrewOpenConfig } from "../config";

describe("parseCrewOpenConfig", () => {
  it("parses secure params lists and logging flag", () => {
    const config = parseCrewOpenConfig(
      { enableLogging: "true" },
      {
        bucketTypes: "bucket, region",
        techniciansTypes: ["tech", "helper"],
      }
    );

    expect(config).to.deep.equal({
      bucketTypes: ["bucket", "region"],
      techniciansTypes: ["tech", "helper"],
      enableLogging: true,
    });
  });
});
