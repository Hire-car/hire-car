import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  formatAustralianDateTime,
  formatAustralianDate,
  formatAustralianTime,
} from "@/lib/date-utils";

// Mock dependencies for admin actions test
const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
const mockDelete = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

const mockFrom = vi.fn((table: string) => ({
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
  select: mockSelect,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: mockFrom,
  }),
}));

const mockRequireAdminRole = vi.fn().mockResolvedValue({ id: "admin-user-uuid-1", role: "super_admin" });
vi.mock("@/lib/security/auth", () => ({
  requireAdminRole: () => mockRequireAdminRole(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { moderateReview } from "@/app/admin/actions";

describe("Hire Car Marketplace Client Requirements Enhancements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockImplementation(() => ({
      eq: mockEq,
    }));
    mockEq.mockImplementation(() => ({
      single: mockSingle,
    }));
    mockSingle.mockResolvedValue({
      data: {
        id: "a0000000-0000-4000-8000-000000000001",
        organization_id: "org-1",
        vehicle_id: "veh-1",
        customer_name: "John Doe",
        rating: 5,
        status: "approved",
      },
      error: null,
    });
  });

  describe("Requirement 4: Australian Date & Time Formatting", () => {
    it("formats dates in Australia/Sydney timezone with 12-hour AM/PM", () => {
      // 2026-11-24T02:45:00.000Z in Sydney AEDT (UTC+11) is 1:45 PM on 24/11/2026
      const sampleUtc = "2026-11-24T02:45:00.000Z";
      const formatted = formatAustralianDateTime(sampleUtc);
      expect(formatted).toMatch(/24\/11\/2026/);
      expect(formatted).toMatch(/1:45\s*pm/i);
    });

    it("formats Australian date only (DD/MM/YYYY)", () => {
      const sampleUtc = "2026-11-24T02:45:00.000Z";
      expect(formatAustralianDate(sampleUtc)).toBe("24/11/2026");
    });

    it("formats Australian time only", () => {
      const sampleUtc = "2026-11-24T02:45:00.000Z";
      expect(formatAustralianTime(sampleUtc)).toMatch(/1:45\s*pm/i);
    });

    it("handles null and undefined with 'Not available' fallback", () => {
      expect(formatAustralianDateTime(null)).toBe("Not available");
      expect(formatAustralianDateTime(undefined)).toBe("Not available");
      expect(formatAustralianDate(null)).toBe("Not available");
      expect(formatAustralianTime(null)).toBe("Not available");
    });
  });

  describe("Requirement 8: Review Moderation Actions (Reject & Delete)", () => {
    const reviewId = "a0000000-0000-4000-8000-000000000001";

    it("approves a pending review and logs moderation note and audit log", async () => {
      await moderateReview("approve", reviewId, "Review approved by admin");

      expect(mockFrom).toHaveBeenCalledWith("reviews");
      expect(mockUpdate).toHaveBeenCalledWith({ status: "approved" });
      expect(mockFrom).toHaveBeenCalledWith("moderation_notes");
      expect(mockFrom).toHaveBeenCalledWith("audit_logs");
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "moderation_approve",
          resource_type: "review",
          resource_id: reviewId,
        })
      );
    });

    it("rejects an approved review and updates status to rejected", async () => {
      await moderateReview("reject", reviewId, "Inappropriate content");

      expect(mockFrom).toHaveBeenCalledWith("reviews");
      expect(mockUpdate).toHaveBeenCalledWith({ status: "rejected" });
      expect(mockFrom).toHaveBeenCalledWith("moderation_notes");
      expect(mockFrom).toHaveBeenCalledWith("audit_logs");
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "moderation_reject",
          resource_type: "review",
          resource_id: reviewId,
        })
      );
    });

    it("deletes a review permanently and creates audit log", async () => {
      await moderateReview("delete", reviewId, "Spam review removed");

      expect(mockFrom).toHaveBeenCalledWith("reviews");
      expect(mockDelete).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith("audit_logs");
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "moderation_delete",
          resource_type: "review",
          resource_id: reviewId,
        })
      );
    });

    it("rejects invalid review moderation actions", async () => {
      await expect(
        moderateReview("invalid_action", reviewId, "Reason")
      ).rejects.toThrow();
    });
  });

  describe("Requirements 2 & 3: Fallback handling for missing contact info", () => {
    it("handles missing email and phone with 'Not provided'", () => {
      const renderEmail = (email: string | null | undefined) =>
        email?.trim() ? email : "Not provided";
      const renderPhone = (phone: string | null | undefined) =>
        phone?.trim() ? phone : "Not provided";

      expect(renderEmail(null)).toBe("Not provided");
      expect(renderEmail("")).toBe("Not provided");
      expect(renderEmail("   ")).toBe("Not provided");
      expect(renderEmail("customer@example.com")).toBe("customer@example.com");

      expect(renderPhone(null)).toBe("Not provided");
      expect(renderPhone("")).toBe("Not provided");
      expect(renderPhone("0412345678")).toBe("0412345678");
    });
  });
});
