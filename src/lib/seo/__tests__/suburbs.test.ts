import { describe, it, expect } from "vitest";
import {
  getSuburbMeta,
  getAllCuratedSuburbs,
  getSuburbsForCity,
  isKnownSuburb,
} from "../suburbs";

describe("Programmatic SEO Suburbs Registry", () => {
  it("provides complete metadata for Sydney suburbs", () => {
    const parramatta = getSuburbMeta("sydney", "parramatta");
    expect(parramatta).not.toBeNull();
    expect(parramatta?.name).toBe("Parramatta");
    expect(parramatta?.state).toBe("NSW");
    expect(parramatta?.title).toContain("Parramatta");
    expect(parramatta?.metaDescription).toContain("Parramatta");
    expect(parramatta?.landmarks.length).toBeGreaterThan(0);

    const bondi = getSuburbMeta("sydney", "bondi");
    expect(bondi).not.toBeNull();
    expect(bondi?.name).toBe("Bondi");
  });

  it("provides complete metadata for Melbourne suburbs", () => {
    const southbank = getSuburbMeta("melbourne", "southbank");
    expect(southbank).not.toBeNull();
    expect(southbank?.name).toBe("Southbank");
    expect(southbank?.state).toBe("VIC");

    const stKilda = getSuburbMeta("melbourne", "st-kilda");
    expect(stKilda).not.toBeNull();
  });

  it("provides complete metadata for Perth suburbs", () => {
    const fremantle = getSuburbMeta("perth", "fremantle");
    expect(fremantle).not.toBeNull();
    expect(fremantle?.name).toBe("Fremantle");
    expect(fremantle?.state).toBe("WA");

    const joondalup = getSuburbMeta("perth", "joondalup");
    expect(joondalup).not.toBeNull();
  });

  it("returns curated suburbs for a city", () => {
    const sydneySuburbs = getSuburbsForCity("sydney");
    expect(sydneySuburbs.length).toBe(9);
    expect(sydneySuburbs.some((s) => s.slug === "parramatta")).toBe(true);

    const melbSuburbs = getSuburbsForCity("melbourne");
    expect(melbSuburbs.length).toBe(8);

    const perthSuburbs = getSuburbsForCity("perth");
    expect(perthSuburbs.length).toBe(7);
  });

  it("returns all curated suburbs across all metro areas", () => {
    const all = getAllCuratedSuburbs();
    expect(all.length).toBe(24); // 9 Sydney + 8 Melbourne + 7 Perth
  });

  it("correctly identifies known and unknown suburbs", () => {
    expect(isKnownSuburb("sydney", "parramatta")).toBe(true);
    expect(isKnownSuburb("melbourne", "richmond")).toBe(true);
    expect(isKnownSuburb("perth", "scarborough")).toBe(true);
    expect(isKnownSuburb("sydney", "non-existent-suburb")).toBe(false);
  });
});
