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
  return true;
}

export function isIndexableCityCategory(total: number) {
  return true;
}

export function isIndexableCategoryNational(total: number) {
  return true;
}
