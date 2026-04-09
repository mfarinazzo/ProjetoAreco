import { type FormEvent, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  DollarSign,
  Mail,
  Pencil,
  Search,
  Shield,
  Trash2,
  UserPlus,
  Users,
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

type CustomerTier = "Standard" | "VIP";
type ModalMode = "create" | "edit";

interface CustomerItemResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: CustomerTier;
  totalOrders: number;
  totalSpent: number;
}

interface CustomerFormValues {
  name: string;
  email: string;
  phone: string;
  tier: CustomerTier;
}

interface CustomerFormErrors {
  name?: string;
  email?: string;
  phone?: string;
}

interface MetricCardData {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  tone: "default" | "warning" | "success";
}

const CUSTOMERS_PER_PAGE = 6;
const CUSTOMER_TIER_OPTIONS: CustomerTier[] = ["Standard", "VIP"];

const MOCK_CUSTOMERS: CustomerItemResponse[] = [
  {
    id: "cus-1",
    name: "Olivia Warren",
    email: "olivia@northstar.com",
    phone: "+1 (415) 245-9020",
    tier: "VIP",
    totalOrders: 16,
    totalSpent: 12780,
  },
  {
    id: "cus-2",
    name: "Mateo Silva",
    email: "mateo@solaris.io",
    phone: "+55 (11) 98211-5520",
    tier: "Standard",
    totalOrders: 6,
    totalSpent: 3610,
  },
  {
    id: "cus-3",
    name: "Sophie Kim",
    email: "sophie@delta.co",
    phone: "+1 (212) 774-6602",
    tier: "VIP",
    totalOrders: 11,
    totalSpent: 9015,
  },
  {
    id: "cus-4",
    name: "Noah Martins",
    email: "noah@loom.com",
    phone: "+55 (21) 97410-3314",
    tier: "Standard",
    totalOrders: 4,
    totalSpent: 2190,
  },
  {
    id: "cus-5",
    name: "Emma Costa",
    email: "emma@aurora.dev",
    phone: "+55 (31) 99600-4100",
    tier: "VIP",
    totalOrders: 9,
    totalSpent: 7340,
  },
  {
    id: "cus-6",
    name: "Lucas Freitas",
    email: "lucas@argonlabs.io",
    phone: "+55 (11) 97300-7712",
    tier: "Standard",
    totalOrders: 5,
    totalSpent: 2840,
  },
];

const INITIAL_CUSTOMER_FORM_VALUES: CustomerFormValues = {
  name: "",
  email: "",
  phone: "",
  tier: "Standard",
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

function customerToFormValues(customer: CustomerItemResponse): CustomerFormValues {
  return {
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    tier: customer.tier,
  };
}

function validateCustomerForm(
  values: CustomerFormValues,
  existingCustomers: CustomerItemResponse[],
  editingCustomerId?: string | null,
): CustomerFormErrors {
  const errors: CustomerFormErrors = {};
  const name = values.name.trim();
  const email = values.email.trim().toLowerCase();
  const phone = values.phone.trim();

  if (!name) {
    errors.name = "Name is required.";
  }

  if (!email || !email.includes("@")) {
    errors.email = "A valid e-mail is required.";
  }

  if (!phone) {
    errors.phone = "Phone is required.";
  }

  const hasDuplicateEmail = existingCustomers.some((customer) => {
    if (editingCustomerId && customer.id === editingCustomerId) {
      return false;
    }

    return customer.email.trim().toLowerCase() === email;
  });

  if (hasDuplicateEmail) {
    errors.email = "This e-mail already belongs to another customer.";
  }

  return errors;
}

function formValuesToCustomer(values: CustomerFormValues, id?: string): CustomerItemResponse {
  return {
    id: id ?? createLocalId("cus"),
    name: values.name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    tier: values.tier,
    totalOrders: id ? 0 : 1,
    totalSpent: 0,
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

function CustomerTierBadge({ tier }: { tier: CustomerTier }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-md px-2.5 text-xs font-medium",
        tier === "VIP" ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-700",
      )}
    >
      {tier}
    </span>
  );
}

