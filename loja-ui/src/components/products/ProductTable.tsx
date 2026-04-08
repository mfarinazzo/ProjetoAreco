import { useEffect, useMemo, useRef, useState } from "react";
import { MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { ProductItemResponse } from "@/components/products/types";
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

const LOW_STOCK_THRESHOLD = 25;
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
  onSearchTermChange: (value: string) => void;
  onPageChange: (nextPage: number) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (product: ProductItemResponse) => void;
  onOpenDeleteModal: (product: ProductItemResponse) => void;
  onDuplicateProduct: (product: ProductItemResponse) => Promise<void>;
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
  const isLowStock = stockQuantity <= LOW_STOCK_THRESHOLD;

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
  onSearchTermChange,
  onPageChange,
  onOpenAddModal,
  onOpenEditModal,
  onOpenDeleteModal,
  onDuplicateProduct,
}: ProductTableProps) {
  const [openRowMenuId, setOpenRowMenuId] = useState<string | null>(null);
  const rowMenuContainerRef = useRef<HTMLDivElement>(null);

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
              onClick={onOpenAddModal}
              className="h-9 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus className="size-4" />
              Add Product
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
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
                  Price
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Stock Quantity
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
                  <TableCell colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    {isLoading ? "Loading products..." : "No products found for this filter."}
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id} className="hover:bg-slate-50">
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
                          onClick={() =>
                            setOpenRowMenuId((currentId) => (currentId === product.id ? null : product.id))
                          }
                          className="size-8 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>

                        {openRowMenuId === product.id && (
                          <div className="absolute right-0 top-[calc(100%+4px)] z-30 w-40 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
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
