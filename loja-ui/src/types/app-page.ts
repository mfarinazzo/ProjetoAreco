export type AppPage = "dashboard" | "products" | "orders" | "customers" | "settings";

export const PAGE_TITLES: Record<AppPage, string> = {
  dashboard: "Product Catalog",
  products: "Products",
  orders: "Orders",
  customers: "Customers",
  settings: "Settings",
};
