/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { VehicleCard } from "@/components/vehicle-card";
import { ImageGallery } from "@/components/image-gallery";
import customImageLoader from "@/lib/image-loader";
import type { Vehicle } from "@/lib/types";

// Base vehicle fixture
const mockVehicle: Vehicle = {
  id: "veh-test-uuid-001",
  slug: "toyota-hiace-2022-tas-rental",
  title: "2022 Toyota Hiace Commuter 12-Seater",
  make: "Toyota",
  model: "Hiace",
  year: 2022,
  seats: 12,
  fuel: "Diesel",
  transmission: "Automatic",
  category: "Van",
  pricePerDayAud: 145,
  city: "Hobart",
  state: "TAS",
  imageUrl: "https://xyzcompany.supabase.co/storage/v1/object/public/vehicle-images/org-123/hiace-portrait.jpg",
  vendorName: "TAS Car Rental",
  vendorSlug: "tas-car-rental",
  branchName: "Hobart Airport Branch",
  verified: true,
  imageCount: 7,
};

describe("Global Vehicle Image System — Full-Image Display & Regression Protection", () => {
  describe("1. VehicleCard Shared Display Policy", () => {
    it("renders vehicle hero image with original object-cover presentation and hover scale", () => {
      const { container } = render(<VehicleCard vehicle={mockVehicle} />);
      const img = container.querySelector("img[alt='2022 Toyota Hiace Commuter 12-Seater']");
      expect(img).not.toBeNull();
      const className = img?.getAttribute("class") || "";

      expect(className).toContain("object-cover");
      expect(className).toContain("group-hover:scale");
    });

    it("renders compact vehicle card variant with object-cover", () => {
      const { container } = render(<VehicleCard vehicle={mockVehicle} variant="compact" />);
      const img = container.querySelector("img[alt='2022 Toyota Hiace Commuter 12-Seater']");
      expect(img).not.toBeNull();
      const className = img?.getAttribute("class") || "";

      expect(className).toContain("object-cover");
      expect(className).toContain("group-hover:scale");
    });

    it("displays the exact imageCount on the photo badge and does not default to 1/1 when imageCount > 1", () => {
      const { container } = render(<VehicleCard vehicle={mockVehicle} />);
      expect(container.textContent).toContain("1/7");
    });

    it("safely displays 1/1 when imageCount is undefined or 1", () => {
      const singleImgVehicle = { ...mockVehicle, imageCount: 1 };
      const { container } = render(<VehicleCard vehicle={singleImgVehicle} />);
      expect(container.textContent).toContain("1/1");
    });
  });

  describe("2. ImageGallery Detail Page Shared Display Policy", () => {
    const galleryImages = [
      {
        id: "img-1",
        url: "https://xyzcompany.supabase.co/storage/v1/object/public/vehicle-images/org-123/hiace-front-portrait.jpg",
        alt_text: "Toyota Hiace Front View (Portrait 3:4)",
      },
      {
        id: "img-2",
        url: "https://xyzcompany.supabase.co/storage/v1/object/public/vehicle-images/org-123/hiace-side-landscape.jpg",
        alt_text: "Toyota Hiace Side View (Landscape 16:9)",
      },
      {
        id: "img-3",
        url: "https://xyzcompany.supabase.co/storage/v1/object/public/vehicle-images/org-123/hiace-interior-square.jpg",
        alt_text: "Toyota Hiace Interior (Square 1:1)",
      },
    ];

    it("renders main gallery image with object-contain and never object-cover", () => {
      const { container } = render(<ImageGallery images={galleryImages} vehicleId={mockVehicle.id} />);
      const mainImg = container.querySelector("img[alt='Toyota Hiace Front View (Portrait 3:4)']");
      expect(mainImg).not.toBeNull();
      const className = mainImg?.getAttribute("class") || "";

      expect(className).toContain("object-contain");
      expect(className).not.toContain("object-cover");
    });

    it("renders thumbnail images with object-contain to avoid cropping in thumbnail strip", () => {
      const { container } = render(<ImageGallery images={galleryImages} vehicleId={mockVehicle.id} />);
      const thumbnails = container.querySelectorAll(".hidden.md\\:flex button img");
      expect(thumbnails.length).toBe(galleryImages.length);

      thumbnails.forEach((thumb) => {
        const className = thumb.getAttribute("class") || "";
        expect(className).toContain("object-contain");
        expect(className).not.toContain("object-cover");
      });
    });
  });

  describe("3. Supabase Storage Image Loader & Transformation Policy", () => {
    it("rewrites Supabase Storage URLs with resize=cover", () => {
      const rawSupabaseUrl =
        "https://xyzcompany.supabase.co/storage/v1/object/public/vehicle-images/org-123/hiace-portrait.jpg";
      const transformedUrl = customImageLoader({
        src: rawSupabaseUrl,
        width: 820,
        quality: 80,
      });

      expect(transformedUrl).toContain("/storage/v1/render/image/public/vehicle-images/org-123/hiace-portrait.jpg");
      expect(transformedUrl).toContain("width=820");
      expect(transformedUrl).toContain("resize=cover");
      expect(transformedUrl).toContain("quality=80");
    });

    it("bypasses rewriting for signed and authenticated Supabase storage URLs", () => {
      const signedUrl =
        "https://xyzcompany.supabase.co/storage/v1/object/sign/vehicle-images/temp-123.jpg?token=valid_hmac_token";
      expect(customImageLoader({ src: signedUrl, width: 640 })).toBe(signedUrl);

      const authUrl =
        "https://xyzcompany.supabase.co/storage/v1/object/authenticated/vehicle-images/temp-123.jpg";
      expect(customImageLoader({ src: authUrl, width: 640 })).toBe(authUrl);
    });

    it("bypasses rewriting for blob and data URLs during preview", () => {
      const blobUrl = "blob:http://localhost:3000/1234-5678-uuid";
      expect(customImageLoader({ src: blobUrl, width: 640 })).toBe(blobUrl);

      const dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
      expect(customImageLoader({ src: dataUrl, width: 640 })).toBe(dataUrl);
    });

    it("optimizes Unsplash stock images with aspect-preserving parameters", () => {
      const unsplashUrl =
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop";
      const transformed = customImageLoader({ src: unsplashUrl, width: 1080 });
      expect(transformed).toContain("w=1080");
      expect(transformed).toContain("auto=format%2Ccompress");
    });
  });

  describe("4. Multi-Orientation Synthetic Fixture Tests", () => {
    const orientations = [
      { name: "Portrait 3:4", url: "https://example.com/vehicles/van-portrait-3-4.jpg" },
      { name: "Landscape 16:9", url: "https://example.com/vehicles/sedan-landscape-16-9.jpg" },
      { name: "Landscape 4:3", url: "https://example.com/vehicles/suv-landscape-4-3.jpg" },
      { name: "Square 1:1", url: "https://example.com/vehicles/hatchback-square-1-1.jpg" },
      { name: "Tall Portrait 9:16", url: "https://example.com/vehicles/truck-tall-portrait.jpg" },
      { name: "Wide Panorama 21:9", url: "https://example.com/vehicles/wagon-panorama.jpg" },
    ];

    orientations.forEach(({ name, url }) => {
      it(`VehicleCard displays ${name} photograph with original object-cover presentation`, () => {
        const testVehicle = { ...mockVehicle, id: `test-${name}`, imageUrl: url };
        const { container } = render(<VehicleCard vehicle={testVehicle} />);
        const img = container.querySelector(`img[alt='${testVehicle.title}']`);
        expect(img).not.toBeNull();
        const className = img?.getAttribute("class") || "";

        expect(className).toContain("object-cover");
      });
    });
  });

  describe("5. Non-Vehicle Media Protection Check", () => {
    it("vendor logo continues to use circular avatar styling without interference", () => {
      const vehicleWithLogo = {
        ...mockVehicle,
        vendorLogoUrl: "https://example.com/logos/tas-rental-logo.png",
      };
      const { container } = render(<VehicleCard vehicle={vehicleWithLogo} />);
      const logoImg = container.querySelector("img[alt='TAS Car Rental']");
      expect(logoImg).not.toBeNull();
      const className = logoImg?.getAttribute("class") || "";
      expect(className).toContain("rounded-full");
    });
  });
});
