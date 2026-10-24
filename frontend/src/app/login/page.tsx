"use client";

import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { ShieldCheck, Mail, Lock, User, ArrowLeft, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When a non-admin attempts email/password login, guide them to Google Sign-In
  const [showCustomerGooglePrompt, setShowCustomerGooglePrompt] = useState(false);

  // 1. Google OAuth Login (For Customers)
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      if (email.trim()) {
        localStorage.setItem("voiceorder_customer_email", email.trim().toLowerCase());
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) setError(error.message);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Email & Password Login: Check if Admin in DB
  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShowCustomerGooglePrompt(false);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // If not in DB as admin, prompt user to use Google Login as Customer!
        setShowCustomerGooglePrompt(true);
        setError("This email & password is not registered as an Admin. If you are a customer, please click 'Continue with Google' below.");
        return;
      }

      // Admin Login Success
      localStorage.setItem("voiceorder_admin_token", data.token);
      localStorage.setItem("voiceorder_user_role", "ADMIN");
      router.push("/admin/products");
    } catch (err: any) {
      setShowCustomerGooglePrompt(true);
      setError("Please click 'Continue with Google' below to sign in as a customer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl space-y-6">
      {/* Top Header */}
      <div className="text-center space-y-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 mb-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Store Desk</span>
        </Link>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          Sign In to VoiceOrder AI
        </h1>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Customers sign in with Google. Store Owners & Admins login with store email credentials.
        </p>
      </div>

      {/* Customer Guidance Alert if non-admin enters credentials */}
      {showCustomerGooglePrompt && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 rounded-2xl space-y-2 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                Customer Account Detected
              </span>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                Customers sign in securely with Google. Please click the button below to continue:
              </p>
            </div>
          </div>
        </div>
      )}

      {error && !showCustomerGooglePrompt && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. GOOGLE LOGIN BUTTON (CUSTOMER GATEWAY) */}
      <div className="space-y-3">
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border bg-white dark:bg-slate-800 font-bold text-xs shadow-sm transition-all cursor-pointer ${
            showCustomerGooglePrompt
              ? "border-emerald-500 ring-4 ring-emerald-500/30 bg-emerald-50/50 scale-102 text-emerald-900 dark:text-emerald-200 shadow-lg shadow-emerald-500/20"
              : "border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
          }`}
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
          <span>Continue with Google (Customer)</span>
        </button>

        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
          <span className="bg-white dark:bg-slate-900 px-3 text-[11px] text-slate-400 uppercase font-semibold">
            Or Sign In with Email & Password
          </span>
        </div>

        {/* 2. CUSTOM EMAIL & PASSWORD LOGIN */}
        <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setShowCustomerGooglePrompt(false);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setShowCustomerGooglePrompt(false);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{loading ? "Verifying..." : "Sign In with Email"}</span>
          </button>
        </form>

        <p className="text-[11px] text-center text-slate-400 pt-2">
          Store owners can update settings, catalogue, and phone numbers in Admin Settings.
        </p>
      </div>
    </div>
  );
}
