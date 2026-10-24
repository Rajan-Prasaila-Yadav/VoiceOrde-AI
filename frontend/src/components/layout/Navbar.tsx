"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Mic,
  Package,
  ClipboardList,
  Store,
  Settings,
  User,
  ShieldCheck,
  ArrowLeftRight,
} from "lucide-react";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { useRole } from "@/context/RoleContext";

export function Navbar() {
  const pathname = usePathname();
  const { role, toggleRole, isAdmin } = useRole();

  const customerLinks = [
    { label: "Voice Order Desk", href: "/", icon: Mic },
    { label: "My Orders & Bills", href: "/my-orders", icon: ClipboardList },
    { label: "My Profile", href: "/profile/complete", icon: User },
  ];

  const adminLinks = [
    { label: "Order Desk (Call Record)", href: "/", icon: Mic },
    { label: "Live Orders & Status", href: "/admin/orders", icon: ClipboardList },
    { label: "Catalogue & Stock", href: "/admin/products", icon: Package },
    { label: "Store Settings", href: "/admin/settings", icon: Settings },
  ];

  const currentNav = isAdmin ? adminLinks : customerLinks;

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white block leading-tight">
              VoiceOrder AI
            </span>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate max-w-[130px] sm:max-w-none">
              Sharma Kirana • Live Inventory
            </p>
          </div>
        </Link>

        {/* Center / Navigation Tabs (Desktop) */}
        <nav className="hidden md:flex items-center gap-1">
          {currentNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Action Bar: Quick Role Switcher + Google Login */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Quick Role Switcher Pill */}
          <button
            onClick={toggleRole}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs ${
              isAdmin
                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700/60 hover:bg-amber-100"
                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700/60 hover:bg-emerald-100"
            }`}
            title={`Currently in ${role} mode. Click to toggle between Customer and Admin.`}
          >
            {isAdmin ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="hidden sm:inline">Admin Mode</span>
                <span className="sm:hidden">Admin</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="hidden sm:inline">Customer Mode</span>
                <span className="sm:hidden">Customer</span>
              </>
            )}
            <ArrowLeftRight className="w-3 h-3 text-slate-400 opacity-70" />
          </button>

          {/* User Auth */}
          <div className="pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
            <GoogleLoginButton />
          </div>
        </div>
      </div>
    </header>
  );
}
