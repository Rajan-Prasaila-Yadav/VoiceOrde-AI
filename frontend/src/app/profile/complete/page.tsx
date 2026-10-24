"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  User,
  Phone,
  MapPin,
  Navigation,
  ExternalLink,
  CheckCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function CompleteProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [whatsappDigits, setWhatsappDigits] = useState("");
  const [sameAsMobile, setSameAsMobile] = useState(true);
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pincode, setPincode] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    const checkAuthAndProfile = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();

        let userEmail = user?.email || "";
        if (!userEmail) {
          const cachedEmail = localStorage.getItem("voiceorder_customer_email");
          if (cachedEmail) userEmail = cachedEmail;
        }

        if (!userEmail) {
          // If not authenticated, redirect to login
          router.push("/login");
          return;
        }

        setEmail(userEmail);
        if (user?.user_metadata?.full_name) {
          setFullName(user.user_metadata.full_name);
        }
        if (user?.user_metadata?.avatar_url) {
          setAvatarUrl(user.user_metadata.avatar_url);
        }

        // Fetch existing profile if any
        const res = await fetch(`/api/customer/profile?email=${encodeURIComponent(userEmail)}`);
        if (res.ok) {
          const profile = await res.json();
          if (profile.isProfileCompleted) {
            // Profile already complete!
            localStorage.setItem("voiceorder_profile_completed", "true");
            router.push("/");
            return;
          }
          if (profile.fullName) setFullName(profile.fullName);
          if (profile.phone) {
            const digits = profile.phone.replace(/^\+91/, "").replace(/\D/g, "");
            setPhoneDigits(digits.slice(0, 10));
          }
          if (profile.whatsappNumber) {
            const digits = profile.whatsappNumber.replace(/^\+91/, "").replace(/\D/g, "");
            setWhatsappDigits(digits.slice(0, 10));
          }
          if (profile.address) setAddress(profile.address);
          if (profile.landmark) setLandmark(profile.landmark);
          if (profile.pincode) setPincode(profile.pincode);
          if (profile.googleMapsUrl) setGoogleMapsUrl(profile.googleMapsUrl);
          if (profile.avatarUrl) setAvatarUrl(profile.avatarUrl);
        }
      } catch (e: any) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndProfile();
  }, [router]);

  const handlePhoneChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, "").slice(0, 10);
    setPhoneDigits(digitsOnly);
    if (sameAsMobile) {
      setWhatsappDigits(digitsOnly);
    }
  };

  const handleWhatsappChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, "").slice(0, 10);
    setWhatsappDigits(digitsOnly);
  };

  const handleToggleSame = (checked: boolean) => {
    setSameAsMobile(checked);
    if (checked) {
      setWhatsappDigits(phoneDigits);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (phoneDigits.length !== 10) {
      setError("Please enter exactly 10 digits for your mobile number.");
      return;
    }
    if (pincode.length !== 6) {
      setError("Pincode must be exactly 6 digits.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        email,
        fullName,
        phone: `+91${phoneDigits}`,
        whatsappNumber: `+91${sameAsMobile ? phoneDigits : whatsappDigits}`,
        address,
        landmark,
        pincode,
        googleMapsUrl,
        avatarUrl:
          avatarUrl ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName || "User")}`,
      };

      const res = await fetch("/api/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      localStorage.setItem("voiceorder_profile_completed", "true");
      localStorage.setItem("voiceorder_customer_name", fullName);
      localStorage.setItem("voiceorder_customer_phone", `+91${phoneDigits}`);
      localStorage.setItem("voiceorder_customer_address", address);

      // Successfully completed! Redirect to voice desk
      router.push("/");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 text-sm">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600" />
        Checking account setup status...
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto my-6 p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto mb-1">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          Complete Your Customer Profile
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Please complete your contact and delivery address details once. This information is used for
          instant voice grocery order delivery, WhatsApp receipts, and bill generation.
        </p>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Profile Picture (PP size, fixed 1:1 ratio) */}
        <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="w-16 h-16 rounded-full aspect-square overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 border-2 border-emerald-500 shadow-sm">
            {avatarUrl ? (
              <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <User className="w-8 h-8" />
              </div>
            )}
          </div>
          <div className="flex-1 truncate">
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              Profile Photo (Passport / PP Size 1:1)
            </span>
            <span className="text-[11px] text-slate-400 truncate block">{email}</span>
            <input
              type="url"
              placeholder="Custom image link (optional)"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="mt-1 w-full px-2 py-1 text-[11px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Customer Full Name *
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Sunita Devi"
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Mobile & WhatsApp (+91 fixed, 10 digits) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mobile Number (10 digits) *
            </label>
            <div className="flex items-center">
              <span className="inline-flex items-center px-2.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-r-0 border-slate-300 dark:border-slate-700 rounded-l-xl select-none">
                🇮🇳 +91
              </span>
              <input
                type="text"
                required
                maxLength={10}
                value={phoneDigits}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="9812345678"
                className="w-full px-3 py-2 text-xs font-semibold rounded-r-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                WhatsApp Number
              </label>
              <label className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sameAsMobile}
                  onChange={(e) => handleToggleSame(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600"
                />
                <span>Same as Mobile</span>
              </label>
            </div>
            <div className="flex items-center">
              <span className="inline-flex items-center px-2.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-r-0 border-slate-300 dark:border-slate-700 rounded-l-xl select-none">
                🇮🇳 +91
              </span>
              <input
                type="text"
                maxLength={10}
                disabled={sameAsMobile}
                value={sameAsMobile ? phoneDigits : whatsappDigits}
                onChange={(e) => handleWhatsappChange(e.target.value)}
                placeholder="9812345678"
                className="w-full px-3 py-2 text-xs font-semibold rounded-r-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Complete Delivery Address *
          </label>
          <textarea
            rows={2}
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Flat / House No, Building, Street, Area..."
            className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Landmark & Pincode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nearby Landmark
            </label>
            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. Near Water Tank, Opp Post Office"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Pincode (6 digits) *
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="e.g. 110001"
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Google Maps Location Link (for easy delivery) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Google Maps Location Link (Optional)
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Navigation className="w-4 h-4 text-emerald-600 absolute left-3 top-2.5" />
              <input
                type="url"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                placeholder="https://maps.google.com/?q=..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            {googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-emerald-600 shrink-0 font-semibold"
              >
                <span>View</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Saving Your Profile...</span>
            </>
          ) : (
            <>
              <span>Save Profile & Start Ordering</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
