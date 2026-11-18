import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  findEligibleVendorsForLocation,
  distributeGeneralLocationLead,
} from "../location-matching";

// Mock Supabase admin client
const mockBranches = [
  {
    organization_id: "org-sydney-1",
    city: "Sydney",
    state: "NSW",
    status: "approved",
    organizations: { id: "org-sydney-1", name: "Sydney City Cars", status: "approved" },
  },
  {
    organization_id: "org-sydney-1",
    city: "Sydney Airport Mascot",
    state: "NSW",
    status: "approved",
    organizations: { id: "org-sydney-1", name: "Sydney City Cars", status: "approved" },
  },
  {
    organization_id: "org-sydney-2",
    city: "Sydney CBD",
    state: "NSW",
    status: "approved",
    organizations: { id: "org-sydney-2", name: "Harbour Prestige Rentals", status: "approved" },
  },
  {
    organization_id: "org-melbourne-1",
    city: "Melbourne",
    state: "VIC",
    status: "approved",
    organizations: { id: "org-melbourne-1", name: "Melbourne Drive Co", status: "approved" },
  },
  {
    organization_id: "org-pending-1",
    city: "Sydney",
    state: "NSW",
    status: "approved",
    organizations: { id: "org-pending-1", name: "Unapproved Sydney Vendor", status: "pending" },
  },
  {
    organization_id: "org-pending-branch",
    city: "Sydney",
    state: "NSW",
    status: "pending",
    organizations: { id: "org-pending-branch", name: "Pending Branch Vendor", status: "approved" },
  },
];

const mockAssignmentsStore: Array<{ lead_id: string; organization_id: string; status: string }> = [];
const mockNotificationsStore: Array<{ organization_id: string; title: string; message: string }> = [];

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === "branches") {
        return {
          select: () => ({
            eq: (_col: string, val: string) => {
              // filter approved branches
              const filtered = mockBranches.filter((b) => b.status === val);
              return {
                ilike: (_c: string, pattern: string) => {
                  const term = pattern.replace(/%/g, "").toLowerCase();
                  const matched = filtered.filter((b) => b.city.toLowerCase().includes(term));
                  return Promise.resolve({ data: matched, error: null });
                },
                then: (resolve: (val: { data: typeof filtered; error: null }) => void) =>
                  resolve({ data: filtered, error: null }),
              };
            },
          }),
        };
      }
      if (table === "lead_vendor_assignments") {
        return {
          upsert: (record: { lead_id: string; organization_id: string; status: string }) => {
            const exists = mockAssignmentsStore.some(
              (a) => a.lead_id === record.lead_id && a.organization_id === record.organization_id,
            );
            if (!exists) {
              mockAssignmentsStore.push(record);
            }
            return Promise.resolve({ error: null });
          },
          insert: (record: { lead_id: string; organization_id: string; status: string }) => {
            const exists = mockAssignmentsStore.some(
              (a) => a.lead_id === record.lead_id && a.organization_id === record.organization_id,
            );
            if (!exists) {
              mockAssignmentsStore.push(record);
            }
            return Promise.resolve({ error: null });
          },
        };
      }
      if (table === "notifications") {
        return {
          insert: (notif: { organization_id: string; title: string; message: string }) => {
            mockNotificationsStore.push(notif);
            return Promise.resolve({ error: null });
          },
        };
      }
      return {
        select: () => Promise.resolve({ data: [], error: null }),
      };
    },
  }),
}));

describe("General Location-Based Lead Distribution", () => {
  beforeEach(() => {
    mockAssignmentsStore.length = 0;
    mockNotificationsStore.length = 0;
  });

  it("finds multiple separate eligible approved vendors matching requested city", async () => {
    const vendors = await findEligibleVendorsForLocation("Sydney");

    // Must match both eligible Sydney vendors: org-sydney-1 and org-sydney-2
    expect(vendors.length).toBe(2);
    const orgIds = vendors.map((v) => v.organizationId);
    expect(orgIds).toContain("org-sydney-1");
    expect(orgIds).toContain("org-sydney-2");

    // Must NOT match Melbourne vendor
    expect(orgIds).not.toContain("org-melbourne-1");

    // Must NOT match vendor with unapproved/pending organization
    expect(orgIds).not.toContain("org-pending-1");

    // Must NOT match vendor whose branch status is pending
    expect(orgIds).not.toContain("org-pending-branch");
  });

  it("deduplicates assignments when a vendor has multiple approved branches in the same city", async () => {
    const vendors = await findEligibleVendorsForLocation("Sydney");
    const org1Matches = vendors.filter((v) => v.organizationId === "org-sydney-1");

    // org-sydney-1 has 2 branches in Sydney, but must only appear ONCE in matches
    expect(org1Matches.length).toBe(1);
  });

  it("distributes a general enquiry without a vehicle to all eligible local vendors without duplicates", async () => {
    const leadId = "lead-general-123";
    const result = await distributeGeneralLocationLead({
      leadId,
      pickupCity: "Sydney",
      customerName: "Alex Smith",
      startDate: "2026-12-01",
      endDate: "2026-12-07",
      message: "Need a 7-seater SUV for family holiday in Sydney.",
    });

    expect(result.assignedCount).toBe(2);
    expect(result.matchedVendors.length).toBe(2);

    // Verify lead_vendor_assignments store
    const assignments = mockAssignmentsStore.filter((a) => a.lead_id === leadId);
    expect(assignments.length).toBe(2);

    const assignedOrgs = assignments.map((a) => a.organization_id);
    expect(assignedOrgs).toContain("org-sydney-1");
    expect(assignedOrgs).toContain("org-sydney-2");

    // Verify notifications were dispatched to both eligible vendors
    expect(mockNotificationsStore.some((n) => n.organization_id === "org-sydney-1")).toBe(true);
    expect(mockNotificationsStore.some((n) => n.organization_id === "org-sydney-2")).toBe(true);
    expect(mockNotificationsStore.some((n) => n.organization_id === "org-melbourne-1")).toBe(false);
  });

  it("gracefully handles unmatched locations where zero approved vendors exist", async () => {
    const leadId = "lead-unmatched-999";
    const result = await distributeGeneralLocationLead({
      leadId,
      pickupCity: "Broken Hill",
      customerName: "Jane Doe",
    });

    expect(result.assignedCount).toBe(0);
    expect(result.matchedVendors.length).toBe(0);

    // Zero assignments created
    const assignments = mockAssignmentsStore.filter((a) => a.lead_id === leadId);
    expect(assignments.length).toBe(0);

    // The lead remains in leads table for admin workflow without error
  });
});
