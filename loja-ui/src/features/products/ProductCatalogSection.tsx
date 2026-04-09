import { useEffect, useMemo, useState } from "react";
import Highcharts from "highcharts";
import { HighchartsReact } from "highcharts-react-official";
import { Boxes, DollarSign, TriangleAlert, type LucideIcon } from "lucide-react";
import { ProductForm, INITIAL_PRODUCT_FORM_VALUES, type ProductFormValues } from "@/components/products/ProductForm";
import { ProductTable } from "@/components/products/ProductTable";
import type {
  ProductDashboardStatsResponse,
  ProductItemResponse,
  ProductSortBy,
  ProductSortDirection,
  ProductStatusFilter,
} from "@/components/products/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PRODUCT_CATEGORIES } from "@/constants/categories";
import { useProducts } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";

interface MetricCardData {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  tone: "default" | "warning" | "success";
}

interface CategoryBreakdownItem {
  category: string;
  units: number;
  percentage: number;
  colorHex: string;
  dotClassName: string;
}

interface ProductCatalogSectionProps {
  showCharts?: boolean;
}

const LOW_STOCK_THRESHOLD = 10;

const SEARCH_DEBOUNCE_MS = 300;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [value, delayMs]);

  return debouncedValue;
}

const CATEGORY_COLOR_HEX: Record<string, string> = {
  Electronics: "#0f172a",
  Apparel: "#334155",
  "Office Supplies": "#64748b",
  Home: "#94a3b8",
};

const CATEGORY_DOT_CLASS: Record<string, string> = {
  Electronics: "bg-slate-900",
  Apparel: "bg-slate-700",
  "Office Supplies": "bg-slate-500",
  Home: "bg-slate-400",
};

const currencyNoDecimals = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const integerFormatter = new Intl.NumberFormat("en-US");

function getMetricCards(
  products: ProductItemResponse[],
  dashboardStats: ProductDashboardStatsResponse | null,
): MetricCardData[] {
  const totalProducts = dashboardStats?.totalProducts ?? products.length;
  const lowStockCount = dashboardStats?.lowStockProducts ??
    products.filter((product) => product.stockQuantity < LOW_STOCK_THRESHOLD).length;
  const totalInventoryValue =
    dashboardStats?.totalInventoryValue ??
    products.reduce((accumulator, product) => accumulator + product.price * product.stockQuantity, 0);

  return [
    {
      title: "Total Products",
      value: integerFormatter.format(totalProducts),
      subtitle: integerFormatter.format(products.length) + " items listed in catalog",
      icon: Boxes,
      tone: "success",
    },
    {
      title: "Low Stock Alert",
      value: `${integerFormatter.format(lowStockCount)} items`,
      subtitle: "Requires restocking",
      icon: TriangleAlert,
      tone: "warning",
    },
    {
      title: "Total Inventory Value",
      value: currencyNoDecimals.format(totalInventoryValue),
      subtitle: "Current asset value",
      icon: DollarSign,
      tone: "default",
    },
  ];
}

function getCategoryBreakdown(
  products: ProductItemResponse[],
  dashboardStats: ProductDashboardStatsResponse | null,
): CategoryBreakdownItem[] {
  if (dashboardStats && dashboardStats.categories.length > 0) {
    const totalUnitsFromApi = dashboardStats.categories.reduce(
      (accumulator, item) => accumulator + item.stockQuantity,
      0,
    );

    if (totalUnitsFromApi <= 0) {
      return [];
    }

    return dashboardStats.categories
      .map((item) => ({
        category: item.category,
        units: item.stockQuantity,
        percentage: Math.round((item.stockQuantity / totalUnitsFromApi) * 100),
        colorHex: CATEGORY_COLOR_HEX[item.category] ?? "#94a3b8",
        dotClassName: CATEGORY_DOT_CLASS[item.category] ?? "bg-slate-400",
      }))
      .sort((leftItem, rightItem) => rightItem.units - leftItem.units);
  }

  const totalUnits = products.reduce((accumulator, product) => accumulator + product.stockQuantity, 0);

  if (totalUnits <= 0) {
    return [];
  }

  const categoryUnitsMap = products.reduce<Record<string, number>>((accumulator, product) => {
    const currentUnits = accumulator[product.category] ?? 0;
    accumulator[product.category] = currentUnits + product.stockQuantity;
    return accumulator;
  }, {});

  return Object.entries(categoryUnitsMap)
    .map(([category, units]) => ({
      category,
      units,
      percentage: Math.round((units / totalUnits) * 100),
      colorHex: CATEGORY_COLOR_HEX[category] ?? "#94a3b8",
      dotClassName: CATEGORY_DOT_CLASS[category] ?? "bg-slate-400",
    }))
    .sort((leftItem, rightItem) => rightItem.units - leftItem.units);
}

