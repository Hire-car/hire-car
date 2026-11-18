import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSelect = vi.fn();

const mockFrom = vi.fn((table: string) => {
  if (table === "branches") {
    return {
      select: mockSelect,
    };
  }
  return {};
});

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: mockFrom,
  }),
}));

import {
  evaluateSuburbIndexing,
  checkVerifiedVendorCoverage,
  getSuburbInventoryDescription,
  getSuburbLocalContext,
  getSuburbFaqs,
} from "../suburbs";

describe("Suburb SEO & Inventory Accuracy (Targeted Checks)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Scenario 1: Local suburb inventory available
  it("scenario 1: handles local suburb inventory available correctly", () => {
    const indexing = evaluateSuburbIndexing({
      localInventoryCount: 4,
      hasVerifiedCoverage: false,
      metroInventoryCount: 35,
    });

    expect(indexing.index).toBe(true);
    expect(indexing.follow).toBe(true);

    const desc = getSuburbInventoryDescription({
      hasDirectLocalInventory: true,
      hasVerifiedCoverage: false,
      displayCity: "Sydney",
      displaySuburb: "Parramatta",
      total: 4,
    });

    expect(desc).toBe("Showing verified vehicles directly servicing Parramatta.");
  });

  // Scenario 2: Local inventory unavailable but metro inventory available
  it("scenario 2: handles local inventory unavailable but metro inventory available (noindex & metro fallback description)", () => {
    const indexing = evaluateSuburbIndexing({
      localInventoryCount: 0,
      hasVerifiedCoverage: false,
      metroInventoryCount: 40,
    });

    // CRITICAL SEO RULE: Do not index an empty suburb page merely because other vehicles exist elsewhere in the city
    expect(indexing.index).toBe(false);
    expect(indexing.follow).toBe(true);

    const desc = getSuburbInventoryDescription({
      hasDirectLocalInventory: false,
      hasVerifiedCoverage: false,
      displayCity: "Sydney",
      displaySuburb: "Bondi",
      total: 40,
    });

    // Clearly described as vehicles available across the greater metropolitan area
    expect(desc).toBe("Showing approved vehicles available across the Greater Sydney metropolitan area.");
    // Must NOT falsely claim direct service to Bondi
    expect(desc).not.toContain("directly servicing Bondi");
    expect(desc).not.toContain("with service to Bondi");
  });

  // Scenario 3: No local or metro inventory
  it("scenario 3: handles no local or metro inventory (empty state & noindex)", () => {
    const indexing = evaluateSuburbIndexing({
      localInventoryCount: 0,
      hasVerifiedCoverage: false,
      metroInventoryCount: 0,
    });

    expect(indexing.index).toBe(false);
    expect(indexing.follow).toBe(true);

    const desc = getSuburbInventoryDescription({
      hasDirectLocalInventory: false,
      hasVerifiedCoverage: false,
      displayCity: "Perth",
      displaySuburb: "Armadale",
      total: 0,
    });

    expect(desc).toBe("No vehicles currently listed in this specific area.");
  });

  // Scenario 4: Verified vendor service coverage
  it("scenario 4: handles verified vendor service coverage via database branch confirmation", async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: [
          {
            id: "branch-uuid-1",
            name: "Apex Car Hire Parramatta",
            city: "Sydney",
            address: "123 Church St, Parramatta NSW 2150",
            status: "approved",
            organizations: { id: "org-uuid-1", name: "Apex Car Rentals", status: "approved" },
          },
        ],
        error: null,
      }),
    });

    const coverage = await checkVerifiedVendorCoverage({
      city: "sydney",
      suburbName: "Parramatta",
      postcode: "2150",
    });

    expect(coverage.hasVerifiedCoverage).toBe(true);
    expect(coverage.branchCount).toBe(1);
    expect(coverage.vendorNames).toContain("Apex Car Rentals");

    // When verified coverage is confirmed, page is indexable even before individual vehicles are directly tagged
    const indexing = evaluateSuburbIndexing({
      localInventoryCount: 0,
      hasVerifiedCoverage: true,
      metroInventoryCount: 25,
    });

    expect(indexing.index).toBe(true);
    expect(indexing.follow).toBe(true);

    const desc = getSuburbInventoryDescription({
      hasDirectLocalInventory: false,
      hasVerifiedCoverage: true,
      displayCity: "Sydney",
      displaySuburb: "Parramatta",
      total: 25,
    });

    expect(desc).toBe(
      "Showing approved vehicles available across Greater Sydney with verified operator coverage in Parramatta."
    );

    const faqs = getSuburbFaqs({
      displaySuburb: "Parramatta",
      displayCity: "Sydney",
      state: "NSW",
      hasVerifiedCoverage: true,
    });

    expect(faqs[1].answer).toContain("confirmed branch pickups or local deliveries");
  });

  // Scenario 5: Incorrect service-area claims
  it("scenario 5: strictly prevents incorrect service-area claims when coverage is unverified", async () => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: [
          {
            id: "branch-uuid-2",
            name: "City Central Fleet",
            city: "Sydney CBD",
            address: "50 George St, Sydney NSW 2000",
            status: "approved",
            organizations: { id: "org-uuid-2", name: "Sydney City Cars", status: "approved" },
          },
        ],
        error: null,
      }),
    });

    // Suburb is Bondi, but vendor only has CBD branch
    const coverage = await checkVerifiedVendorCoverage({
      city: "sydney",
      suburbName: "Bondi",
      postcode: "2026",
    });

    expect(coverage.hasVerifiedCoverage).toBe(false);
    expect(coverage.vendorNames.length).toBe(0);

    const desc = getSuburbInventoryDescription({
      hasDirectLocalInventory: false,
      hasVerifiedCoverage: false,
      displayCity: "Sydney",
      displaySuburb: "Bondi",
      total: 15,
    });

    // Must NOT claim that vendors service Bondi
    expect(desc).not.toContain("servicing Bondi");
    expect(desc).not.toContain("coverage in Bondi");
    expect(desc).toBe("Showing approved vehicles available across the Greater Sydney metropolitan area.");

    const context = getSuburbLocalContext({
      displayCity: "Sydney",
      displaySuburb: "Bondi",
      state: "NSW",
      hasVerifiedCoverage: false,
    });

    // Context must NOT claim local operators are based in or servicing the area
    expect(context).not.toContain("operators servicing the Bondi area");
    expect(context).toContain("Browse rental vehicles available across Greater Sydney");

    const faqs = getSuburbFaqs({
      displaySuburb: "Bondi",
      displayCity: "Sydney",
      state: "NSW",
      hasVerifiedCoverage: false,
    });

    // FAQ must NOT promise confirmed local pickup in Bondi
    expect(faqs[1].answer).not.toContain("confirmed branch pickups");
    expect(faqs[1].answer).toContain("depends on individual operator fleet locations");
  });
});
