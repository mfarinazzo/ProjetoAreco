import type { ProductCategory } from "@/constants/categories";

export interface ProductItemResponse {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stockQuantity: number;
}

export interface ProductCategoryStockResponse {
  category: string;
  stockQuantity: number;
}

export interface ProductDashboardStatsResponse {
  totalProducts: number;
  totalInventoryValue: number;
  categories: ProductCategoryStockResponse[];
  lowStockProducts: number;
}

export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

export interface ProductUpsertInput {
  sku: string;
  name: string;
  category: ProductCategory;
  price: number;
  stockQuantity: number;
}

export type ProductSortBy = "id" | "price" | "stockQuantity";

export type ProductSortDirection = "asc" | "desc";

export type ProductStatusFilter = "inStock" | "lowStock";
