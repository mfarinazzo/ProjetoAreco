import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, LogOut, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
      <h1 className="text-3xl font-semibold leading-none tracking-tight text-slate-900 sm:text-[40px]">
        {title}
      </h1>

      <div className="relative ml-auto" ref={profileMenuRef}>
        <button
          type="button"
          onClick={() => setIsProfileMenuOpen((currentValue) => !currentValue)}
          className="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-slate-100"
        >
          <div className="grid size-9 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
            SJ
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-slate-900">Sarah Jenkins</p>
            <p className="text-xs text-slate-500">Admin</p>
          </div>
          <ChevronDown
            className={cn("size-4 text-slate-500 transition-transform", isProfileMenuOpen && "rotate-180")}
          />
        </button>

        {isProfileMenuOpen && (
          <div className="absolute right-0 top-[calc(100%+10px)] z-40 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              <UserCircle2 className="size-4" />
              My Profile
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              <Bell className="size-4" />
              Notifications
            </button>
            <div className="my-1 border-t border-slate-100" />
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
