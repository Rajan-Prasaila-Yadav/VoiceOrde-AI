"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic, Package, ClipboardList, UserCheck, Download, RefreshCw, Sparkles, Store } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("To install VoiceOrder AI on iOS or Chrome:\n1. Tap the Share/Menu button (⋮ or ⎋)\n2. Select 'Add to Home Screen' or 'Install App'.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const handleNativeRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  const navItems = [
    { label: "Voice Desk", href: "/", icon: Mic },
    { label: "Catalogue", href: "/admin/products", icon: Package },
    { label: "Orders", href: "/admin/orders", icon: ClipboardList },
    { label: "Admin", href: "/login", icon: UserCheck },
  ];

  return (
    <>
      {/* Floating Refresh & Install Bar for Mobile */}
      <div className="md:hidden fixed bottom-16 right-3 z-40 flex items-center gap-2">
        <button
          onClick={handleNativeRefresh}
          className="p-2.5 rounded-full bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 shadow-xl backdrop-blur-md active:scale-95 transition-all border border-slate-700/50 cursor-pointer"
          title="Refresh App"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>

        {isInstallable && (
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-xl shadow-emerald-600/30 backdrop-blur-md active:scale-95 transition-all cursor-pointer animate-bounce"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>
        )}
      </div>

      {/* Sleek Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                  isActive
                    ? "text-emerald-600 dark:text-emerald-400 font-bold scale-105"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 font-medium"
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                  )}
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
