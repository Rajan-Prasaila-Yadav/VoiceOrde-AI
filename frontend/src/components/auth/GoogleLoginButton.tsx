"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { LogIn, LogOut, ShieldCheck, User, Lock, Mail, X, Settings } from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function GoogleLoginButton() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<"ADMIN" | "CUSTOMER">("CUSTOMER");
  const [loading, setLoading] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Admin login modal state
  const [adminEmail, setAdminEmail] = useState("rajanprasaila@gmail.com");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const checkUserRole = (email?: string | null) => {
    if (!email) return "CUSTOMER";
    // Strictly enforce: Only rajanprasaila@gmail.com can be Admin
    return email.toLowerCase() === "rajanprasaila@gmail.com" ? "ADMIN" : "CUSTOMER";
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
        setRole(checkUserRole(data.user.email));
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setRole(checkUserRole(currentUser?.email));
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 1. Google OAuth: Anyone logging in via Google is ALWAYS a CUSTOMER (unless rajanprasaila@gmail.com)
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) console.error("Google login error:", error.message);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Admin Email & Password Login (rajanprasaila@gmail.com / Rajan123@)
  const handleAdminEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoading(true);

    try {
      // Authenticate with backend or Supabase email/password
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid admin credentials");

      // Save admin session in localStorage for instant access
      localStorage.setItem("voiceorder_admin_token", data.token);
      localStorage.setItem("voiceorder_user_role", data.user.role);

      setUser({ email: data.user.email, user_metadata: { full_name: data.user.name } });
      setRole("ADMIN");
      setShowAdminModal(false);
      setAdminPassword("");
    } catch (err: any) {
      setLoginError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("voiceorder_admin_token");
    localStorage.removeItem("voiceorder_user_role");
    setUser(null);
    setRole("CUSTOMER");
  };

  if (user) {
    const isAdmin = role === "ADMIN";
    return (
      <div className="flex items-center gap-2.5">
        {user.user_metadata?.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt="User avatar"
            className="w-8 h-8 rounded-full border border-emerald-500"
          />
        ) : (
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              isAdmin ? "bg-amber-500 text-slate-900" : "bg-emerald-600 text-white"
            }`}
          >
            {isAdmin ? <ShieldCheck className="w-4.5 h-4.5" /> : <User className="w-4 h-4" />}
          </div>
        )}

        <div className="flex flex-col">
          <span className="hidden md:inline text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
            {user.user_metadata?.full_name || user.email?.split("@")[0]}
          </span>
          <span
            className={`text-[9px] font-bold px-1.5 py-0.2 rounded w-fit uppercase ${
              isAdmin
                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
            }`}
          >
            {isAdmin ? "Admin (Store Owner)" : "Customer"}
          </span>
        </div>

        {isAdmin ? (
          <Link
            href="/admin/settings"
            title="Store Settings"
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </Link>
        ) : (
          <Link
            href="/profile/complete"
            title="My Customer Profile"
            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <User className="w-4 h-4" />
          </Link>
        )}

        <button
          onClick={handleSignOut}
          title="Sign out"
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Customer Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          title="Login with Google (Customer Account)"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
          <span>Google Sign In</span>
        </button>

        {/* Admin Login Modal Trigger */}
        <button
          onClick={() => setShowAdminModal(true)}
          title="Store Owner Admin Login"
          className="p-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
        >
          <Lock className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Admin</span>
        </button>
      </div>

      {/* Admin Login Dialog */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowAdminModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Store Admin Login</h3>
                <p className="text-xs text-slate-500">Access Catalogue & Inventory Controls</p>
              </div>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs">
                {loginError}
              </div>
            )}

            <form onSubmit={handleAdminEmailLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Admin Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="Enter admin password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Default seed: <code>Rajan123@</code>
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Authenticating..." : "Login as Admin"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
