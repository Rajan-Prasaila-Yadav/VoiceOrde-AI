"use client";

import React, { useState } from "react";
import { X, ShieldCheck, Mail, Lock } from "lucide-react";
import { useRole } from "@/context/RoleContext";

export function AdminLoginModal() {
  const { showAdminModal, setShowAdminModal } = useRole();
  const [adminEmail, setAdminEmail] = useState("rajanprasaila@gmail.com");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!showAdminModal) return null;

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
      if (!res.ok) throw new Error(data.error || "Invalid admin credentials");

      if (typeof window !== "undefined") {
        localStorage.setItem("voiceorder_admin_token", data.token);
        localStorage.setItem("voiceorder_user_role", data.user.role);
        localStorage.setItem("voiceorder_view_mode", "ADMIN");
      }

      setShowAdminModal(false);
      setAdminPassword("");
      // Force page reload so role context and session synchronize cleanly
      window.location.href = "/admin/orders";
    } catch (err: any) {
      setLoginError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-2xl relative space-y-4">
        <button
          onClick={() => setShowAdminModal(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Storekeeper Admin Login</h3>
            <p className="text-xs text-slate-500">Access Catalogue, Orders & Store Settings</p>
          </div>
        </div>

        {loginError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-300 text-xs font-semibold">
            {loginError}
          </div>
        )}

        <form onSubmit={handleAdminEmailLogin} className="space-y-3.5 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Store Owner Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                placeholder="Enter admin password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              Default verified seed: <code>Rajan123@</code>
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer transition-all active:scale-[0.98]"
          >
            {loading ? "Authenticating..." : "Login to Storekeeper Desk"}
          </button>
        </form>
      </div>
    </div>
  );
}
