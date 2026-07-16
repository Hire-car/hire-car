import { THIN_PAGE_THRESHOLDS } from "./constants";

export function cityRobots(total: number) {
  return { index: true as const, follow: true as const };
}

export function cityCategoryRobots(total: number) {
  return { index: true as const, follow: true as const };
}

export function brandRobots(total: number) {
  return { index: true as const, follow: true as const };
}

export function categoryNationalRobots(total: number) {
  return { index: true as const, follow: true as const };
}

export function isIndexableCity(total: number) {
  return total >= THIN_PAGE_THRESHOLDS.city;
}

export function isIndexableCityCategory(total: number) {
  return total >= THIN_PAGE_THRESHOLDS.cityCategory;
}

export function isIndexableCategoryNational(total: number) {
  return total >= THIN_PAGE_THRESHOLDS.categoryNational;
}
