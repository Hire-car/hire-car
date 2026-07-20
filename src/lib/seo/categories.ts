export const VEHICLE_CATEGORIES = [
  "Sedan",
  "SUV",
  "People mover",
  "Van",
  "Ute",
  "Luxury",
  "Hatchback",
  "Convertible",
  "Coupe",
  "Wagon",
  "Sports car",
  "Minibus",
  "Truck",
  "Campervan"
] as const;

export type VehicleCategory = (typeof VEHICLE_CATEGORIES)[number];

const CATEGORY_SLUG_MAP: Record<string, VehicleCategory> = {
  sedan: "Sedan",
  suv: "SUV",
  "people-mover": "People mover",
  van: "Van",
  ute: "Ute",
  luxury: "Luxury",
  hatchback: "Hatchback",
  convertible: "Convertible",
  coupe: "Coupe",
  wagon: "Wagon",
  "sports-car": "Sports car",
  minibus: "Minibus",
  truck: "Truck",
  campervan: "Campervan"
};

const CATEGORY_TO_SLUG: Record<VehicleCategory, string> = {
  Sedan: "sedan",
  SUV: "suv",
  "People mover": "people-mover",
  Van: "van",
  Ute: "ute",
  Luxury: "luxury",
  Hatchback: "hatchback",
  Convertible: "convertible",
  Coupe: "coupe",
  Wagon: "wagon",
  "Sports car": "sports-car",
  Minibus: "minibus",
  Truck: "truck",
  Campervan: "campervan"
};

export function categoryToSlug(category: string): string {
  const normalized = category as VehicleCategory;
  if (CATEGORY_TO_SLUG[normalized]) {
    return CATEGORY_TO_SLUG[normalized];
  }
  return category.toLowerCase().replace(/\s+/g, "-");
}

export function slugToCategory(slug: string): VehicleCategory | null {
  return CATEGORY_SLUG_MAP[slug.toLowerCase()] ?? null;
}

export function isCategorySlug(segment: string): boolean {
  return slugToCategory(segment) !== null;
}

export function isValidCategory(category: string): category is VehicleCategory {
  return (VEHICLE_CATEGORIES as readonly string[]).includes(category);
}