function getTopProductsByStock(products: ProductItemResponse[]): ProductItemResponse[] {
  return [...products]
    .sort((leftProduct, rightProduct) => rightProduct.stockQuantity - leftProduct.stockQuantity)
    .slice(0, 5);
}

function buildInventoryDonutChartOptions(categoryBreakdown: CategoryBreakdownItem[]): Highcharts.Options {
  return {
    chart: {
      type: "pie",
      backgroundColor: "transparent",
      height: 230,
      spacing: [0, 0, 0, 0],
    },
    title: {
      text: undefined,
    },
    credits: {
      enabled: false,
    },
    legend: {
      enabled: false,
    },
    tooltip: {
      pointFormat: "<b>{point.percentage:.1f}%</b> of inventory units",
    },
    plotOptions: {
      pie: {
        innerSize: "68%",
        borderWidth: 0,
        dataLabels: {
          enabled: false,
        },
      },
    },
    series: [
      {
        type: "pie",
        data: categoryBreakdown.map((item) => ({
          name: item.category,
          y: item.units,
          color: item.colorHex,
        })),
      },
    ],
  };
}

function buildTopProductsBarChartOptions(topProducts: ProductItemResponse[]): Highcharts.Options {
  return {
    chart: {
      type: "column",
      backgroundColor: "transparent",
      height: 230,
      spacing: [8, 8, 8, 8],
    },
    title: {
      text: undefined,
    },
    credits: {
      enabled: false,
    },
    legend: {
      enabled: false,
    },
    xAxis: {
      categories: topProducts.map((product) => product.name),
      lineColor: "#cbd5e1",
      tickColor: "#cbd5e1",
      labels: {
        style: {
          color: "#334155",
          fontSize: "11px",
        },
      },
    },
    yAxis: {
      title: {
        text: undefined,
      },
      gridLineColor: "#e2e8f0",
      labels: {
        style: {
          color: "#475569",
        },
      },
    },
    tooltip: {
      valueSuffix: " units",
    },
    plotOptions: {
      column: {
        borderRadius: 5,
        borderWidth: 0,
        maxPointWidth: 48,
        color: "#0f172a",
      },
    },
    series: [
      {
        type: "column",
        data: topProducts.map((product) => product.stockQuantity),
      },
    ],
  };
}

function productToFormValues(product: ProductItemResponse): ProductFormValues {
  return {
    sku: product.sku,
    name: product.name,
    category: product.category as ProductFormValues["category"],
    price: product.price,
    stockQuantity: product.stockQuantity,
  };
}

function MetricCard({ title, value, subtitle, icon: IconComponent, tone }: MetricCardData) {
  const toneStyles: Record<MetricCardData["tone"], string> = {
    default: "bg-slate-100 text-slate-700",
    warning: "bg-amber-100 text-amber-700",
    success: "bg-emerald-100 text-emerald-700",
  };

  return (
    <Card className="gap-0 rounded-xl border border-slate-200 bg-white py-0 shadow-sm ring-0">
      <CardContent className="flex items-start gap-3 p-4 sm:p-5">
        <div className={cn("mt-0.5 rounded-full p-2", toneStyles[tone])}>
          <IconComponent className="size-4" />
        </div>
        <div>
          <p className="text-sm text-slate-600">{title}</p>
          <p className="text-3xl font-semibold leading-none tracking-tight text-slate-900 sm:text-[34px]">
            {value}
          </p>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricsGrid({ metricCards }: { metricCards: MetricCardData[] }) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {metricCards.map((metricCard) => (
        <MetricCard
          key={metricCard.title}
          title={metricCard.title}
          value={metricCard.value}
          subtitle={metricCard.subtitle}
          icon={metricCard.icon}
          tone={metricCard.tone}
        />
      ))}
    </section>
  );
}

