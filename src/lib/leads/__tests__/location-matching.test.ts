import { describe, it, expect } from "vitest";
import {
  normalizeCityName,
  getStateForCity,
  AUSTRALIAN_CITY_STATE_MAP,
} from "../location-matching";

describe("Location Matching & Distribution", () => {
  it("normalizes city names consistently", () => {
    expect(normalizeCityName("  Sydney  ")).toBe("sydney");
    expect(normalizeCityName("MELBOURNE")).toBe("melbourne");
    expect(normalizeCityName("Perth CBD")).toBe("perth cbd");
  });

  it("maps Australian cities to standard states correctly", () => {
    expect(getStateForCity("Sydney")).toBe("NSW");
    expect(getStateForCity("Parramatta")).toBe("NSW");
    expect(getStateForCity("Melbourne")).toBe("VIC");
    expect(getStateForCity("Southbank")).toBe("VIC");
    expect(getStateForCity("Perth")).toBe("WA");
    expect(getStateForCity("Fremantle")).toBe("WA");
    expect(getStateForCity("Brisbane")).toBe("QLD");
    expect(getStateForCity("Adelaide")).toBe("SA");
  });

  it("returns null for unknown locations gracefully", () => {
    expect(getStateForCity("Atlantis")).toBeNull();
    expect(getStateForCity("")).toBeNull();
  });

  it("has complete mapping for all client target suburbs", () => {
    const targets = [
      // Sydney
      "parramatta", "bondi", "blacktown", "chatswood", "north sydney", "manly", "penrith", "surry hills", "mascot",
      // Melbourne
      "melbourne cbd", "southbank", "richmond", "st kilda", "carlton", "footscray", "dandenong", "box hill",
      // Perth
      "perth cbd", "fremantle", "joondalup", "scarborough", "subiaco", "cannington", "midland"
    ];

    for (const target of targets) {
      expect(AUSTRALIAN_CITY_STATE_MAP[target]).toBeDefined();
    }
  });
});
