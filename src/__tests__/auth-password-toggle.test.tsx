// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import { AuthPanel } from "@/components/auth/AuthPanel";

// Mock Supabase client
vi.mock("@lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
  }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOtp: vi.fn(),
      verifyOtp: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
  }),
}));

// Mock useAuthRedirect
vi.mock("@/components/auth/useAuthRedirect", () => ({
  useAuthRedirect: () => ({
    redirectToDestination: vi.fn(),
    redirectByRole: vi.fn(),
  }),
}));

describe("Password Visibility Toggle (Show / Hide Password)", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("Customer Login", () => {
    it("initially hides password and toggles visibility on eye icon click without modifying value or submitting", () => {
      render(
        <EmailAuthForm
          role="customer"
          nextRoute="/customer/dashboard"
        />
      );

      const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
      expect(passwordInput).toBeDefined();

      // 1. Password input type is initially "password"
      expect(passwordInput.type).toBe("password");

      // 2. Enter a password
      fireEvent.change(passwordInput, { target: { value: "SecretCustomerPassword123!" } });
      expect(passwordInput.value).toBe("SecretCustomerPassword123!");

      // 3. Find the Show password toggle button
      const toggleButton = screen.getByRole("button", { name: /show password/i });
      expect(toggleButton).toBeDefined();
      expect(toggleButton.getAttribute("type")).toBe("button");

      // 4. Click Show password toggle
      fireEvent.click(toggleButton);

      // 5. Password input type changes to "text"
      expect(passwordInput.type).toBe("text");
      // Value remains unchanged
      expect(passwordInput.value).toBe("SecretCustomerPassword123!");

      // 6. Toggle button label updates to "Hide password"
      const hideButton = screen.getByRole("button", { name: /hide password/i });
      expect(hideButton).toBeDefined();

      // 7. Click Hide password toggle
      fireEvent.click(hideButton);

      // 8. Password input type changes back to "password"
      expect(passwordInput.type).toBe("password");
      // Value still preserved
      expect(passwordInput.value).toBe("SecretCustomerPassword123!");
    });
  });

  describe("Vendor Login", () => {
    it("initially hides password and toggles visibility on eye icon click without modifying value or submitting", () => {
      render(
        <EmailAuthForm
          role="vendor"
          nextRoute="/vendor/dashboard"
        />
      );

      const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
      expect(passwordInput).toBeDefined();

      // 1. Password input type is initially "password"
      expect(passwordInput.type).toBe("password");

      // 2. Enter a password
      fireEvent.change(passwordInput, { target: { value: "FleetVendorKey2026$" } });
      expect(passwordInput.value).toBe("FleetVendorKey2026$");

      // 3. Find the Show password toggle button
      const toggleButton = screen.getByRole("button", { name: /show password/i });
      expect(toggleButton).toBeDefined();
      expect(toggleButton.getAttribute("type")).toBe("button");

      // 4. Click Show password toggle
      fireEvent.click(toggleButton);

      // 5. Password input type changes to "text"
      expect(passwordInput.type).toBe("text");
      // Value remains unchanged
      expect(passwordInput.value).toBe("FleetVendorKey2026$");

      // 6. Toggle button label updates to "Hide password"
      const hideButton = screen.getByRole("button", { name: /hide password/i });
      expect(hideButton).toBeDefined();

      // 7. Click Hide password toggle
      fireEvent.click(hideButton);

      // 8. Password input type changes back to "password"
      expect(passwordInput.type).toBe("password");
      // Value still preserved
      expect(passwordInput.value).toBe("FleetVendorKey2026$");
    });
  });

  describe("AuthPanel Integration (Customer & Vendor Role Selection)", () => {
    it("allows toggling password visibility when customer role is selected", () => {
      render(<AuthPanel />);

      // Select "I am a Customer"
      const customerCard = screen.getByText(/i am a customer/i);
      fireEvent.click(customerCard);

      // Select "Email" tab
      const emailTab = screen.getByRole("tab", { name: /email/i });
      fireEvent.click(emailTab);

      // Find password input
      const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
      expect(passwordInput.type).toBe("password");

      fireEvent.change(passwordInput, { target: { value: "CustPass!1" } });

      // Toggle show
      const toggleBtn = screen.getByRole("button", { name: /show password/i });
      fireEvent.click(toggleBtn);
      expect(passwordInput.type).toBe("text");
      expect(passwordInput.value).toBe("CustPass!1");

      // Toggle hide
      const hideBtn = screen.getByRole("button", { name: /hide password/i });
      fireEvent.click(hideBtn);
      expect(passwordInput.type).toBe("password");
      expect(passwordInput.value).toBe("CustPass!1");
    });

    it("allows toggling password visibility when vendor role is selected", () => {
      render(<AuthPanel />);

      // Select "I am a Vendor"
      const vendorCard = screen.getByText(/i am a vendor/i);
      fireEvent.click(vendorCard);

      // Select "Email" tab
      const emailTab = screen.getByRole("tab", { name: /email/i });
      fireEvent.click(emailTab);

      // Find password input
      const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
      expect(passwordInput.type).toBe("password");

      fireEvent.change(passwordInput, { target: { value: "VendorPass!2" } });

      // Toggle show
      const toggleBtn = screen.getByRole("button", { name: /show password/i });
      fireEvent.click(toggleBtn);
      expect(passwordInput.type).toBe("text");
      expect(passwordInput.value).toBe("VendorPass!2");

      // Toggle hide
      const hideBtn = screen.getByRole("button", { name: /hide password/i });
      fireEvent.click(hideBtn);
      expect(passwordInput.type).toBe("password");
      expect(passwordInput.value).toBe("VendorPass!2");
    });
  });
});
