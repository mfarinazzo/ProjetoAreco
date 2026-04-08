import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type {
  PagedResult,
  ProductDashboardStatsResponse,
  ProductItemResponse,
  ProductUpsertInput,
} from "@/components/products/types";

const API_BASE_URL = "http://localhost:5200";

interface ApiProblemDetailsResponse {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

interface UseProductsResult {
  products: ProductItemResponse[];
  dashboardStats: ProductDashboardStatsResponse | null;
  isLoading: boolean;
  isMutating: boolean;
  totalPages: number;
  totalRecords: number;
  createProduct: (input: ProductUpsertInput) => Promise<ProductItemResponse>;
  updateProduct: (id: string, input: ProductUpsertInput) => Promise<ProductItemResponse>;
  deleteProduct: (id: string) => Promise<void>;
  duplicateProduct: (product: ProductItemResponse) => Promise<ProductItemResponse>;
}

async function extractApiErrorMessage(response: Response, fallbackMessage: string): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const payload = (await response.json()) as ApiProblemDetailsResponse;

      const validationMessages = payload.errors
        ? Object.values(payload.errors).flat().filter((message) => Boolean(message))
        : [];

      if (validationMessages.length > 0) {
        return validationMessages.join(" ");
      }

      if (payload.detail) {
        return payload.detail;
      }

      if (payload.title) {
        return payload.title;
      }
    }

    const textPayload = (await response.text()).trim();

    if (textPayload) {
      return textPayload;
    }
  } catch {
    return fallbackMessage;
  }

  return fallbackMessage;
}

export function useProducts(page: number, pageSize = 10): UseProductsResult {
  const [products, setProducts] = useState<ProductItemResponse[]>([]);
  const [dashboardStats, setDashboardStats] = useState<ProductDashboardStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchDashboardStats = useCallback(async () => {
    const response = await fetch(API_BASE_URL + "/api/products/dashboard-stats");

    if (!response.ok) {
      const message = await extractApiErrorMessage(
        response,
        "Failed to load dashboard stats from API.",
      );

      throw new Error(message);
    }

    const payload = (await response.json()) as ProductDashboardStatsResponse;
    setDashboardStats(payload);
  }, []);

  const fetchProductsPage = useCallback(async () => {
    const response = await fetch(
      API_BASE_URL + `/api/products?pageNumber=${page}&pageSize=${pageSize}`,
    );

    if (!response.ok) {
      const message = await extractApiErrorMessage(response, "Failed to load products from API.");
      throw new Error(message);
    }

    const payload = (await response.json()) as PagedResult<ProductItemResponse>;

    setProducts(payload.items ?? []);
    setTotalRecords(payload.totalRecords ?? 0);
    setTotalPages(Math.max(payload.totalPages ?? 1, 1));
  }, [page, pageSize]);

  const refreshProducts = useCallback(async () => {
    await Promise.all([fetchProductsPage(), fetchDashboardStats()]);
  }, [fetchProductsPage, fetchDashboardStats]);

  useEffect(() => {
    let isDisposed = false;

    async function loadData() {
      try {
        setIsLoading(true);
        await refreshProducts();
      } catch (error) {
        if (isDisposed) {
          return;
        }

        const message = error instanceof Error
          ? error.message
          : "Failed to load product data from API.";

        toast.error(message);
        setProducts([]);
        setDashboardStats(null);
        setTotalPages(1);
        setTotalRecords(0);
      } finally {
        if (!isDisposed) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      isDisposed = true;
    };
  }, [refreshProducts]);

  const createProduct = useCallback(async (input: ProductUpsertInput) => {
    try {
      setIsMutating(true);

      const response = await fetch(API_BASE_URL + "/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const message = await extractApiErrorMessage(response, "Failed to create product.");
        throw new Error(message);
      }

      const createdProduct = (await response.json()) as ProductItemResponse;
      await refreshProducts();
      toast.success("Product created successfully.");

      return createdProduct;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create product.";
      toast.error(message);
      throw error;
    } finally {
      setIsMutating(false);
    }
  }, [refreshProducts]);

  const updateProduct = useCallback(async (id: string, input: ProductUpsertInput) => {
    try {
      setIsMutating(true);

      const response = await fetch(API_BASE_URL + "/api/products/" + id, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const message = await extractApiErrorMessage(response, "Failed to update product.");
        throw new Error(message);
      }

      const updatedProduct = (await response.json()) as ProductItemResponse;
      await refreshProducts();
      toast.success("Product updated successfully.");

      return updatedProduct;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update product.";
      toast.error(message);
      throw error;
    } finally {
      setIsMutating(false);
    }
  }, [refreshProducts]);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      setIsMutating(true);

      const response = await fetch(API_BASE_URL + "/api/products/" + id, {
        method: "DELETE",
      });

      if (!response.ok) {
        const message = await extractApiErrorMessage(response, "Failed to delete product.");
        throw new Error(message);
      }

      await refreshProducts();
      toast.success("Product deleted successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete product.";
      toast.error(message);
      throw error;
    } finally {
      setIsMutating(false);
    }
  }, [refreshProducts]);

  const duplicateProduct = useCallback(async (product: ProductItemResponse) => {
    const duplicateInput: ProductUpsertInput = {
      sku: `${product.sku}-COPY-${Math.floor(Math.random() * 1000)}`,
      name: `${product.name} (Copy)`,
      category: product.category as ProductUpsertInput["category"],
      price: product.price,
      stockQuantity: product.stockQuantity,
    };

    return createProduct(duplicateInput);
  }, [createProduct]);

  return {
    products,
    dashboardStats,
    isLoading,
    isMutating,
    totalPages,
    totalRecords,
    createProduct,
    updateProduct,
    deleteProduct,
    duplicateProduct,
  };
}
