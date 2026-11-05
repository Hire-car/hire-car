import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock dependencies
const mockInsert = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockGte = vi.fn();

const mockFrom = vi.fn((table: string) => {
  return {
    select: mockSelect,
    insert: mockInsert,
  };
});

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: mockFrom,
  }),
}));

const mockGetCurrentUser = vi.fn();
vi.mock("@/lib/security/auth", () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}));

vi.mock("@/lib/security/rate-limit-redis", () => ({
  rateLimitSlidingWindow: async () => ({ allowed: true, retryAfter: 0 }),
}));

vi.mock("@/lib/email/ses", () => ({
  sendLeadAlert: vi.fn().mockResolvedValue({}),
  sendCustomerEnquiryConfirmation: vi.fn().mockResolvedValue({}),
}));

import { POST } from "@/app/api/leads/route";

describe("POST /api/leads - Guest and Authenticated Booking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue(null); // default to guest (unauthenticated)

    // Default Supabase fluent query behavior
    mockSelect.mockImplementation(() => ({
      eq: mockEq,
      insert: mockInsert,
    }));

    mockEq.mockImplementation(() => ({
      eq: mockEq,
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
      gte: mockGte,
    }));

    mockGte.mockImplementation(() => ({
      maybeSingle: mockMaybeSingle,
    }));

    mockSingle.mockImplementation(() => {
      // Return approved vehicle and approved organization by default
      return Promise.resolve({
        data: {
          id: "169c031b-fa29-4f6f-b510-632b9b07d9c4",
          title: "Kia Picanto 2026",
          organization_id: "8ac011c0-641d-49cd-be14-d1f4fd45da52",
          status: "approved",
          branch_id: "branch-uuid",
          billing_email: "vendor@example.com",
        },
        error: null,
      });
    });

    mockMaybeSingle.mockImplementation(() => {
      return Promise.resolve({ data: null, error: null }); // no duplicate
    });

    mockInsert.mockImplementation(() => ({
      select: () => ({
        single: () =>
          Promise.resolve({
            data: { id: "new-lead-uuid-1234" },
            error: null,
          }),
      }),
    }));
  });

  const validPayload = {
    vehicleId: "169c031b-fa29-4f6f-b510-632b9b07d9c4",
    vendorId: "8ac011c0-641d-49cd-be14-d1f4fd45da52",
    name: "Alex Smith",
    email: "alex@example.com",
    phone: "0412345678",
    pickupCity: "Melbourne",
    startDate: "2026-11-20",
    endDate: "2026-11-25",
    message: "Request to book for holiday",
    consent: true,
  };

  it("successfully creates a guest booking when user is unauthenticated (customer_user_id is null)", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const req = new NextRequest("https://www.hirecarmarketplace.com.au/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.leadId).toBe("new-lead-uuid-1234");

    // Verify insert called with customer_user_id: null
    const leadInsertCall = mockInsert.mock.calls.find(
      (call) => call[0] && call[0].vehicle_id === validPayload.vehicleId
    );
    expect(leadInsertCall).toBeDefined();
    expect(leadInsertCall![0].customer_user_id).toBeNull();
    expect(leadInsertCall![0].customer_name).toBe("Alex Smith");
    expect(leadInsertCall![0].status).toBe("new");
  });

  it("successfully links authenticated customer ID when user is logged in", async () => {
    mockGetCurrentUser.mockResolvedValue({ id: "user-uuid-9999", email: "alex@example.com" });

    const req = new NextRequest("https://www.hirecarmarketplace.com.au/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const leadInsertCall = mockInsert.mock.calls.find(
      (call) => call[0] && call[0].vehicle_id === validPayload.vehicleId
    );
    expect(leadInsertCall).toBeDefined();
    expect(leadInsertCall![0].customer_user_id).toBe("user-uuid-9999");
  });

  it("blocks bot submission when honeypot field is filled", async () => {
    const req = new NextRequest("https://www.hirecarmarketplace.com.au/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validPayload,
        honeypot: "spam_link_bot",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Unable to process submission");
  });

  it("returns 400 when required fields are missing", async () => {
    const req = new NextRequest("https://www.hirecarmarketplace.com.au/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validPayload,
        name: "",
        email: "not-an-email",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