function CustomerFormModal({
  isOpen,
  mode,
  initialValues,
  existingCustomers,
  editingCustomerId,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  mode: ModalMode;
  initialValues: CustomerFormValues;
  existingCustomers: CustomerItemResponse[];
  editingCustomerId?: string | null;
  onClose: () => void;
  onSubmit: (values: CustomerFormValues) => void;
}) {
  const [formValues, setFormValues] = useState<CustomerFormValues>(initialValues);
  const [formErrors, setFormErrors] = useState<CustomerFormErrors>({});

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

  function handleFieldChange(fieldName: keyof CustomerFormValues, fieldValue: string) {
    setFormValues((currentFormValues) => ({
      ...currentFormValues,
      [fieldName]: fieldValue as CustomerTier,
    }));

    setFormErrors((currentErrors) => ({
      ...currentErrors,
      [fieldName]: undefined,
    }));
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateCustomerForm(formValues, existingCustomers, editingCustomerId);

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
              {mode === "create" ? "Add Customer" : "Edit Customer"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">Maintain customers in local frontend storage.</p>
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
          <div>
            <label htmlFor="customer-name" className="mb-1.5 block text-sm font-medium text-slate-700">
              Full Name
            </label>
            <input
              id="customer-name"
              type="text"
              value={formValues.name}
              onChange={(event) => handleFieldChange("name", event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
              placeholder="Sarah Jenkins"
            />
            {formErrors.name && <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="customer-email" className="mb-1.5 block text-sm font-medium text-slate-700">
                E-mail
              </label>
              <input
                id="customer-email"
                type="email"
                value={formValues.email}
                onChange={(event) => handleFieldChange("email", event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                placeholder="sarah@company.com"
              />
              {formErrors.email && <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="customer-phone" className="mb-1.5 block text-sm font-medium text-slate-700">
                Phone
              </label>
              <input
                id="customer-phone"
                type="text"
                value={formValues.phone}
                onChange={(event) => handleFieldChange("phone", event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
                placeholder="+55 (11) 90000-0000"
              />
              {formErrors.phone && <p className="mt-1 text-xs text-red-600">{formErrors.phone}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="customer-tier" className="mb-1.5 block text-sm font-medium text-slate-700">
              Tier
            </label>
            <select
              id="customer-tier"
              value={formValues.tier}
              onChange={(event) => handleFieldChange("tier", event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
            >
              {CUSTOMER_TIER_OPTIONS.map((tier) => (
                <option key={tier} value={tier}>
                  {tier}
                </option>
              ))}
            </select>
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
              {mode === "create" ? "Create Customer" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItemResponse[]>(MOCK_CUSTOMERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerItemResponse | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerItemResponse | null>(null);

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return customers;
    }

    return customers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(normalizedSearch) ||
        customer.email.toLowerCase().includes(normalizedSearch) ||
        customer.phone.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [customers, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / CUSTOMERS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedCustomers = useMemo(
    () => paginateItems(filteredCustomers, currentPage, CUSTOMERS_PER_PAGE),
    [filteredCustomers, currentPage],
  );

  const customerMetricCards = useMemo<MetricCardData[]>(() => {
    const vipCount = customers.filter((customer) => customer.tier === "VIP").length;
    const totalLifetimeValue = customers.reduce((accumulator, customer) => accumulator + customer.totalSpent, 0);

    return [
      {
        title: "Customers",
        value: integerFormatter.format(customers.length),
        subtitle: "Active customer records",
        icon: Users,
        tone: "default",
      },
      {
        title: "VIP Segment",
        value: integerFormatter.format(vipCount),
        subtitle: "High-value customers",
        icon: Shield,
        tone: "success",
      },
      {
        title: "Lifetime Value",
        value: currencyNoDecimals.format(totalLifetimeValue),
        subtitle: "Aggregated customer spend",
        icon: DollarSign,
        tone: "default",
      },
    ];
  }, [customers]);

  const visiblePageNumbers = useMemo(
    () => getVisiblePageNumbers(totalPages, currentPage),
    [totalPages, currentPage],
  );

  function handleCreateCustomer(values: CustomerFormValues) {
    const newCustomer = formValuesToCustomer(values);
    setCustomers((currentCustomers) => [newCustomer, ...currentCustomers]);
    setCurrentPage(1);
    setIsCreateModalOpen(false);
  }

  function handleEditCustomer(values: CustomerFormValues) {
    if (!editingCustomer) {
      return;
    }

    const updatedCustomer: CustomerItemResponse = {
      ...editingCustomer,
      ...formValuesToCustomer(values, editingCustomer.id),
      totalOrders: editingCustomer.totalOrders,
      totalSpent: editingCustomer.totalSpent,
    };

    setCustomers((currentCustomers) =>
      currentCustomers.map((customer) =>
        customer.id === editingCustomer.id ? updatedCustomer : customer,
      ),
    );
    setEditingCustomer(null);
  }

  function handleDeleteCustomer() {
    if (!deletingCustomer) {
      return;
    }

    setCustomers((currentCustomers) =>
      currentCustomers.filter((customer) => customer.id !== deletingCustomer.id),
    );
    setDeletingCustomer(null);
  }

  return (
    <>
      <MetricsGrid metricCards={customerMetricCards} />

      <Card className="gap-0 rounded-xl border border-slate-200 bg-white py-0 shadow-sm ring-0">
        <CardHeader className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900">Customers List</CardTitle>

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
                placeholder="Search Customers..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            <Button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="h-9 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              <UserPlus className="size-4" />
              Add Customer
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Name
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Contact
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Tier
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Orders
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Total Spent
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    No customers found for this filter.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCustomers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-slate-50">
                    <TableCell className="px-4 py-3 font-medium text-slate-900">{customer.name}</TableCell>
                    <TableCell className="px-4 py-3 text-slate-700">
                      <div className="space-y-0.5">
                        <p className="flex items-center gap-1.5 text-sm">
                          <Mail className="size-3.5 text-slate-400" />
                          {customer.email}
                        </p>
                        <p className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Bell className="size-3.5 text-slate-400" />
                          {customer.phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <CustomerTierBadge tier={customer.tier} />
                    </TableCell>
                    <TableCell className="px-4 py-3 text-slate-700">{customer.totalOrders}</TableCell>
                    <TableCell className="px-4 py-3 text-slate-700">
                      {currencyWithDecimals.format(customer.totalSpent)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingCustomer(customer)}
                          className="size-8 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingCustomer(customer)}
                          className="size-8 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Trash2 className="size-4" />
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
            Showing {filteredCustomers.length === 0 ? 0 : (currentPage - 1) * CUSTOMERS_PER_PAGE + 1}-
            {Math.min(currentPage * CUSTOMERS_PER_PAGE, filteredCustomers.length)} of {filteredCustomers.length}
            customers
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

      <CustomerFormModal
        isOpen={isCreateModalOpen}
        mode="create"
        initialValues={INITIAL_CUSTOMER_FORM_VALUES}
        existingCustomers={customers}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateCustomer}
      />

      <CustomerFormModal
        isOpen={Boolean(editingCustomer)}
        mode="edit"
        initialValues={editingCustomer ? customerToFormValues(editingCustomer) : INITIAL_CUSTOMER_FORM_VALUES}
        existingCustomers={customers}
        editingCustomerId={editingCustomer?.id ?? null}
        onClose={() => setEditingCustomer(null)}
        onSubmit={handleEditCustomer}
      />

      {deletingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-3 py-6">
          <div className="absolute inset-0" onClick={() => setDeletingCustomer(null)} />

          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-900">Delete Customer</h2>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to remove <span className="font-semibold text-slate-900">{deletingCustomer.name}</span>
              ?
            </p>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingCustomer(null)}
                className="h-10 rounded-lg border-slate-200 bg-white px-4 text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleDeleteCustomer}
                className="h-10 rounded-lg bg-red-600 px-4 text-white hover:bg-red-700"
              >
                Delete Customer
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
