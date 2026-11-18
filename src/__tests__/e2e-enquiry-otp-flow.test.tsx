// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EnquiryWidget } from "@/components/enquiry-widget";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock Turnstile to prevent jsdom MutationObserver document issues
vi.mock("@marsidev/react-turnstile", () => ({
  Turnstile: () => <div data-testid="mock-turnstile" />,
}));

describe("End-to-End Enquiry & OTP UI Workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  const baseProps = {
    vehicleId: "169c031b-fa29-4f6f-b510-632b9b07d9c4",
    vendorId: "8ac011c0-641d-49cd-be14-d1f4fd45da52",
    isLoggedIn: false,
    pricePerDay: 100,
    offerPrice: 85,
    offerLabel: "Save $15/day",
    vehicleTitle: "Toyota RAV4 2024",
    vendorName: "Apex Rentals",
    defaultCity: "Sydney",
  };

  it("renders action buttons (Book, Message, Email) and phone verification step", () => {
    render(<EnquiryWidget {...baseProps} />);

    // Verify Book, Message, Email action buttons exist
    const bookBtn = screen.getAllByRole("button", { name: /^book$/i })[0];
    const messageBtn = screen.getAllByRole("button", { name: /^message$/i })[0];
    const emailBtn = screen.getAllByRole("button", { name: /^email$/i })[0];

    expect(bookBtn).toBeDefined();
    expect(messageBtn).toBeDefined();
    expect(emailBtn).toBeDefined();

    // Verify phone verification step is shown initially for unauthenticated guests
    expect(screen.getByText(/verify your mobile to check availability/i)).toBeDefined();
    expect(screen.getAllByPlaceholderText(/0412 345 678/i)[0]).toBeDefined();
  });

  it("completes full OTP verification and transitions to enquiry form with discounted pricing", async () => {
    vi.mocked(global.fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof Request ? input.url : input.toString();
      if (url === "/api/otp/request") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              challengeId: "test-challenge-uuid",
              phone: "+61412345678",
              resendAfter: 45,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      if (url === "/api/otp/verify") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              verified: true,
              verifiedPhone: "+61412345678",
              verificationToken: "valid.token.signature",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });

    render(<EnquiryWidget {...baseProps} />);

    // 1. Enter Australian mobile number
    const phoneInput = screen.getAllByPlaceholderText(/0412 345 678/i)[0];
    fireEvent.change(phoneInput, { target: { value: "0412345678" } });

    // 2. Click Check Availability / Send Verification Code
    const sendBtn = screen.getAllByRole("button", { name: /send verification code/i })[0];
    fireEvent.click(sendBtn);

    // 3. Wait for OTP step to display
    await waitFor(() => {
      expect(screen.getByText(/enter 6-digit code/i)).toBeDefined();
    });

    // 4. Enter 6-digit code
    const otpInput = screen.getByPlaceholderText(/123456/i);
    fireEvent.change(otpInput, { target: { value: "654321" } });

    // 5. Submit OTP verification
    const verifyBtn = screen.getByRole("button", { name: /verify & unlock/i });
    fireEvent.click(verifyBtn);

    // 6. Verify transition to main enquiry form with phone locked and verified badge
    await waitFor(() => {
      expect(screen.getAllByText(/^verified$/i)[0]).toBeDefined();
    });

    // 7. Verify discounted rate banner is now displayed inside the unlocked enquiry form
    expect(screen.getByText(/save \$15\/day/i)).toBeDefined();
    expect(screen.getByText(/total price/i)).toBeDefined();
  });

  it("handles Message and Email action button triggers correctly", () => {
    render(<EnquiryWidget {...baseProps} vendorEmail="fleet@apexrentals.com.au" />);

    // Click Message button — switches mode to message
    const messageBtn = screen.getAllByRole("button", { name: /^message$/i })[0];
    fireEvent.click(messageBtn);
    expect(screen.getAllByText(/message vendor/i)[0]).toBeDefined();

    // Click Book button — switches mode back to book
    const bookBtn = screen.getAllByRole("button", { name: /^book$/i })[0];
    fireEvent.click(bookBtn);
    expect(screen.getAllByText(/check availability & book/i)[0]).toBeDefined();
  });
});
