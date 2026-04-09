import "@fontsource-variable/geist/index.css";
import { useState } from "react";
import { Toaster } from "sonner";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import type { AppPage } from "@/types/app-page";
import { PAGE_TITLES } from "@/types/app-page";
import Dashboard from "./Dashboard.tsx";
import CustomersPage from "./pages/CustomersPage.tsx";
import OrdersPage from "./pages/OrdersPage.tsx";
import ProductsPage from "./pages/ProductsPage.tsx";
import SettingsPage from "./pages/SettingsPage.tsx";

export default function App() {
  const [activePage, setActivePage] = useState<AppPage>("dashboard");

  function renderPage() {
    if (activePage === "dashboard") {
      return <Dashboard />;
    }

    if (activePage === "products") {
      return <ProductsPage />;
    }

    if (activePage === "orders") {
      return <OrdersPage />;
    }

    if (activePage === "customers") {
      return <CustomersPage />;
    }

    return <SettingsPage />;
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 font-[Geist_Variable] text-left text-slate-900">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <Sidebar activePage={activePage} onPageChange={setActivePage} />

        <main className="min-w-0 flex-1">
          <Header title={PAGE_TITLES[activePage]} />

          <div className="space-y-4 p-3 sm:p-4 md:p-6">{renderPage()}</div>
        </main>
      </div>

      <Toaster position="bottom-right" richColors />
    </div>
  );
}
