import { type FormEvent, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  Clock3,
  Eye,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";
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

type OrderStatus = "Pending" | "Processing" | "Shipped" | "Delivered";
type ModalMode = "create" | "edit";

interface OrderItemResponse {
  id: string;
  orderNumber: string;
  customerName: string;
  itemsCount: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
}

interface OrderFormValues {
  orderNumber: string;
  customerName: string;
  itemsCount: string;
  totalAmount: string;
  status: OrderStatus;
}

interface OrderFormErrors {
  orderNumber?: string;
  customerName?: string;
  itemsCount?: string;
  totalAmount?: string;
  status?: string;
}

interface MetricCardData {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  tone: "default" | "warning" | "success";
}

const ORDERS_PER_PAGE = 6;
const ORDER_STATUS_OPTIONS: OrderStatus[] = ["Pending", "Processing", "Shipped", "Delivered"];

const MOCK_ORDERS: OrderItemResponse[] = [
  {
    id: "ord-1",
    orderNumber: "ORD-7001",
    customerName: "Olivia Warren",
    itemsCount: 3,
    totalAmount: 1649,
    status: "Delivered",
    createdAt: "2026-04-01",
  },
  {
    id: "ord-2",
    orderNumber: "ORD-7002",
    customerName: "Mateo Silva",
    itemsCount: 1,
    totalAmount: 349,
    status: "Pending",
    createdAt: "2026-04-03",
  },
  {
    id: "ord-3",
    orderNumber: "ORD-7003",
    customerName: "Sophie Kim",
    itemsCount: 2,
    totalAmount: 698,
    status: "Processing",
    createdAt: "2026-04-04",
  },
  {
    id: "ord-4",
    orderNumber: "ORD-7004",
    customerName: "Noah Martins",
    itemsCount: 4,
    totalAmount: 2328,
    status: "Shipped",
    createdAt: "2026-04-05",
  },
  {
    id: "ord-5",
    orderNumber: "ORD-7005",
    customerName: "Emma Costa",
    itemsCount: 1,
    totalAmount: 229,
    status: "Delivered",
    createdAt: "2026-04-06",
  },
  {
    id: "ord-6",
    orderNumber: "ORD-7006",
    customerName: "Lucas Freitas",
    itemsCount: 2,
    totalAmount: 588,
    status: "Pending",
    createdAt: "2026-04-07",
  },
  {
    id: "ord-7",
    orderNumber: "ORD-7007",
    customerName: "Mia Pereira",
    itemsCount: 2,
    totalAmount: 898,
    status: "Processing",
    createdAt: "2026-04-08",
  },
];

const INITIAL_ORDER_FORM_VALUES: OrderFormValues = {
  orderNumber: "",
  customerName: "",
  itemsCount: "1",
  totalAmount: "",
  status: "Pending",
};

const integerFormatter = new Intl.NumberFormat("en-US");
const currencyNoDecimals = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const currencyWithDecimals = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function paginateItems<T>(items: T[], page: number, pageSize: number): T[] {
  const startIndex = (page - 1) * pageSize;
  return items.slice(startIndex, startIndex + pageSize);
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

function orderToFormValues(order: OrderItemResponse): OrderFormValues {
  return {
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    itemsCount: order.itemsCount.toString(),
    totalAmount: order.totalAmount.toString(),
    status: order.status,
  };
}

function validateOrderForm(
  values: OrderFormValues,
  existingOrders: OrderItemResponse[],
  editingOrderId?: string | null,
): OrderFormErrors {
  const errors: OrderFormErrors = {};
  const orderNumber = values.orderNumber.trim();
  const customerName = values.customerName.trim();
  const itemsCount = Number(values.itemsCount);
  const totalAmount = Number(values.totalAmount);

  if (!orderNumber) {
    errors.orderNumber = "Order number is required.";
  }

  if (!customerName) {
    errors.customerName = "Customer name is required.";
  }

  if (!Number.isInteger(itemsCount) || itemsCount <= 0) {
    errors.itemsCount = "Items count must be an integer greater than 0.";
  }

  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    errors.totalAmount = "Total amount must be greater than 0.";
  }

  const hasDuplicateOrderNumber = existingOrders.some((order) => {
    if (editingOrderId && order.id === editingOrderId) {
      return false;
    }

    return order.orderNumber.trim().toLowerCase() === orderNumber.toLowerCase();
  });

  if (hasDuplicateOrderNumber) {
    errors.orderNumber = "This order number already exists.";
  }

  return errors;
}

function formValuesToOrder(values: OrderFormValues, id?: string): OrderItemResponse {
  return {
    id: id ?? createLocalId("ord"),
    orderNumber: values.orderNumber.trim(),
    customerName: values.customerName.trim(),
    itemsCount: Number(values.itemsCount),
    totalAmount: Number(values.totalAmount),
    status: values.status,
    createdAt: new Date().toISOString().slice(0, 10),
  };
}

function getOrderStatusStyle(status: OrderStatus): string {
  if (status === "Delivered") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "Shipped") {
    return "bg-blue-100 text-blue-700";
  }

  if (status === "Processing") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-slate-200 text-slate-700";
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

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn("inline-flex h-6 items-center rounded-md px-2.5 text-xs font-medium", getOrderStatusStyle(status))}
    >
      {status}
    </span>
  );
}

