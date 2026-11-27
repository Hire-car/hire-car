/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { VehicleCard } from "@/components/vehicle-card";
import type { Vehicle } from "@/lib/types";

const sampleVehicle: Vehicle = {
  id: "veh-sync-001",
  slug: "bmw-m4-competition-2024",
  title: "2024 BMW M4 Competition Coupe",
  make: "BMW",
  model: "M4 Competition",
  year: 2024,
  seats: 4,
  fuel: "Petrol",
  transmission: "Automatic",
  category: "Sports",
  pricePerDayAud: 320,
  weeklyRateAud: 1950,
  city: "Melbourne",
  state: "VIC",
  imageUrl: "https://xyzcompany.supabase.co/storage/v1/object/public/vehicle-images/org-2/m4-front.jpg",
  vendorName: "Melbourne Drive Co",
  vendorSlug: "melbourne-drive-co",
  branchName: "Melbourne CBD Branch",
  verified: true,
  imageCount: 4,
};

describe("Marketplace Vehicle Card & Indexing Synchronization Integrity", () => {
  describe("1. VehicleCard Original Presentation & Floating Price Card", () => {
    it("renders hero image section with original floating price card and image containment", () => {
      const { container } = render(<VehicleCard vehicle={sampleVehicle} />);
      
      // Hero image container (4:3 aspect ratio with blurred background extension)
      const heroSection = container.querySelector(".aspect-\\[4\\/3\\]");
      expect(heroSection).not.toBeNull();

      // Original floating price badge inside hero section
      expect(heroSection?.textContent).toContain("$320");
      expect(heroSection?.textContent).toContain("/day");
      expect(heroSection?.textContent).toContain("Weekly from");
      expect(heroSection?.textContent).toContain("$1950");

      // Verify foreground car image uses object-contain and never object-cover
      const img = heroSection?.querySelector("img[alt='2024 BMW M4 Competition Coupe']");
      expect(img?.getAttribute("class")).toContain("object-contain");
      expect(img?.getAttribute("class")).not.toContain("object-cover");

      // Verify blurred background extension layer is present
      const blurredBg = heroSection?.querySelector("[aria-hidden='true']");
      expect(blurredBg).not.toBeNull();
      expect(blurredBg?.getAttribute("style")).toContain("blur(40px)");
    });

    it("renders vehicle title, vendor info, and specs in the card body", () => {
      const { container } = render(<VehicleCard vehicle={sampleVehicle} />);
      
      expect(container.textContent).toContain("2024 BMW M4 Competition Coupe");
      expect(container.textContent).toContain("Melbourne Drive Co");
      expect(container.textContent).toContain("4 Seats");
      expect(container.textContent).toContain("Automatic");
      expect(container.textContent).toContain("Petrol");
    });

    it("preserves photo counter and badges without interfering with car body", () => {
      const { container } = render(<VehicleCard vehicle={sampleVehicle} priority={true} />);
      expect(container.textContent).toContain("1/4");
      expect(container.textContent).toContain("Featured");
    });
  });
});
