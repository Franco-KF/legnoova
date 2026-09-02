"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  LineChart,
  History,
  Star,
  CreditCard,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/app/analyze", label: "Analyze", icon: LineChart },
  { href: "/app/history", label: "History", icon: History },
  { href: "/app/watchlist", label: "Watchlist", icon: Star },
  { href: "/app/billing", label: "Billing", icon: CreditCard },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

interface SidebarContentProps {
  pathname: string;
  collapsed: boolean;
  onToggleCollapse?: () => void;
  onNavigate: () => void;
  name: string;
  email: string;
  initials: string;
  showCollapse: boolean;
  compact: boolean;
}

function SidebarContent({
  pathname,
  collapsed,
  onToggleCollapse,
  onNavigate,
  name,
  email,
  initials,
  showCollapse,
  compact,
}: SidebarContentProps) {
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href) && pathname !== "/app";

  return (
    <>
      {/* Logo area */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-white/[0.06] px-4",
          compact && "justify-center"
        )}
      >
        <Link href="/app" aria-label="Legnoova home" onClick={onNavigate}>
          <Logo showText={false} />
        </Link>
        {!compact && (
          <span className="ml-2.5 font-heading text-lg font-bold">
            Legnoova
          </span>
        )}
        {showCollapse && (
          <button
            onClick={onToggleCollapse}
            className="ml-auto hidden rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground lg:block"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed && "rotate-180"
              )}
            />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
                compact && "justify-center px-0"
              )}
              title={compact ? item.label : undefined}
            >
              <item.icon
                className={cn("h-5 w-5 shrink-0", active && "text-emerald-400")}
              />
              {!compact && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Usage meter */}
      {!compact && (
        <div className="mx-3 mb-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Analyses this month</span>
            <span className="font-mono text-emerald-400">—</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
              style={{ width: "0%" }}
            />
          </div>
        </div>
      )}

      {/* User section */}
      <div
        className={cn(
          "flex items-center gap-3 border-t border-white/[0.06] px-4 py-4",
          compact && "justify-center px-2"
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-semibold text-emerald-400 ring-2 ring-emerald-500/30">
          {initials}
        </div>
        {!compact && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {name || "User"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {email || ""}
            </p>
          </div>
        )}
        {!compact && (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-red-400"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const user = session?.user;
  const name = user?.name || "";
  const email = user?.email || "";
  const initials =
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:flex-col border-r border-white/[0.06] bg-background transition-all duration-200",
          collapsed ? "lg:w-[72px]" : "lg:w-[240px]"
        )}
      >
        <SidebarContent
          pathname={pathname}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          onNavigate={() => {}}
          name={name}
          email={email}
          initials={initials}
          showCollapse
          compact={collapsed}
        />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeMobile}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-white/[0.06] bg-background">
            <div className="flex h-16 items-center justify-between border-b border-white/[0.06] px-4">
              <Link href="/app" onClick={closeMobile}>
                <Logo />
              </Link>
              <button
                onClick={closeMobile}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/[0.06]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent
              pathname={pathname}
              collapsed={false}
              onNavigate={closeMobile}
              name={name}
              email={email}
              initials={initials}
              showCollapse={false}
              compact={false}
            />
          </aside>
        </div>
      )}

      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-background/80 backdrop-blur-xl lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Spacer for sidebar */}
      <div
        className={cn(
          "hidden lg:block shrink-0 transition-all duration-200",
          collapsed ? "w-[72px]" : "w-[240px]"
        )}
      />
    </>
  );
}
