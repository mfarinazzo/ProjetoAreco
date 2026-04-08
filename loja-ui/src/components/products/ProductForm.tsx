import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import { z } from "zod";
import { PRODUCT_CATEGORIES } from "@/constants/categories";
import type { ProductCategory } from "@/constants/categories";
import { Button } from "@/components/ui/button";

const skuPattern = /^[A-Za-z0-9-]+$/;

export const productFormSchema = z
  .object({
    sku: z
      .string()
      .trim()
      .min(3, "SKU must have at least 3 characters.")
      .max(64, "SKU must have at most 64 characters.")
      .regex(skuPattern, "SKU must contain only letters, numbers, and hyphens."),
    name: z
      .string()
      .trim()
      .min(1, "Product name is required.")
      .max(120, "Product name must have at most 120 characters."),
    category: z.enum(PRODUCT_CATEGORIES),
    price: z.coerce.number().min(0, "Price must be equal to or greater than 0."),
    stockQuantity: z.coerce
      .number()
      .int("Stock quantity must be a whole number.")
      .min(0, "Stock quantity must be equal to or greater than 0."),
  })
  .superRefine((value, context) => {
    if (value.category === "Electronics" && value.price < 50) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["price"],
        message: "Products in Electronics must have a price of at least 50.00.",
      });
    }
  });

type ProductFormInputValues = z.input<typeof productFormSchema>;
export type ProductFormValues = z.output<typeof productFormSchema>;
export type ProductFormMode = "create" | "edit";

export const INITIAL_PRODUCT_FORM_VALUES: ProductFormValues = {
  sku: "",
  name: "",
  category: PRODUCT_CATEGORIES[0],
  price: 0,
  stockQuantity: 0,
};

interface ProductFormProps {
  isOpen: boolean;
  mode: ProductFormMode;
  initialValues: ProductFormValues;
  onClose: () => void;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function ProductForm({
  isOpen,
  mode,
  initialValues,
  onClose,
  onSubmit,
  isSubmitting,
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormInputValues, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    if (isOpen) {
      reset(initialValues);
    }
  }, [initialValues, isOpen, reset]);

  if (!isOpen) {
    return null;
  }

  async function submit(values: ProductFormValues) {
    await onSubmit(values);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-3 py-6">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {mode === "create" ? "Add Product" : "Edit Product"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === "create"
                ? "Create a product following the backend contract."
                : "Update product fields while preserving the data contract."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close modal"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(submit)} className="space-y-4 px-5 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="product-sku" className="mb-1.5 block text-sm font-medium text-slate-700">
                SKU
              </label>
              <input
                id="product-sku"
                type="text"
                {...register("sku")}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                placeholder="PROD-1099"
              />
              {errors.sku && <p className="mt-1 text-xs text-red-600">{errors.sku.message}</p>}
            </div>

            <div>
              <label htmlFor="product-category" className="mb-1.5 block text-sm font-medium text-slate-700">
                Category
              </label>
              <select
                id="product-category"
                {...register("category")}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
              >
                {PRODUCT_CATEGORIES.map((category: ProductCategory) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="product-name" className="mb-1.5 block text-sm font-medium text-slate-700">
              Product Name
            </label>
            <input
              id="product-name"
              type="text"
              {...register("name")}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
              placeholder="AeroFlow 12"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="product-price" className="mb-1.5 block text-sm font-medium text-slate-700">
                Price (USD)
              </label>
              <input
                id="product-price"
                type="number"
                min="0"
                step="0.01"
                {...register("price")}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                placeholder="199.99"
              />
              {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price.message}</p>}
            </div>

            <div>
              <label htmlFor="product-stock" className="mb-1.5 block text-sm font-medium text-slate-700">
                Stock Quantity
              </label>
              <input
                id="product-stock"
                type="number"
                min="0"
                step="1"
                {...register("stockQuantity")}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                placeholder="80"
              />
              {errors.stockQuantity && (
                <p className="mt-1 text-xs text-red-600">{errors.stockQuantity.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
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
              type="submit"
              disabled={isSubmitting}
              className="h-10 rounded-lg bg-slate-900 px-4 text-white hover:bg-slate-800"
            >
              {isSubmitting
                ? mode === "create"
                  ? "Creating..."
                  : "Saving..."
                : mode === "create"
                  ? "Create Product"
                  : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
