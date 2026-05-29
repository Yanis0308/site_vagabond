import { describe, expect, it } from "vitest";

import { normalizeSearchText } from "./text.js";

describe("normalizeSearchText", () => {
  it("removes accents and lowercases", () => {
    expect(normalizeSearchText("Saint-Étienne")).toBe("saintetienne");
  });

  it("strips non-alphanumeric characters", () => {
    expect(normalizeSearchText("Musée de l'Hôtel-Dieu")).toBe(
      "museedelhoteldieu",
    );
  });

  it("returns an empty string when input has no alphanumerics", () => {
    expect(normalizeSearchText("---!!!")).toBe("");
  });
});
