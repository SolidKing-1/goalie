// components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, CreditCard, PieChart, Target, Search,
  Bell, Settings, LogOut, Crosshair,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard",     label: "Dashboard",      icon: LayoutDashboard },
  { href: "/subscriptions", label: "Subscriptions",  icon: CreditCard },
  { href: "/budgeting",     label: "Budget",         icon: PieChart },
  { href: "/goals",         label: "Goals",          icon: Target },
  { href: "/scanning",      label: "Usage Scan",     icon: Search },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col bg-surface-2 border-r border-border z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
          <Crosshair className="w-5 h-5 text-surface" strokeWidth={2.5} />
        </div>
        <div>
          <span className="font-semibold text-ink text-sm tracking-tight">Project Goalie</span>
          <p className="text-xs text-muted">Subscription Manager</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-accent text-surface"
                  : "text-muted hover:text-ink hover:bg-surface-3"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-border space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-ink hover:bg-surface-3 transition-all"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-danger hover:bg-surface-3 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
