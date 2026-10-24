"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic, Package, ClipboardList, Store, Sparkles, Settings } from "lucide-react";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";

export function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { label: "Voice Order Desk", href: "/", icon: Mic },
    { label: "Catalogue", href: "/admin/products", icon: Package },
    { label: "Orders", href: "/admin/orders", icon: ClipboardList },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                VoiceOrder AI
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded border border-emerald-300 dark:border-emerald-700">
                Gnani AI Powered
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Sharma Kirana Store • Live Inventory
            </p>
          </div>
        </Link>

        {/* Navigation Tabs (Desktop only - Mobile has BottomNav) & Google Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
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

          <div className="pl-1 sm:pl-2 sm:border-l sm:border-slate-200 dark:sm:border-slate-800">
            <GoogleLoginButton />
          </div>
        </div>
      </div>
    </header>
  );
}
