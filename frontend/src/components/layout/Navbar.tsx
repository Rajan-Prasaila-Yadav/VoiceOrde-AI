"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Mic,
  Package,
  ClipboardList,
  Store,
  Settings,
  User,
  LogOut,
  Lock,
} from "lucide-react";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { AdminLoginModal } from "@/components/auth/AdminLoginModal";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useRole } from "@/context/RoleContext";

export function Navbar() {
  const pathname = usePathname();
  const { user, isAdmin, setShowAdminModal, signOut } = useRole();

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

  const [shopName, setShopName] = useState("Yadav Kirana & General Store");

  useEffect(() => {
    fetch("/api/shop/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.name) setShopName(data.name);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white block leading-tight">
                VoiceOrder AI
              </span>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate max-w-[130px] sm:max-w-none">
                {shopName} • Live Inventory
              </p>
            </div>
          </Link>

          {/* Center Navigation Tabs (Desktop) */}
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

          {/* Right Action Bar: Theme Toggle + User Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Light / Dark Mode Switcher */}
            <ThemeToggle />

            {/* 1. Logged in as Store Admin */}
            {isAdmin ? (
              <div className="flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-slate-800">
                <Link
                  href="/admin/settings"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black shadow-xs">
                    A
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Store Admin</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold leading-none">
                      Owner
                    </span>
                  </div>
                </Link>

                <Link
                  href="/admin/settings"
                  title="Store Settings"
                  className="p-2 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={signOut}
                  title="Sign out of Admin session"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : user ? (
              /* 2. Logged in as Customer with Google */
              <div className="flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-slate-800">
                <Link
                  href="/profile/complete"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="Avatar"
                      className="w-7 h-7 rounded-full border border-emerald-500"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                      {user.email?.[0]?.toUpperCase() || <User className="w-3.5 h-3.5" />}
                    </div>
                  )}
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[110px]">
                      {user.user_metadata?.full_name || user.email?.split("@")[0]}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold leading-none">Customer</span>
                  </div>
                </Link>

                <Link
                  href="/profile/complete"
                  title="My Profile"
                  className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <User className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={signOut}
                  title="Sign out"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* 3. Unauthenticated Visitor / Guest */
              <div className="flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-slate-800">
                <GoogleLoginButton />
                <button
                  type="button"
                  onClick={() => setShowAdminModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100 text-xs font-bold shadow-2xs transition-all cursor-pointer"
                  title="Store Owner & Admin Login"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Store Login</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Admin Login Modal Dialog */}
      <AdminLoginModal />
    </>
  );
}
