"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, Lock, ArrowLeft, RefreshCw } from "lucide-react";
import { useRole } from "@/context/RoleContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticatedAdmin, loading, setShowAdminModal } = useRole();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-3">
        <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
        <span className="text-xs text-slate-500 font-semibold">Verifying Storekeeper Credentials...</span>
      </div>
    );
  }

  // If visitor is NOT authenticated as store admin
  if (!isAuthenticatedAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl text-center space-y-5 animate-in fade-in">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Store Owner Access Only
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            This dashboard contains live inventory controls, billing records, and store settings reserved for the verified Kirana storekeeper.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-left text-xs space-y-1">
          <span className="font-bold text-slate-700 dark:text-slate-200 block">Verified Storekeeper ID:</span>
          <code className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] block">
            rajanprasaila@gmail.com
          </code>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={() => setShowAdminModal(true)}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Storekeeper Login</span>
          </button>

          <Link
            href="/"
            className="w-full sm:flex-1 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Customer Desk</span>
          </Link>
        </div>
      </div>
    );
  }

  // Authenticated Admin: Render management pages
  return <>{children}</>;
}
