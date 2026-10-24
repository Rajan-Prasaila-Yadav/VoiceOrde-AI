"use client";

import React, { useState } from "react";
import { X, ShieldCheck, Mail, Lock, User, AlertCircle, Sparkles } from "lucide-react";
import { useRole } from "@/context/RoleContext";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function AdminLoginModal() {
  const { showAdminModal, setShowAdminModal } = useRole();
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!showAdminModal) return null;

  // 1. Google OAuth Sign-in for Customers
  const handleCustomerGoogleLogin = async () => {
    setLoginError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setLoginError(err.message || "Google sign-in failed");
      setLoading(false);
    }
  };

  // 2. Email & Password Sign-in for Store Owners / Admins Only
  const handleAdminEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail.trim(), password: adminPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error ||
            "Invalid store owner credentials. This portal is for storekeepers only. If you are a customer, please sign in with Google."
        );
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("voiceorder_admin_token", data.token);
        localStorage.setItem("voiceorder_user_role", data.user.role || "ADMIN");
        localStorage.setItem("voiceorder_view_mode", "ADMIN");
      }

      setShowAdminModal(false);
      setAdminPassword("");
      // Redirect to admin orders desk
      window.location.href = "/admin/orders";
    } catch (err: any) {
      setLoginError(
        err.message ||
          "Invalid store owner credentials. Customers must sign in with Google."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => setShowAdminModal(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20 shrink-0 mt-0.5">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Storekeeper & Admin Portal
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                Staff Only
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Access store catalogue, inventory, orders & settings.
            </p>
          </div>
        </div>

        {/* Notice for Customers (Customer Login Guidance) */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 space-y-2">
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 block">
                Are you a Customer?
              </span>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-snug mt-0.5">
                Customer login won&apos;t work with store owner credentials. To place orders, view receipts, and save your delivery address, sign in with Google:
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCustomerGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs border border-emerald-300 dark:border-emerald-700 shadow-xs cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google (Customer Sign In)</span>
          </button>
        </div>

        {/* Separator */}
        <div className="relative flex items-center justify-center my-3">
          <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
          <span className="bg-white dark:bg-slate-900 px-3 text-[10px] text-slate-400 uppercase font-black tracking-wider shrink-0">
            Or Store Owner / Admin Login
          </span>
        </div>

        {/* Error Banner */}
        {loginError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{loginError}</span>
          </div>
        )}

        {/* Store Owner Login Form */}
        <form onSubmit={handleAdminEmailLogin} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Store Owner Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="store.owner@example.com"
                value={adminEmail}
                onChange={(e) => {
                  setAdminEmail(e.target.value);
                  setLoginError(null);
                }}
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="Enter your admin password"
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  setLoginError(null);
                }}
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-slate-950" />
            <span>{loading ? "Authenticating..." : "Login to Storekeeper Desk"}</span>
          </button>
        </form>

        <p className="text-[11px] text-center text-slate-400 pt-1">
          Authorized personnel only. Password is protected with secure encryption.
        </p>
      </div>
    </div>
  );
}
