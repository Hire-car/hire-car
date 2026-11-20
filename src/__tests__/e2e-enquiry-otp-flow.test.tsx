// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
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

describe("End-to-End Customer Enquiry Workflow (Direct Access without OTP)", () => {
  beforeEach(() => {
    cleanup();
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

  it("renders action buttons (Book, Message, Email) and opens enquiry form directly without OTP", () => {
    render(<EnquiryWidget {...baseProps} />);

    // Verify Book, Message, Email action buttons exist
    const bookBtn = screen.getAllByRole("button", { name: /^book$/i })[0];
    const messageBtn = screen.getAllByRole("button", { name: /^message$/i })[0];
    const emailBtn = screen.getAllByRole("button", { name: /^email$/i })[0];

    expect(bookBtn).toBeDefined();
    expect(messageBtn).toBeDefined();
    expect(emailBtn).toBeDefined();

    // Verify enquiry form opens directly — NO OTP challenge gating
    expect(screen.getByText(/check availability & book/i)).toBeDefined();
    expect(screen.queryByText(/enter 6-digit code/i)).toBeNull();
    expect(screen.queryByText(/send verification code/i)).toBeNull();

    // Verify all required customer fields are present directly
    expect(screen.getByPlaceholderText(/e\.g\. Sarah Jenkins/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/name@example\.com/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/0412 345 678/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/e\.g\. Melbourne/i)).toBeDefined();
    expect(screen.getByText(/start date/i)).toBeDefined();
    expect(screen.getByText(/end date/i)).toBeDefined();

    // Verify promotional and discounted pricing is visible immediately
    expect(screen.getByText(/save \$15\/day/i)).toBeDefined();
    expect(screen.getByText(/\$85/)).toBeDefined();
  });

  it("validates invalid Australian phone number on submission", async () => {
    render(<EnquiryWidget {...baseProps} />);

    const nameInput = screen.getByPlaceholderText(/e\.g\. Sarah Jenkins/i);
    const emailInput = screen.getByPlaceholderText(/name@example\.com/i);
    const phoneInput = screen.getByPlaceholderText(/0412 345 678/i);
    const cityInput = screen.getByPlaceholderText(/e\.g\. Melbourne/i);
    const licenseCheckbox = screen.getByRole("checkbox");

    // Fill form with invalid phone format (e.g. 12345)
    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.change(phoneInput, { target: { value: "12345" } });
    fireEvent.change(cityInput, { target: { value: "Sydney" } });
    fireEvent.click(licenseCheckbox);

    // Set dates
    const dateInputs = screen.getAllByDisplayValue("");
    const startDateInput = dateInputs[0];
    const endDateInput = dateInputs[1];
    fireEvent.change(startDateInput, { target: { value: "2026-12-01" } });
    fireEvent.change(endDateInput, { target: { value: "2026-12-05" } });

    // Submit form
    const submitBtn = screen.getByRole("button", { name: /request to book/i });
    fireEvent.click(submitBtn);

    // Verify error message for invalid Australian phone
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid australian mobile number/i)).toBeDefined();
    });
  });

  it("successfully submits enquiry with valid Australian mobile without requiring OTP", async () => {
    vi.mocked(global.fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof Request ? input.url : input.toString();
      if (url === "/api/leads") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              leadId: "lead-uuid-1234",
              id: "lead-uuid-1234",
            }),
            { status: 201, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });

    render(<EnquiryWidget {...baseProps} />);

    // Fill all fields
    const nameInput = screen.getByPlaceholderText(/e\.g\. Sarah Jenkins/i);
    const emailInput = screen.getByPlaceholderText(/name@example\.com/i);
    const phoneInput = screen.getByPlaceholderText(/0412 345 678/i);
    const cityInput = screen.getByPlaceholderText(/e\.g\. Melbourne/i);
    const licenseCheckbox = screen.getByRole("checkbox");

    fireEvent.change(nameInput, { target: { value: "Jane Smith" } });
    fireEvent.change(emailInput, { target: { value: "jane.smith@example.com" } });
    fireEvent.change(phoneInput, { target: { value: "0412 345 678" } });
    fireEvent.change(cityInput, { target: { value: "Sydney" } });
    fireEvent.click(licenseCheckbox);

    // Set dates
    const dateInputs = screen.getAllByDisplayValue("");
    const startDateInput = dateInputs[0];
    const endDateInput = dateInputs[1];
    fireEvent.change(startDateInput, { target: { value: "2026-12-10" } });
    fireEvent.change(endDateInput, { target: { value: "2026-12-15" } });

    // Submit form
    const submitBtn = screen.getByRole("button", { name: /request to book/i });
    fireEvent.click(submitBtn);

    // Verify API called with normalized phone and lead details
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/leads",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("0412 345 678"),
        })
      );
    });

    // Verify success confirmation view displayed
    await waitFor(() => {
      expect(screen.getByText(/booking request submitted!/i)).toBeDefined();
    });
  });

  it("handles Message and Email action button triggers correctly without exposing vendor email", () => {
    render(<EnquiryWidget {...baseProps} />);

    // Click Message button — switches mode to message
    const messageBtn = screen.getAllByRole("button", { name: /^message$/i })[0];
    fireEvent.click(messageBtn);
    expect(screen.getAllByText(/message vendor/i)[0]).toBeDefined();

    // Click Email button — switches mode to email enquiry without mailto or vendor email leak
    const emailBtn = screen.getAllByRole("button", { name: /^email$/i })[0];
    fireEvent.click(emailBtn);
    expect(screen.getAllByText(/email vendor/i)[0]).toBeDefined();
    expect(screen.getByRole("button", { name: /send email enquiry/i })).toBeDefined();

    // Confirm no vendor email address or mailto scheme is rendered in the DOM
    expect(screen.queryByText(/@/)).toBeNull();
    const mailtoLinks = document.querySelectorAll('a[href^="mailto:"]');
    expect(mailtoLinks.length).toBe(0);

    // Click Book button — switches mode back to book
    const bookBtn = screen.getAllByRole("button", { name: /^book$/i })[0];
    fireEvent.click(bookBtn);
    expect(screen.getAllByText(/check availability & book/i)[0]).toBeDefined();
  });

  it("submits email enquiry through server relay without leaking vendor email", async () => {
    vi.mocked(global.fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof Request ? input.url : input.toString();
      if (url === "/api/leads") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              leadId: "lead-email-relay-5678",
              id: "lead-email-relay-5678",
            }),
            { status: 201, headers: { "Content-Type": "application/json" } }
          )
        );
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });

    render(<EnquiryWidget {...baseProps} />);

    // Switch to Email mode
    const emailBtn = screen.getAllByRole("button", { name: /^email$/i })[0];
    fireEvent.click(emailBtn);

    // Fill customer form
    const nameInput = screen.getByPlaceholderText(/e\.g\. Sarah Jenkins/i);
    const emailInput = screen.getByPlaceholderText(/name@example\.com/i);
    const phoneInput = screen.getByPlaceholderText(/0412 345 678/i);
    const cityInput = screen.getByPlaceholderText(/e\.g\. Melbourne/i);
    const licenseCheckbox = screen.getByRole("checkbox");

    fireEvent.change(nameInput, { target: { value: "Sam Wilson" } });
    fireEvent.change(emailInput, { target: { value: "sam@example.com" } });
    fireEvent.change(phoneInput, { target: { value: "0412 888 999" } });
    fireEvent.change(cityInput, { target: { value: "Sydney" } });
    fireEvent.click(licenseCheckbox);

    // Dates
    const dateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: "2026-12-20" } });
    fireEvent.change(dateInputs[1], { target: { value: "2026-12-25" } });

    // Message
    const messageInput = screen.getByPlaceholderText(/type your questions or email message here/i);
    fireEvent.change(messageInput, { target: { value: "Is this vehicle available for hire?" } });

    // Submit email enquiry
    const submitBtn = screen.getByRole("button", { name: /send email enquiry/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/email enquiry sent!/i)).toBeDefined();
      expect(screen.getByText(/delivered directly to the operator via email/i)).toBeDefined();
    });

    // Verify payload routed to /api/leads with customer info
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/leads",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("sam@example.com"),
      })
    );
  });
});
