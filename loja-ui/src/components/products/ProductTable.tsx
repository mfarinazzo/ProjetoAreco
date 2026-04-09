import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Database, MoreHorizontal, Pencil, Plus, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import type {
  ProductItemResponse,
  ProductSortBy,
  ProductSortDirection,
  ProductStatusFilter,
} from "@/components/products/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const LOW_STOCK_THRESHOLD = 10;
const currencyWithDecimals = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const integerFormatter = new Intl.NumberFormat("en-US");

interface ProductTableProps {
  products: ProductItemResponse[];
  searchTerm: string;
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  isLoading: boolean;
  sortBy: ProductSortBy;
  sortDirection: ProductSortDirection;
  categoryOptions: readonly string[];
  selectedCategories: string[];
  selectedStatuses: ProductStatusFilter[];
  onSearchTermChange: (value: string) => void;
  onSortChange: (column: ProductSortBy) => void;
  onToggleCategoryFilter: (category: string) => void;
  onToggleStatusFilter: (status: ProductStatusFilter) => void;
  onClearFilters: () => void;
  onPageChange: (nextPage: number) => void;
  onOpenAddModal: () => void;
  onSeedDemoData: () => Promise<void>;
  onOpenEditModal: (product: ProductItemResponse) => void;
  onOpenDeleteModal: (product: ProductItemResponse) => void;
  onDuplicateProduct: (product: ProductItemResponse) => Promise<void>;
  isSeedingDemoData?: boolean;
}

function getVisiblePageNumbers(totalPages: number, currentPage: number): number[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, 5];
  }

  if (currentPage >= totalPages - 2) {
    return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
}

function StockStatusBadge({ stockQuantity }: { stockQuantity: number }) {
  const isLowStock = stockQuantity < LOW_STOCK_THRESHOLD;

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-md px-2.5 text-xs font-medium",
        isLowStock ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700",
      )}
    >
      {isLowStock ? "Low Stock" : "In Stock"}
    </span>
  );
}

