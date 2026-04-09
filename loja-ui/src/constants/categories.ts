export const PRODUCT_CATEGORIES = [
  "Electronics",
  "Apparel",
  "Office Supplies",
  "Home",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

// NOTE: Categories are static in this MVP. Database-driven category management is out of scope.