function OrderFormModal({
  isOpen,
  mode,
  initialValues,
  existingOrders,
  editingOrderId,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  mode: ModalMode;
  initialValues: OrderFormValues;
  existingOrders: OrderItemResponse[];
  editingOrderId?: string | null;
  onClose: () => void;
  onSubmit: (values: OrderFormValues) => void;
}) {
  const [formValues, setFormValues] = useState<OrderFormValues>(initialValues);
  const [formErrors, setFormErrors] = useState<OrderFormErrors>({});

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormValues(initialValues);
    setFormErrors({});
  }, [isOpen, initialValues]);

  if (!isOpen) {
    return null;
  }

  function handleFieldChange(fieldName: keyof OrderFormValues, fieldValue: string) {
    setFormValues((currentFormValues) => ({
      ...currentFormValues,
      [fieldName]: fieldValue as OrderStatus,
    }));

    setFormErrors((currentErrors) => ({
      ...currentErrors,
      [fieldName]: undefined,
    }));
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateOrderForm(formValues, existingOrders, editingOrderId);

    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    onSubmit(formValues);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-3 py-6">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {mode === "create" ? "Add Order" : "Edit Order"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">Manage order data without backend dependency yet.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close modal"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4 px-5 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="order-number" className="mb-1.5 block text-sm font-medium text-slate-700">
                Order Number
              </label>
              <input
                id="order-number"
                type="text"
                value={formValues.orderNumber}
                onChange={(event) => handleFieldChange("orderNumber", event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                placeholder="ORD-7010"
              />
              {formErrors.orderNumber && <p className="mt-1 text-xs text-red-600">{formErrors.orderNumber}</p>}
            </div>

            <div>
              <label htmlFor="order-status" className="mb-1.5 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                id="order-status"
                value={formValues.status}
                onChange={(event) => handleFieldChange("status", event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
              >
                {ORDER_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="order-customer" className="mb-1.5 block text-sm font-medium text-slate-700">
              Customer Name
            </label>
            <input
              id="order-customer"
              type="text"
              value={formValues.customerName}
              onChange={(event) => handleFieldChange("customerName", event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
              placeholder="Sarah Jenkins"
            />
            {formErrors.customerName && <p className="mt-1 text-xs text-red-600">{formErrors.customerName}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="order-items" className="mb-1.5 block text-sm font-medium text-slate-700">
                Items Count
              </label>
              <input
                id="order-items"
                type="number"
                min="1"
                step="1"
                value={formValues.itemsCount}
                onChange={(event) => handleFieldChange("itemsCount", event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
              />
              {formErrors.itemsCount && <p className="mt-1 text-xs text-red-600">{formErrors.itemsCount}</p>}
            </div>

            <div>
              <label htmlFor="order-total" className="mb-1.5 block text-sm font-medium text-slate-700">
                Total Amount (USD)
              </label>
              <input
                id="order-total"
                type="number"
                min="0"
                step="0.01"
                value={formValues.totalAmount}
                onChange={(event) => handleFieldChange("totalAmount", event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
              />
              {formErrors.totalAmount && <p className="mt-1 text-xs text-red-600">{formErrors.totalAmount}</p>}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 rounded-lg border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button type="submit" className="h-10 rounded-lg bg-slate-900 px-4 text-white hover:bg-slate-800">
              {mode === "create" ? "Create Order" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OrderDetailsModal({
  order,
  isOpen,
  onClose,
}: {
  order: OrderItemResponse | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !order) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-3 py-6">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Order Details</h2>
            <p className="mt-1 text-sm text-slate-500">{order.orderNumber}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
          <div className="flex items-center justify-between">
            <span>Customer</span>
            <span className="font-medium text-slate-900">{order.customerName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Items</span>
            <span className="font-medium text-slate-900">{order.itemsCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Total</span>
            <span className="font-medium text-slate-900">{currencyWithDecimals.format(order.totalAmount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Status</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="flex items-center justify-between">
            <span>Date</span>
            <span className="font-medium text-slate-900">{order.createdAt}</span>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg bg-slate-900 px-4 text-white hover:bg-slate-800"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderItemResponse[]>(MOCK_ORDERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderItemResponse | null>(null);
  const [viewingOrder, setViewingOrder] = useState<OrderItemResponse | null>(null);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return orders;
    }

    return orders.filter((order) => {
      return (
        order.orderNumber.toLowerCase().includes(normalizedSearch) ||
        order.customerName.toLowerCase().includes(normalizedSearch) ||
        order.status.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [orders, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedOrders = useMemo(
    () => paginateItems(filteredOrders, currentPage, ORDERS_PER_PAGE),
    [filteredOrders, currentPage],
  );

  const orderMetricCards = useMemo<MetricCardData[]>(() => {
    const totalRevenue = orders.reduce((accumulator, order) => accumulator + order.totalAmount, 0);
    const pendingCount = orders.filter((order) => order.status === "Pending").length;
    const deliveredCount = orders.filter((order) => order.status === "Delivered").length;

    return [
      {
        title: "Total Orders",
        value: integerFormatter.format(orders.length),
        subtitle: "All orders in local frontend state",
        icon: ShoppingBag,
        tone: "default",
      },
      {
        title: "Pending Orders",
        value: integerFormatter.format(pendingCount),
        subtitle: "Waiting for fulfillment",
        icon: Clock3,
        tone: "warning",
      },
      {
        title: "Delivered Orders",
        value: integerFormatter.format(deliveredCount),
        subtitle: `${currencyNoDecimals.format(totalRevenue)} total revenue`,
        icon: CheckCircle2,
        tone: "success",
      },
    ];
  }, [orders]);

  const visiblePageNumbers = useMemo(
    () => getVisiblePageNumbers(totalPages, currentPage),
    [totalPages, currentPage],
  );

  function handleCreateOrder(values: OrderFormValues) {
    const newOrder = formValuesToOrder(values);
    setOrders((currentOrders) => [newOrder, ...currentOrders]);
    setCurrentPage(1);
    setIsCreateModalOpen(false);
  }

  function handleEditOrder(values: OrderFormValues) {
    if (!editingOrder) {
      return;
    }

    const updatedOrder = formValuesToOrder(values, editingOrder.id);
    setOrders((currentOrders) =>
      currentOrders.map((order) => (order.id === editingOrder.id ? updatedOrder : order)),
    );
    setEditingOrder(null);
  }

  return (
    <>
      <MetricsGrid metricCards={orderMetricCards} />

      <Card className="gap-0 rounded-xl border border-slate-200 bg-white py-0 shadow-sm ring-0">
        <CardHeader className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900">Orders List</CardTitle>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-[240px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search Orders..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <Button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="h-9 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus className="size-4" />
              Add Order
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Order
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Customer
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Items
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Total
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Status
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Date
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    No orders found for this filter.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-slate-50">
                    <TableCell className="px-4 py-3 font-medium text-slate-700">{order.orderNumber}</TableCell>
                    <TableCell className="px-4 py-3 text-slate-900">{order.customerName}</TableCell>
                    <TableCell className="px-4 py-3 text-slate-700">{order.itemsCount}</TableCell>
                    <TableCell className="px-4 py-3 text-slate-700">
                      {currencyWithDecimals.format(order.totalAmount)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="px-4 py-3 text-slate-700">{order.createdAt}</TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewingOrder(order)}
                          className="size-8 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingOrder(order)}
                          className="size-8 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil className="size-4" />
                        </Button>
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
            Showing {filteredOrders.length === 0 ? 0 : (currentPage - 1) * ORDERS_PER_PAGE + 1}-
            {Math.min(currentPage * ORDERS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length} orders
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="h-8 rounded-md border border-slate-200 px-2.5 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            {visiblePageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setCurrentPage(pageNumber)}
                className={cn(
                  "grid size-8 place-items-center rounded-md border text-sm",
                  pageNumber === currentPage
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 text-slate-600 hover:bg-slate-100",
                )}
              >
                {pageNumber}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="h-8 rounded-md border border-slate-200 px-2.5 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </Card>

      <OrderFormModal
        isOpen={isCreateModalOpen}
        mode="create"
        initialValues={INITIAL_ORDER_FORM_VALUES}
        existingOrders={orders}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateOrder}
      />

      <OrderFormModal
        isOpen={Boolean(editingOrder)}
        mode="edit"
        initialValues={editingOrder ? orderToFormValues(editingOrder) : INITIAL_ORDER_FORM_VALUES}
        existingOrders={orders}
        editingOrderId={editingOrder?.id ?? null}
        onClose={() => setEditingOrder(null)}
        onSubmit={handleEditOrder}
      />

      <OrderDetailsModal
        order={viewingOrder}
        isOpen={Boolean(viewingOrder)}
        onClose={() => setViewingOrder(null)}
      />
    </>
  );
}
