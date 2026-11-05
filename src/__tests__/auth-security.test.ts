import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/headers cookies
const mockCookieStore = {
  getAll: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => mockCookieStore),
  headers: vi.fn(async () => new Headers()),
}));

// Mock next/navigation redirect
const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error(`REDIRECT:${url}`);
  },
}));

// Mock Supabase server client
const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

// Mock Supabase admin client
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    })),
  })),
}));

describe("Authentication Security Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null immediately when no cookies exist (guest fast path without network overhead)", async () => {
    mockCookieStore.getAll.mockReturnValue([]);
    
    // Import fresh
    const { getCurrentUser } = await import("@/lib/security/auth");
    const user = await getCurrentUser();

    expect(user).toBeNull();
    // Supabase client should NOT even be initialized when no cookies exist
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("returns null immediately when only unrelated cookies exist", async () => {
    mockCookieStore.getAll.mockReturnValue([
      { name: "theme", value: "dark" },
      { name: "analytics_consent", value: "true" },
    ]);

    const { getCurrentUser } = await import("@/lib/security/auth");
    const user = await getCurrentUser();

    expect(user).toBeNull();
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("proceeds to genuine server-side verification when standard auth cookie is present", async () => {
    mockCookieStore.getAll.mockReturnValue([
      { name: "sb-nympjldhwuozfjawwwfy-auth-token", value: "valid-jwt-token" },
    ]);
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "user@example.com" } },
      error: null,
    });

    const { getCurrentUser } = await import("@/lib/security/auth");
    const user = await getCurrentUser();

    expect(user).not.toBeNull();
    expect(user?.id).toBe("user-123");
    expect(mockGetUser).toHaveBeenCalledTimes(1);
  });

  it("correctly identifies chunked Supabase auth cookies and invokes server-side verification", async () => {
    mockCookieStore.getAll.mockReturnValue([
      { name: "sb-nympjldhwuozfjawwwfy-auth-token.0", value: "chunk-part-0" },
      { name: "sb-nympjldhwuozfjawwwfy-auth-token.1", value: "chunk-part-1" },
    ]);
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-chunked-456", email: "chunked@example.com" } },
      error: null,
    });

    const { getCurrentUser } = await import("@/lib/security/auth");
    const user = await getCurrentUser();

    expect(user).not.toBeNull();
    expect(user?.id).toBe("user-chunked-456");
    expect(mockGetUser).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid or expired tokens safely", async () => {
    mockCookieStore.getAll.mockReturnValue([
      { name: "sb-test-auth-token", value: "expired-or-tampered-token" },
    ]);
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "JWT expired" },
    });

    const { getCurrentUser } = await import("@/lib/security/auth");
    const user = await getCurrentUser();

    expect(user).toBeNull();
    expect(mockGetUser).toHaveBeenCalledTimes(1);
  });

  it("requireUser redirects to /auth/sign-in when unauthenticated", async () => {
    mockCookieStore.getAll.mockReturnValue([]);

    const { requireUser } = await import("@/lib/security/auth");

    await expect(requireUser()).rejects.toThrow("REDIRECT:/auth/sign-in");
    expect(mockRedirect).toHaveBeenCalledWith("/auth/sign-in");
  });

  it("requireUser passes through the authenticated user object", async () => {
    mockCookieStore.getAll.mockReturnValue([
      { name: "sb-auth-auth-token", value: "valid-token" },
    ]);
    mockGetUser.mockResolvedValue({
      data: { user: { id: "verified-user-789", email: "verified@example.com" } },
      error: null,
    });

    const { requireUser } = await import("@/lib/security/auth");
    const user = await requireUser();

    expect(user.id).toBe("verified-user-789");
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});