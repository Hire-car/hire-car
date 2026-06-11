"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  GitBranch,
  Car,
  MessageSquare,
  BarChart3,
  CreditCard,
  Settings,
  LayoutGrid,
  Users,
  List,
  AlertTriangle,
  ClipboardList,
  Star,
  ExternalLink,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

const vendorLinks = [
  { label: "Dashboard", href: "/vendor/dashboard", icon: LayoutDashboard },
  { label: "Branches", href: "/vendor/branches", icon: GitBranch },
  { label: "Vehicles", href: "/vendor/vehicles", icon: Car },
  { label: "Leads", href: "/vendor/leads", icon: MessageSquare },
  { label: "Analytics", href: "/vendor/analytics", icon: BarChart3 },
  { label: "Billing", href: "/vendor/billing", icon: CreditCard },
  { label: "Settings", href: "/vendor/settings", icon: Settings },
];

const adminLinks = [
  { label: "Overview", href: "/admin", icon: LayoutGrid },
  { label: "Vendors", href: "/admin/vendors", icon: Users },
  { label: "Branches", href: "/admin/branches", icon: GitBranch },
  { label: "Listings", href: "/admin/listings", icon: List },
  { label: "Featured", href: "/admin/featured", icon: Star },
  { label: "Leads", href: "/admin/leads", icon: MessageSquare },
  { label: "Billing", href: "/admin/billing", icon: CreditCard },
  { label: "Reviews", href: "/admin/reviews", icon: ClipboardList },
  { label: "Fraud", href: "/admin/fraud", icon: AlertTriangle },
  { label: "Audit", href: "/admin/audit", icon: ClipboardList },
  { label: "WhatsApp", href: "/admin/whatsapp", icon: MessageSquare },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

function ProfileDropdown({ onLogout }: { onLogout: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("Loading...");
  const [initial, setInitial] = useState("U");

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setEmail(data.user.email);
        setInitial(data.user.email.charAt(0).toUpperCase());
      } else {
        setEmail("Account");
      }
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pr-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/20"
      >
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
          {initial}
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 rounded-2xl bg-white border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <p className="text-sm font-bold text-slate-900">Signed In As</p>
            <p className="text-xs font-medium text-slate-500 mt-0.5 truncate">{email}</p>
          </div>
          <div className="p-2">
            <Link href="/vendor/settings" onClick={() => setIsOpen(false)} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
              <Settings className="h-4 w-4 text-slate-400" />
              Account Settings
            </Link>
          </div>
          <div className="p-2 border-t border-slate-100">
            <button onClick={onLogout} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors">
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function DashboardShell({
  children,
  mode,
}: {
  children: ReactNode;
  mode: "vendor" | "admin";
}) {
  const pathname = usePathname();
  const links = mode === "vendor" ? vendorLinks : adminLinks;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close drawer on route change
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      setDrawerOpen(false);
    }
  }, [pathname]);

  // Close drawer on Escape key
  useEffect(() => {
    if (!drawerOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen]);

  // Focus trap inside drawer
  useEffect(() => {
    if (!drawerOpen || !drawerRef.current) return;

    const drawer = drawerRef.current;
    const focusableElements = drawer.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const firstEl = focusableElements[0];
      const lastEl = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [drawerOpen]);

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const isLinkActive = useCallback(
    (href: string) => {
      if (mode === "vendor" && href === "/vendor/dashboard") {
        return pathname === href;
      }
      if (mode === "admin" && href === "/admin") {
        return pathname === href;
      }
      return pathname === href || pathname.startsWith(href + "/");
    },
    [pathname, mode]
  );

  const navContent = (
    <>
      <div className="mb-4 px-3">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
          Navigation
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        {links.map(({ label, href, icon: Icon }) => {
          const isActive = isLinkActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-3 rounded-xl px-4 min-h-[44px] text-sm font-bold transition-all duration-300 ${
                isActive
                  ? "bg-orange-50 text-[#ea580c] shadow-sm relative overflow-hidden"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-0 bottom-0 w-1 bg-[#ea580c] rounded-r-md"></span>
              )}
              <Icon className={`h-5 w-5 shrink-0 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110 group-hover:text-slate-700"}`} />
              <span className="transform transition-transform duration-300 group-hover:translate-x-1">{label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="mx-auto flex w-full items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            {/* Mobile hamburger button */}
            <button
              ref={triggerRef}
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center justify-center h-10 w-10 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors md:hidden"
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
              aria-controls="mobile-nav-drawer"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link
              href="/"
              className="flex items-center gap-3 group"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ea580c] to-amber-500 text-white shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform duration-300">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <span className="hidden sm:block text-xl font-black tracking-tight text-slate-900">
                HireCar <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">{mode === "admin" ? "Admin" : "Vendor"}</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/search"
              className="hidden sm:flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-[#ea580c] transition-colors bg-white hover:bg-orange-50 px-4 py-2 rounded-xl border border-slate-200 hover:border-orange-200 shadow-sm group"
            >
              <span>Public marketplace</span>
              <ExternalLink className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
            
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            
            <button className="relative p-2.5 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors border border-transparent hover:border-slate-200">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse"></span>
            </button>
            
            {/* Custom Dropdown */}
            <ProfileDropdown onLogout={handleLogout} />
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          aria-hidden="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setDrawerOpen(false);
              triggerRef.current?.focus();
            }}
          />
          {/* Drawer panel */}
          <div
            ref={drawerRef}
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`${mode === "admin" ? "Admin" : "Vendor"} navigation`}
            className="absolute left-0 top-0 h-full w-[280px] max-w-[80vw] bg-white border-r border-slate-100 shadow-2xl animate-in slide-in-from-left duration-300"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#ea580c] to-amber-500 text-white shadow-md">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <span className="text-base font-black tracking-tight text-slate-900">
                  {mode === "admin" ? "Admin Panel" : "Vendor Portal"}
                </span>
              </div>
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  triggerRef.current?.focus();
                }}
                className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="p-4 h-[calc(100vh-73px)] overflow-y-auto">
              {navContent}
            </nav>
          </div>
        </div>
      )}

      {/* Main layout with sidebar */}
      <div
        className="mx-auto w-full px-4 py-8 sm:px-6 lg:px-8"
        inert={drawerOpen || undefined}
      >
        <div className="flex flex-col md:flex-row gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden md:block w-[260px] shrink-0">
            <div className="sticky top-24 rounded-2xl border border-slate-200/60 bg-white/60 backdrop-blur-xl shadow-sm p-4 h-[calc(100vh-8rem)] overflow-y-auto hidden-scrollbar">
              <nav>{navContent}</nav>
            </div>
          </aside>

          {/* Content area */}
          <main className="min-w-0 w-full flex-1">{children}</main>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hidden-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hidden-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
