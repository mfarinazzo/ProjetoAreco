import {
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppPage } from "@/types/app-page";

interface SidebarNavigationItem {
  key: AppPage;
  label: string;
  icon: LucideIcon;
}

const SIDEBAR_ITEMS: SidebarNavigationItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "products", label: "Products", icon: Package },
  { key: "orders", label: "Orders", icon: ShoppingBag },
  { key: "customers", label: "Customers", icon: Users },
  { key: "settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  activePage: AppPage;
  onPageChange: (page: AppPage) => void;
}

export function Sidebar({ activePage, onPageChange }: SidebarProps) {
  return (
    <aside className="w-full shrink-0 border-b border-slate-800 bg-slate-900 text-slate-300 lg:w-60 lg:border-r lg:border-b-0">
      <div className="flex h-14 items-center px-4 lg:h-16 lg:px-6">
        <div className="h-0 w-0 border-x-[9px] border-b-[16px] border-x-transparent border-b-slate-100" />
      </div>

      <nav className="px-3 pb-3 lg:flex-1 lg:py-2">
        <ul className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:block lg:space-y-1">
          {SIDEBAR_ITEMS.map((item) => {
            const IconComponent = item.icon;

            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => onPageChange(item.key)}
                  className={cn(
                    "flex h-10 w-full items-center justify-start gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors",
                    activePage === item.key
                      ? "bg-slate-800 text-white"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white",
                  )}
                >
                  <IconComponent className="size-4" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
