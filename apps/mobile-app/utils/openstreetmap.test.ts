import { getOsmUrl } from "@/utils/openstreetmap";

describe("getOsmUrl", () => {
  it("returns the node URL for OSM-N-{id}", () => {
    expect(getOsmUrl("OSM-N-12345")).toBe(
      "https://www.openstreetmap.org/node/12345",
    );
  });

  it("returns the way URL for OSM-W-{id}", () => {
    expect(getOsmUrl("OSM-W-45421")).toBe(
      "https://www.openstreetmap.org/way/45421",
    );
  });

  it("returns the relation URL for OSM-R-{id}", () => {
    expect(getOsmUrl("OSM-R-7")).toBe(
      "https://www.openstreetmap.org/relation/7",
    );
  });

  it("returns null for an unknown entity type", () => {
    expect(getOsmUrl("OSM-X-1")).toBeNull();
  });

  it("returns null when the OSM- prefix is missing", () => {
    expect(getOsmUrl("N-12345")).toBeNull();
  });

  it("returns null when the id format is too short", () => {
    expect(getOsmUrl("OSM-W")).toBeNull();
  });
});
