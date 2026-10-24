"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Store,
  MapPin,
  Phone,
  MessageSquare,
  Mail,
  User,
  QrCode,
  Image as ImageIcon,
  ExternalLink,
  CheckCircle,
  Save,
  RefreshCw,
  ArrowLeft,
  Navigation,
} from "lucide-react";
import { ShopSettings } from "@/types";

export default function StoreSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [sameAsMobile, setSameAsMobile] = useState(true);

  // Store Settings Form State
  const [name, setName] = useState("Sharma Kirana Store");
  const [ownerName, setOwnerName] = useState("Ramesh Sharma");
  const [email, setEmail] = useState("sharmakirana@gmail.com");

  // Mobile & WhatsApp: strictly +91 followed by 10 digits
  const [phoneDigits, setPhoneDigits] = useState("9876543210");
  const [whatsappDigits, setWhatsappDigits] = useState("9876543210");

  const [address, setAddress] = useState("Shop 12, Main Bazaar, Near Clock Tower");
  const [landmark, setLandmark] = useState("Opposite SBI Bank");
  const [pincode, setPincode] = useState("110001");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("https://maps.google.com/?q=28.6139,77.2090");

  // Fixed size and ratio images
  const [imageUrl, setImageUrl] = useState(
    "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80"
  );
  const [upiId, setUpiId] = useState("sharmakirana@upi");
  const [qrImageUrl, setQrImageUrl] = useState(
    "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=sharmakirana@upi&pn=SharmaKiranaStore&cu=INR"
  );

  // Fetch initial settings from DB
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shop/settings");
      if (res.ok) {
        const s: ShopSettings = await res.json();
        setName(s.name || "");
        setOwnerName(s.ownerName || "");
        setEmail(s.email || "");

        const rawPhone = (s.phone || "").replace(/^\+91/, "").replace(/\D/g, "");
        setPhoneDigits(rawPhone.slice(0, 10));

        const rawWa = (s.whatsappNumber || "").replace(/^\+91/, "").replace(/\D/g, "");
        setWhatsappDigits(rawWa.slice(0, 10));
        setSameAsMobile(rawPhone === rawWa || !rawWa);

        setAddress(s.address || "");
        setLandmark(s.landmark || "");
        setPincode((s.pincode || "").slice(0, 6));
        setGoogleMapsUrl(s.googleMapsUrl || "https://maps.google.com/?q=28.6139,77.2090");
        if (s.imageUrl) setImageUrl(s.imageUrl);
        if (s.upiId) setUpiId(s.upiId);
        if (s.qrImageUrl) setQrImageUrl(s.qrImageUrl);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

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

  // Auto update QR if UPI ID changes
  const handleUpiChange = (val: string) => {
    setUpiId(val);
    setQrImageUrl(
      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=${encodeURIComponent(
        val
      )}&pn=${encodeURIComponent(name)}&cu=INR`
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneDigits.length !== 10) {
      alert("Mobile number must be exactly 10 digits.");
      return;
    }
    if (pincode.length !== 6) {
      alert("Pincode must be exactly 6 digits.");
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    try {
      const payload: ShopSettings = {
        name,
        ownerName,
        email,
        phone: `+91${phoneDigits}`,
        whatsappNumber: `+91${sameAsMobile ? phoneDigits : whatsappDigits}`,
        address,
        landmark,
        pincode,
        googleMapsUrl,
        imageUrl,
        qrImageUrl,
        upiId,
      };

      const res = await fetch("/api/shop/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save settings");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      alert(err.message || "Error saving store settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 text-sm">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600" />
        Loading store configuration...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb & Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link
              href="/admin/products"
              className="flex items-center gap-1 hover:text-emerald-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Admin Desk</span>
            </Link>
            <span>/</span>
            <span className="font-bold text-slate-900 dark:text-white">Store Settings</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
            Kirana Store & Billing Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your store identity, phone numbers, Google Maps location, and customer billing QR code.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-xs font-bold animate-pulse">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: STORE IDENTITY & OWNER */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
            <Store className="w-4 h-4 text-emerald-600" />
            <span>Store & Owner Identity</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Store Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sharma Kirana Store"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Store Owner Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Ramesh Sharma"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Store Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sharmakirana@gmail.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Store UPI ID (For Customer Payments) *
              </label>
              <div className="relative">
                <QrCode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => handleUpiChange(e.target.value)}
                  placeholder="e.g. sharmakirana@upi"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: PHONE & WHATSAPP NUMBERS (+91 UNCHANGED, 10 DIGITS) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>Store Contact Numbers</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Primary Mobile */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Store Mobile Number (10 digits) *
              </label>
              <div className="flex items-center">
                <span className="inline-flex items-center px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-r-0 border-slate-300 dark:border-slate-700 rounded-l-xl select-none">
                  🇮🇳 +91
                </span>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={phoneDigits}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 text-xs font-semibold rounded-r-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                {phoneDigits.length === 10 ? "✅ Valid 10-digit number" : "Must be exactly 10 digits"}
              </p>
            </div>

            {/* WhatsApp Number */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Store WhatsApp Number
                </label>
                <label className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sameAsMobile}
                    onChange={(e) => handleToggleSame(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Same as Mobile</span>
                </label>
              </div>

              <div className="flex items-center">
                <span className="inline-flex items-center px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-r-0 border-slate-300 dark:border-slate-700 rounded-l-xl select-none">
                  🇮🇳 +91
                </span>
                <input
                  type="text"
                  maxLength={10}
                  disabled={sameAsMobile}
                  value={sameAsMobile ? phoneDigits : whatsappDigits}
                  onChange={(e) => handleWhatsappChange(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 text-xs font-semibold rounded-r-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Used for sending digital bills & order updates on WhatsApp.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3: COMPLETE ADDRESS, LANDMARK, PINCODE & GOOGLE MAPS */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Store Address & Google Maps Location</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Complete Street Address *
              </label>
              <textarea
                rows={2}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Shop No. 12, Main Market Road, Near Clock Tower..."
                className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Landmark
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Opposite SBI Bank"
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

            {/* Google Maps Link with Click-to-Open Action */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Google Maps Location Link *
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Navigation className="w-4 h-4 text-emerald-600 absolute left-3 top-2.5" />
                  <input
                    type="url"
                    required
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
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-emerald-600 shrink-0 transition-colors"
                  >
                    <span>Open in Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: FIXED ASPECT RATIO STORE IMAGE & UPI QR IMAGE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Store Image Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              <span>Store Front Image (Fixed 16:9 Aspect Ratio)</span>
            </div>

            <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 relative shadow-inner">
              <img
                src={imageUrl}
                alt="Store Front"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as any).src =
                    "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80";
                }}
              />
              <div className="absolute bottom-2 left-2 right-2 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-[11px] font-semibold truncate">
                {name} • Front View
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Store Image Web URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          {/* UPI QR Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              <QrCode className="w-4 h-4 text-emerald-600" />
              <span>Shop UPI Payment QR (Fixed 1:1 Aspect Ratio)</span>
            </div>

            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="w-40 h-40 aspect-square rounded-xl overflow-hidden bg-white p-2 shadow-sm border border-slate-200">
                <img
                  src={qrImageUrl}
                  alt="Shop UPI QR"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="mt-2 text-center">
                <div className="text-xs font-bold text-slate-900 dark:text-white">{name}</div>
                <div className="text-[11px] font-mono text-emerald-600">{upiId}</div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                QR Image URL
              </label>
              <input
                type="url"
                value={qrImageUrl}
                onChange={(e) => setQrImageUrl(e.target.value)}
                placeholder="https://api.qrserver.com/..."
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50 transition-all"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving to Database...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Store Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