export function ProductTable({
  products,
  searchTerm,
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  isLoading,
  sortBy,
  sortDirection,
  categoryOptions,
  selectedCategories,
  selectedStatuses,
  onSearchTermChange,
  onSortChange,
  onToggleCategoryFilter,
  onToggleStatusFilter,
  onClearFilters,
  onPageChange,
  onOpenAddModal,
  onSeedDemoData,
  onOpenEditModal,
  onOpenDeleteModal,
  onDuplicateProduct,
  isSeedingDemoData = false,
}: ProductTableProps) {
  const [openRowMenuId, setOpenRowMenuId] = useState<string | null>(null);
  const [rowMenuDirection, setRowMenuDirection] = useState<"up" | "down">("down");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const rowMenuContainerRef = useRef<HTMLDivElement>(null);
  const rowMenuHeight = 44;

  function handleToggleRowMenu(productId: string, triggerButton: HTMLButtonElement) {
    setOpenRowMenuId((currentId) => {
      if (currentId === productId) {
        return null;
      }

      const viewportBottomSpace = window.innerHeight - triggerButton.getBoundingClientRect().bottom;
      const shouldOpenUpward = viewportBottomSpace < rowMenuHeight + 16;
      setRowMenuDirection(shouldOpenUpward ? "up" : "down");

      return productId;
    });
  }

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!rowMenuContainerRef.current?.contains(event.target as Node)) {
        setOpenRowMenuId(null);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const visiblePageNumbers = useMemo(
    () => getVisiblePageNumbers(totalPages, currentPage),
    [totalPages, currentPage],
  );

  const isFiltering = searchTerm.trim().length > 0;
  const firstItemIndex = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItemIndex = totalRecords === 0 ? 0 : Math.min(currentPage * pageSize, totalRecords);
  const activeFilterCount = selectedCategories.length + selectedStatuses.length;

  function getDisplayIdByRowIndex(rowIndex: number): number {
    const absoluteIndex = (currentPage - 1) * pageSize + rowIndex;

    if (sortBy === "id" && sortDirection === "desc") {
      return Math.max(totalRecords - absoluteIndex, 0);
    }

    return absoluteIndex + 1;
  }

  function renderSortIcon(column: ProductSortBy) {
    if (sortBy !== column) {
      return <ArrowUp className="size-3.5 opacity-30" />;
    }

    return sortDirection === "asc"
      ? <ArrowUp className="size-3.5" />
      : <ArrowDown className="size-3.5" />;
  }

  return (
    <section ref={rowMenuContainerRef}>
      <Card className="gap-0 rounded-xl border border-slate-200 bg-white py-0 shadow-sm ring-0">
        <CardHeader className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900">Product List</CardTitle>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[240px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => onSearchTermChange(event.target.value)}
                placeholder="Search Products..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFilterPanelOpen((isOpen) => !isOpen)}
              className="h-9 rounded-lg border-slate-200 bg-white px-3 text-slate-700 hover:bg-slate-100"
              aria-label="Open filters"
            >
              <SlidersHorizontal className="size-4" />
              {activeFilterCount > 0 && (
                <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-xs font-semibold text-slate-700">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            <Button
              type="button"
              onClick={onOpenAddModal}
              className="h-9 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus className="size-4" />
              Add Product
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void onSeedDemoData();
              }}
              disabled={isSeedingDemoData}
              className="h-9 rounded-lg border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <Database className="size-4" />
              {isSeedingDemoData ? "Adding data..." : "Add 232 Demo"}
            </Button>
          </div>
        </CardHeader>

        <div
          className={cn(
            "grid transition-all duration-300 ease-out",
            isFilterPanelOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <div className="space-y-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Category</span>
                {categoryOptions.map((category) => {
                  const isActive = selectedCategories.includes(category);

                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => onToggleCategoryFilter(category)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                        isActive
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
                      )}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Status</span>
                {([
                  { value: "inStock", label: "In Stock" },
                  { value: "lowStock", label: "Low Stock" },
                ] as const).map((statusItem) => {
                  const isActive = selectedStatuses.includes(statusItem.value);

                  return (
                    <button
                      key={statusItem.value}
                      type="button"
                      onClick={() => onToggleStatusFilter(statusItem.value)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                        isActive
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
                      )}
                    >
                      {statusItem.label}
                    </button>
                  );
                })}

                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={onClearFilters}
                    className="ml-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  <button
                    type="button"
                    onClick={() => onSortChange("id")}
                    className="inline-flex items-center gap-1 hover:text-slate-700"
                  >
                    ID
                    {renderSortIcon("id")}
                  </button>
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  SKU
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Name
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Category
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  <button
                    type="button"
                    onClick={() => onSortChange("price")}
                    className="inline-flex items-center gap-1 hover:text-slate-700"
                  >
                    Price
                    {renderSortIcon("price")}
                  </button>
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  <button
                    type="button"
                    onClick={() => onSortChange("stockQuantity")}
                    className="inline-flex items-center gap-1 hover:text-slate-700"
                  >
                    Stock Quantity
                    {renderSortIcon("stockQuantity")}
                  </button>
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Status
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                    {isLoading ? "Loading products..." : "No products found for this filter."}
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product, rowIndex) => (
                  <TableRow key={product.id} className="hover:bg-slate-50">
                    <TableCell className="px-4 py-3 font-medium text-slate-600">
                      {integerFormatter.format(getDisplayIdByRowIndex(rowIndex))}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-medium text-slate-700">{product.sku}</TableCell>
                    <TableCell className="px-4 py-3 font-medium text-slate-900">{product.name}</TableCell>
                    <TableCell className="px-4 py-3 text-slate-600">{product.category}</TableCell>
                    <TableCell className="px-4 py-3 text-slate-700">
                      {currencyWithDecimals.format(product.price)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-slate-700">
                      {integerFormatter.format(product.stockQuantity)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <StockStatusBadge stockQuantity={product.stockQuantity} />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="relative flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onOpenEditModal(product)}
                          className="size-8 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onOpenDeleteModal(product)}
                          className="size-8 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(event) => handleToggleRowMenu(product.id, event.currentTarget)}
                          className="size-8 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>

                        {openRowMenuId === product.id && (
                          <div
                            className={cn(
                              "absolute right-0 z-30 w-40 rounded-lg border border-slate-200 bg-white p-1 shadow-lg",
                              rowMenuDirection === "up" ? "bottom-[calc(100%+4px)]" : "top-[calc(100%+4px)]",
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                void onDuplicateProduct(product);
                                setOpenRowMenuId(null);
                              }}
                              className="w-full rounded-md px-2.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                            >
                              Duplicate
                            </button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {isFiltering
              ? `Showing ${products.length} matching products on this page`
              : `Showing ${firstItemIndex}-${lastItemIndex} of ${totalRecords} products`}
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1 || isLoading}
              className="h-8 rounded-md border border-slate-200 px-2.5 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            {visiblePageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => onPageChange(pageNumber)}
                disabled={isLoading}
                className={cn(
                  "grid size-8 place-items-center rounded-md border text-sm",
                  pageNumber === currentPage
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 text-slate-600 hover:bg-slate-100",
                  isLoading && "cursor-not-allowed opacity-50",
                )}
              >
                {pageNumber}
              </button>
            ))}

            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || isLoading}
              className="h-8 rounded-md border border-slate-200 px-2.5 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </Card>
    </section>
  );
}