function ChartsArea({
  categoryBreakdown,
  inventoryDonutOptions,
  topProductsBarOptions,
}: {
  categoryBreakdown: CategoryBreakdownItem[];
  inventoryDonutOptions: Highcharts.Options;
  topProductsBarOptions: Highcharts.Options;
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
      <Card className="gap-0 rounded-xl border border-slate-200 bg-white py-0 shadow-sm ring-0">
        <CardHeader className="border-b border-slate-100 px-4 py-3">
          <CardTitle className="text-lg font-semibold text-slate-900">Inventory by Category</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-center">
          <div className="mx-auto w-full max-w-[260px] md:mx-0">
            <HighchartsReact highcharts={Highcharts} options={inventoryDonutOptions} />
          </div>

          {categoryBreakdown.length > 0 ? (
            <ul className="space-y-3 text-sm">
              {categoryBreakdown.map((item) => (
                <li key={item.category} className="flex items-center justify-between gap-5 md:min-w-[180px]">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className={cn("size-2.5 rounded-full", item.dotClassName)} />
                    {item.category}
                  </span>
                  <span className="font-semibold text-slate-900">{item.percentage}%</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No stock data available.</p>
          )}
        </CardContent>
      </Card>

      <Card className="gap-0 rounded-xl border border-slate-200 bg-white py-0 shadow-sm ring-0">
        <CardHeader className="border-b border-slate-100 px-4 py-3">
          <CardTitle className="text-lg font-semibold text-slate-900">Top 5 Products in Stock</CardTitle>
        </CardHeader>

        <CardContent className="p-4">
          <HighchartsReact highcharts={Highcharts} options={topProductsBarOptions} />
        </CardContent>
      </Card>
    </section>
  );
}

function DeleteProductModal({
  product,
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
}: {
  product: ProductItemResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isSubmitting: boolean;
}) {
  if (!isOpen || !product) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-3 py-6">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <h2 className="text-xl font-semibold text-slate-900">Delete Product</h2>
        <p className="mt-2 text-sm text-slate-600">
          Are you sure you want to remove <span className="font-semibold text-slate-900">{product.name}</span> from
          the catalog?
        </p>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-10 rounded-lg border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              void onConfirm();
            }}
            disabled={isSubmitting}
            className="h-10 rounded-lg bg-red-600 px-4 text-white hover:bg-red-700"
          >
            {isSubmitting ? "Deleting..." : "Delete Product"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProductCatalogSection({ showCharts = false }: ProductCatalogSectionProps) {
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productCurrentPage, setProductCurrentPage] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<ProductStatusFilter[]>([]);
  const [sortBy, setSortBy] = useState<ProductSortBy>("id");
  const [sortDirection, setSortDirection] = useState<ProductSortDirection>("asc");
  const debouncedSearchTerm = useDebouncedValue(productSearchTerm, SEARCH_DEBOUNCE_MS);

  const {
    products,
    dashboardStats,
    isLoading: isProductsLoading,
    isMutating: isProductMutationLoading,
    totalPages: productTotalPages,
    totalRecords: productTotalRecords,
    createProduct,
    updateProduct,
    deleteProduct,
    duplicateProduct,
    seedDemoProducts,
  } = useProducts(productCurrentPage, 10, {
    searchTerm: debouncedSearchTerm,
    categories: selectedCategories,
    statuses: selectedStatuses,
    sortBy,
    sortDirection,
  });

  const [isCreateProductModalOpen, setIsCreateProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItemResponse | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductItemResponse | null>(null);

  useEffect(() => {
    if (productCurrentPage > productTotalPages) {
      setProductCurrentPage(productTotalPages);
    }
  }, [productCurrentPage, productTotalPages]);

  const productMetricCards = useMemo(
    () => getMetricCards(products, dashboardStats),
    [products, dashboardStats],
  );

  const categoryBreakdown = useMemo(
    () => getCategoryBreakdown(products, dashboardStats),
    [products, dashboardStats],
  );

  const topProductsByStock = useMemo(() => getTopProductsByStock(products), [products]);

  const inventoryDonutOptions = useMemo(
    () => buildInventoryDonutChartOptions(categoryBreakdown),
    [categoryBreakdown],
  );

  const topProductsBarOptions = useMemo(
    () => buildTopProductsBarChartOptions(topProductsByStock),
    [topProductsByStock],
  );

  async function handleCreateProduct(values: ProductFormValues) {
    await createProduct(values);
    setProductCurrentPage(1);
    setIsCreateProductModalOpen(false);
  }

  async function handleUpdateProduct(values: ProductFormValues) {
    if (!editingProduct) {
      return;
    }

    try {
      await updateProduct(editingProduct.id, values);
      setEditingProduct(null);
    } catch {
      // Keep modal open for correction. Error toast is handled by useProducts.
    }
  }

  async function handleDeleteProduct() {
    if (!deletingProduct) {
      return;
    }

    try {
      await deleteProduct(deletingProduct.id);
      setDeletingProduct(null);
    } catch {
      // Error toast is handled by useProducts.
    }
  }

  async function handleDuplicateProduct(product: ProductItemResponse) {
    try {
      await duplicateProduct(product);
      setProductCurrentPage(1);
    } catch {
      // Error toast is handled by useProducts.
    }
  }

  async function handleSeedDemoData() {
    try {
      await seedDemoProducts(232);
      setProductCurrentPage(1);
    } catch {
      // Error toast is handled by useProducts.
    }
  }

  function toggleCategoryFilter(category: string) {
    setProductCurrentPage(1);
    setSelectedCategories((currentCategories) => {
      if (currentCategories.includes(category)) {
        return currentCategories.filter((item) => item !== category);
      }

      return [...currentCategories, category];
    });
  }

  function toggleStatusFilter(status: ProductStatusFilter) {
    setProductCurrentPage(1);
    setSelectedStatuses((currentStatuses) => {
      if (currentStatuses.includes(status)) {
        return currentStatuses.filter((item) => item !== status);
      }

      return [...currentStatuses, status];
    });
  }

  function clearFilters() {
    setProductCurrentPage(1);
    setSelectedCategories([]);
    setSelectedStatuses([]);
  }

  function handleSortChange(column: ProductSortBy) {
    setProductCurrentPage(1);

    if (column === "id") {
      setSortBy("id");
      setSortDirection((currentDirection) => {
        if (sortBy !== "id") {
          return "asc";
        }

        return currentDirection === "asc" ? "desc" : "asc";
      });
      return;
    }

    if (sortBy !== column) {
      setSortBy(column);
      setSortDirection("asc");
      return;
    }

    if (sortDirection === "asc") {
      setSortDirection("desc");
      return;
    }

    setSortBy("id");
    setSortDirection("asc");
  }

  return (
    <>
      {isProductsLoading && (
        <Card className="gap-0 rounded-xl border border-slate-200 bg-white py-0 shadow-sm ring-0">
          <CardContent className="px-4 py-3 text-sm text-slate-600">
            Loading products and dashboard stats from API...
          </CardContent>
        </Card>
      )}

      <MetricsGrid metricCards={productMetricCards} />

      {showCharts && (
        <ChartsArea
          categoryBreakdown={categoryBreakdown}
          inventoryDonutOptions={inventoryDonutOptions}
          topProductsBarOptions={topProductsBarOptions}
        />
      )}

      <ProductTable
        products={products}
        searchTerm={productSearchTerm}
        currentPage={productCurrentPage}
        totalPages={productTotalPages}
        totalRecords={productTotalRecords}
        pageSize={10}
        isLoading={isProductsLoading}
        sortBy={sortBy}
        sortDirection={sortDirection}
        categoryOptions={PRODUCT_CATEGORIES}
        selectedCategories={selectedCategories}
        selectedStatuses={selectedStatuses}
        onSearchTermChange={(value) => {
          setProductSearchTerm(value);
          setProductCurrentPage(1);
        }}
        onSortChange={handleSortChange}
        onToggleCategoryFilter={toggleCategoryFilter}
        onToggleStatusFilter={toggleStatusFilter}
        onClearFilters={clearFilters}
        onPageChange={setProductCurrentPage}
        onOpenAddModal={() => setIsCreateProductModalOpen(true)}
        onSeedDemoData={handleSeedDemoData}
        onOpenEditModal={setEditingProduct}
        onOpenDeleteModal={setDeletingProduct}
        onDuplicateProduct={handleDuplicateProduct}
        isSeedingDemoData={isProductMutationLoading}
      />

      <ProductForm
        isOpen={isCreateProductModalOpen}
        mode="create"
        initialValues={INITIAL_PRODUCT_FORM_VALUES}
        onClose={() => setIsCreateProductModalOpen(false)}
        onSubmit={async (values) => {
          try {
            await handleCreateProduct(values);
          } catch {
            // Keep modal open when API rejects payload.
          }
        }}
        isSubmitting={isProductMutationLoading}
      />

      <ProductForm
        isOpen={Boolean(editingProduct)}
        mode="edit"
        initialValues={editingProduct ? productToFormValues(editingProduct) : INITIAL_PRODUCT_FORM_VALUES}
        onClose={() => setEditingProduct(null)}
        onSubmit={async (values) => {
          await handleUpdateProduct(values);
        }}
        isSubmitting={isProductMutationLoading}
      />

      <DeleteProductModal
        isOpen={Boolean(deletingProduct)}
        product={deletingProduct}
        onClose={() => setDeletingProduct(null)}
        onConfirm={handleDeleteProduct}
        isSubmitting={isProductMutationLoading}
      />
    </>
  );
}
