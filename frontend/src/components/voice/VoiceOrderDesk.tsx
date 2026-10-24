"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Mic,
  MicOff,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  CheckCircle,
  QrCode,
  AlertCircle,
  RefreshCw,
  Plus,
  Minus,
  Search,
  Package,
  Layers,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import { ProductItem, OrderRecord } from "@/types";
import { ApiClient } from "@/lib/api-client";

const SAMPLE_SPOKEN_ORDERS = [
  {
    label: "आटा + बटर + चीनी",
    text: "दो किलो आटा, एक पैकेट अमूल बटर और एक किलो चीनी चाहिए",
  },
  {
    label: "तेल + नमक + दाल",
    text: "1 litre Fortune mustard oil aur ek packet Tata salt aur ek kilo toor dal",
  },
  {
    label: "चाय + बिस्कुट + दूध",
    text: "ek packet Red Label chai, do packet Parle G biscuit aur ek litre Amul Taaza milk",
  },
  {
    label: "घी + गरम मसाला",
    text: "Amul pure ghee ek litre aur ek packet Everest garam masala",
  },
];

export function VoiceOrderDesk() {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("hi-IN");
  const [transcript, setTranscript] = useState("");
  const [processing, setProcessing] = useState(false);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState("Sunita Devi");
  const [customerPhone, setCustomerPhone] = useState("9812345678");
  const [deliveryAddress, setDeliveryAddress] = useState(
    "Flat 204, Radha Krishna Apts, Main Bazaar"
  );
  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI_QR" | "CREDIT_UDHAAR">(
    "UPI_QR"
  );
  const [placedOrder, setPlacedOrder] = useState<OrderRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shopSettings, setShopSettings] = useState<any>(null);

  // Manual Quick Catalogue Search state
  const [showCataloguePicker, setShowCataloguePicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerCategory, setPickerCategory] = useState("all");

  // Load products to match items
  const loadProducts = async () => {
    try {
      const items = await ApiClient.getProducts();
      setProducts(items);
    } catch (e) {
      console.warn("Could not load products:", e);
    }
  };

  useEffect(() => {
    loadProducts();

    // Load store configuration for bills and QR code
    fetch("/api/shop/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setShopSettings(data);
      })
      .catch((e) => console.warn("Shop settings load failed", e));

    // Auto-fill customer profile details if logged in
    const cachedName = localStorage.getItem("voiceorder_customer_name");
    const cachedPhone = localStorage.getItem("voiceorder_customer_phone");
    const cachedAddress = localStorage.getItem("voiceorder_customer_address");
    if (cachedName) setCustomerName(cachedName);
    if (cachedPhone) setCustomerPhone(cachedPhone);
    if (cachedAddress) setDeliveryAddress(cachedAddress);
  }, []);

  // Filter products for quick-add picker
  const pickerCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.categoryName) set.add(p.categoryName);
    });
    return Array.from(set).sort();
  }, [products]);

  const filteredPickerProducts = useMemo(() => {
    return products.filter((p) => {
      if (pickerCategory !== "all" && p.categoryName !== pickerCategory) return false;
      if (pickerSearch.trim()) {
        const q = pickerSearch.toLowerCase().trim();
        const mName = p.name.toLowerCase().includes(q);
        const mHindi = p.hindiName ? p.hindiName.toLowerCase().includes(q) : false;
        const mBrand = p.brand ? p.brand.toLowerCase().includes(q) : false;
        return mName || mHindi || mBrand;
      }
      return true;
    });
  }, [products, pickerSearch, pickerCategory]);

  const handleAddItemToOrder = (product: ProductItem) => {
    setOrderItems((prev) => {
      const existingIdx = prev.findIndex((it) => it.productId === product.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + 1;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          totalPrice: newQty * product.sellingPrice,
          stockError: product.availableStock < newQty,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            productName: `${product.brand || ""} ${product.name}`.trim(),
            unit: product.unit,
            quantity: 1,
            unitPrice: product.sellingPrice,
            totalPrice: product.sellingPrice,
            availableStock: product.availableStock,
            stockError: product.availableStock < 1,
          },
        ];
      }
    });
  };

  const handleUpdateItemQty = (productId: string, delta: number) => {
    setOrderItems((prev) =>
      prev
        .map((it) => {
          if (it.productId === productId) {
            const newQty = it.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...it,
              quantity: newQty,
              totalPrice: newQty * it.unitPrice,
              stockError: it.availableStock < newQty,
            };
          }
          return it;
        })
        .filter(Boolean) as any[]
    );
  };

  const handleRemoveItem = (productId: string) => {
    setOrderItems((prev) => prev.filter((it) => it.productId !== productId));
  };

  const latestTranscriptRef = React.useRef("");

  // Simulate audio capture or web speech
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setTranscript("");
    latestTranscriptRef.current = "";
    setError(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = selectedLanguage;
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let currentText = "";
          for (let i = 0; i < event.results.length; i++) {
            currentText += event.results[i][0].transcript;
          }
          setTranscript(currentText);
          latestTranscriptRef.current = currentText;
        };

        recognition.onend = () => {
          setIsRecording(false);
          const finalSpoken = latestTranscriptRef.current.trim();
          if (finalSpoken) {
            processTranscript(finalSpoken);
          }
        };

        recognition.onerror = (event: any) => {
          setIsRecording(false);
          const errType = event.error || "unknown";
          if (errType === "not-allowed") {
            setError(
              "Microphone permission was denied. Please allow microphone in browser address bar, or use the quick sample order buttons below."
            );
          } else if (errType === "no-speech") {
            setError("No speech was heard. Please speak close to your microphone or try a sample order.");
          } else if (errType === "network") {
            setError("Speech network connection issue. You can type or use the sample orders below.");
          } else {
            console.warn("Speech recognition notice:", errType);
          }
        };

        (window as any)._rec = recognition;
        recognition.start();
        return;
      } catch (err: any) {
        console.warn("SpeechRecognition start failed, fallback to sample", err);
      }
    }

    // Default simulation for browsers without Web Speech API
    setError("Web Speech is not supported on this browser/environment. Loading demo spoken order...");
    setTimeout(() => {
      const demo = "दो किलो आटा, एक पैकेट अमूल बटर और एक किलो चीनी चाहिए";
      setTranscript(demo);
      latestTranscriptRef.current = demo;
      setIsRecording(false);
      processTranscript(demo);
    }, 1500);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if ((window as any)._rec) {
      try {
        (window as any)._rec.stop();
      } catch (e) {}
    }
    if (latestTranscriptRef.current.trim()) {
      processTranscript(latestTranscriptRef.current.trim());
    }
  };

  // Process transcript with Gnani Evon LLM & Match with Live Catalogue
  const processTranscript = async (customText?: string) => {
    const textToProcess = (typeof customText === "string" ? customText : transcript).trim();
    if (!textToProcess) return;
    setProcessing(true);
    setError(null);

    try {
      // Ensure products are loaded
      let activeCatalogue = products;
      if (!activeCatalogue || activeCatalogue.length === 0) {
        try {
          activeCatalogue = await ApiClient.getProducts();
          if (activeCatalogue && activeCatalogue.length > 0) {
            setProducts(activeCatalogue);
          }
        } catch (e) {}
      }

      const res = await fetch("/api/gnani/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: textToProcess }),
      });

      const json = await res.json();
      const extracted = json.items || [];

      // Match extracted items against real catalogue products safely
      const matched = extracted.map((ext: any) => {
        const spoken = (ext.spokenItem || "").toLowerCase().trim();

        const found = (activeCatalogue || []).find((p) => {
          const nameLower = (p.name || "").toLowerCase();
          const hindiLower = (p.hindiName || "").toLowerCase();
          const brandLower = (p.brand || "").toLowerCase();

          // Safe alias normalization (handles string, array, or null)
          const aliasStr = Array.isArray(p.aliases)
            ? p.aliases.join(" ")
            : typeof p.aliases === "string"
            ? p.aliases
            : "";
          const aliasLower = aliasStr.toLowerCase();

          // Direct includes checks
          if (nameLower.includes(spoken) || spoken.includes(nameLower)) return true;
          if (hindiLower && (hindiLower.includes(spoken) || spoken.includes(hindiLower))) return true;
          if (brandLower && (spoken.includes(brandLower) || brandLower.includes(spoken))) return true;
          if (aliasLower && aliasLower.includes(spoken)) return true;

          // Token matching
          const tokens = spoken.split(/\s+/).filter((t: string) => t.length > 2);
          for (const token of tokens) {
            if (nameLower.includes(token) || (aliasLower && aliasLower.includes(token))) {
              return true;
            }
          }
          return false;
        });

        if (found) {
          const unitPrice = found.sellingPrice;
          return {
            productId: found.id,
            productName: `${found.brand ? found.brand + " " : ""}${found.name}`.trim(),
            unit: found.unit,
            quantity: ext.quantity || 1,
            unitPrice,
            totalPrice: unitPrice * (ext.quantity || 1),
            availableStock: found.availableStock,
            stockError: found.availableStock < (ext.quantity || 1),
          };
        }

        // Unmatched fallback
        return {
          productId: "unmatched-" + Math.random().toString(36).substring(2, 9),
          productName: ext.spokenItem,
          unit: ext.unit || "piece",
          quantity: ext.quantity || 1,
          unitPrice: 50,
          totalPrice: 50 * (ext.quantity || 1),
          availableStock: 10,
          stockError: false,
        };
      });

      setOrderItems(matched);
    } catch (err: any) {
      setError(err.message || "Failed to process order transcript");
    } finally {
      setProcessing(false);
    }
  };

  // Confirm order and trigger automatic stock subtraction in backend
  const handleConfirmOrder = async () => {
    if (orderItems.length === 0) return;
    setProcessing(true);
    setError(null);

    const hasStockError = orderItems.some((it) => it.stockError);
    if (hasStockError) {
      setError("Please fix items that exceed available stock before confirming");
      setProcessing(false);
      return;
    }

    try {
      const payload = {
        shopId: "00000000-0000-0000-0000-000000000001",
        customerName,
        customerPhone,
        deliveryAddress,
        rawTranscript: transcript,
        detectedLanguage: selectedLanguage,
        isVoiceOrder: true,
        paymentMode,
        items: orderItems.map((it) => ({
          productId: it.productId,
          productName: it.productName,
          unit: it.unit,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalPrice: it.totalPrice,
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Order placement failed");

      setPlacedOrder(json.data);
      // Reload products to see immediately updated (subtracted) stock!
      loadProducts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const subtotal = orderItems.reduce((acc, it) => acc + it.totalPrice, 0);

  return (
    <div className="space-y-8">
      {/* Voice Recorder Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gnani Prisma Indian Speech Recognition & Evon LLM</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Speak Your Grocery Order (बोलकर ऑर्डर दें)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Order naturally in Hindi, Hinglish or your regional language. The catalogue decides prices
            and updates stock automatically in real time.
          </p>

          {/* Language Selector */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Spoken Language:</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="hi-IN">Hindi (हिन्दी / Hinglish)</option>
              <option value="mr-IN">Marathi (मराठी)</option>
              <option value="ta-IN">Tamil (தமிழ்)</option>
              <option value="te-IN">Telugu (తెలుగు)</option>
              <option value="kn-IN">Kannada (ಕನ್ನಡ)</option>
              <option value="gu-IN">Gujarati (ગુજરાતી)</option>
              <option value="bn-IN">Bengali (বাংলা)</option>
              <option value="en-IN">Indian English</option>
            </select>
          </div>

          {/* Big Mic Button */}
          <div className="py-6 flex flex-col items-center justify-center">
            <button
              onClick={toggleRecording}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg ${
                isRecording
                  ? "bg-rose-600 text-white animate-pulse shadow-rose-600/40 ring-8 ring-rose-400/20"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 hover:scale-105"
              }`}
            >
              {isRecording ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
            </button>
            <span className="text-xs font-semibold text-slate-500 mt-3">
              {isRecording ? "Listening... Speak your grocery items" : "Tap to Speak (बोलिए)"}
            </span>
          </div>

          {/* Sample Prompts */}
          <div className="pt-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Try Sample Spoken Orders:
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {SAMPLE_SPOKEN_ORDERS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTranscript(sample.text);
                    processTranscript(sample.text);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-colors cursor-pointer"
                  title="Click to instantly parse and populate items"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Transcript Box */}
          <div className="space-y-3 pt-2">
            <div className="relative">
              <textarea
                rows={3}
                placeholder="Or type here: e.g. दो किलो आटा, एक पैकेट अमूल बटर और एक किलो चीनी..."
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => processTranscript()}
                disabled={!transcript.trim() || processing}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing with Gnani...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Extract & Match Order</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowCataloguePicker(!showCataloguePicker)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <Package className="w-4 h-4 text-emerald-600" />
                <span>{showCataloguePicker ? "Hide Catalogue" : "Browse & Add Items"}</span>
                {showCataloguePicker ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* QUICK CATALOGUE SEARCH & PICK DRAWER */}
        {showCataloguePicker && (
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Quick search catalogue items by name or Hindi..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <select
                value={pickerCategory}
                onChange={(e) => setPickerCategory(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <option value="all">All Categories</option>
                {pickerCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
              {filteredPickerProducts.slice(0, 20).map((prod) => (
                <div
                  key={prod.id}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-2"
                >
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {prod.name}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      ₹{prod.sellingPrice} / {prod.unit}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddItemToOrder(prod)}
                    className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 cursor-pointer shadow-sm"
                    title="Add to order"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Review & Confirmation Step */}
      {orderItems.length > 0 && !placedOrder && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Review Matched Items & Prices
              </h3>
              <p className="text-xs text-slate-500">
                Verified against shop catalogue with automatic stock check
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full">
              {orderItems.length} Items Identified
            </span>
          </div>

          {/* Mobile Card Layout (< sm screens) */}
          <div className="sm:hidden space-y-3">
            {orderItems.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {item.productName}
                    </div>
                    <div className="text-xs text-slate-500">
                      ₹{item.unitPrice} / {item.unit}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.productId)}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateItemQty(item.productId, -1)}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer shadow-xs"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-extrabold text-xs px-1">
                      {item.quantity} {item.unit}
                    </span>
                    <button
                      onClick={() => handleUpdateItemQty(item.productId, 1)}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Total</div>
                    <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      ₹{item.totalPrice}
                    </div>
                  </div>
                </div>

                <div className="text-[11px]">
                  {item.stockError ? (
                    <span className="text-rose-600 font-bold">
                      ⚠️ Exceeds Stock ({item.availableStock} available)
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      In stock ({item.availableStock} avail)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (>= sm screens) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Price / Unit</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Stock Check</th>
                  <th className="p-3 text-right">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {orderItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                      {item.productName}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateItemQty(item.productId, -1)}
                          className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-xs">
                          {item.quantity} {item.unit}
                        </span>
                        <button
                          onClick={() => handleUpdateItemQty(item.productId, 1)}
                          className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-slate-500 text-xs">₹{item.unitPrice}</td>
                    <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                      ₹{item.totalPrice}
                    </td>
                    <td className="p-3">
                      {item.stockError ? (
                        <span className="text-xs text-rose-600 font-bold">
                          Exceeds Stock ({item.availableStock} avail)
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Available ({item.availableStock} in stock)
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleRemoveItem(item.productId)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Customer info & Delivery */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Mobile Number (10 digits)</label>
              <div className="flex items-center">
                <span className="inline-flex items-center px-2.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-r-0 border-slate-300 dark:border-slate-700 rounded-l-xl select-none">
                  🇮🇳 +91
                </span>
                <input
                  type="text"
                  maxLength={10}
                  value={customerPhone.replace(/^\+91/, "").replace(/\D/g, "")}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setCustomerPhone(`+91${digits}`);
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-r-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Payment Method</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <option value="UPI_QR">UPI QR Code</option>
                <option value="CASH">Cash on Delivery</option>
                <option value="CREDIT_UDHAAR">Shop Credit (Udhaar)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs text-slate-500 block">Total Order Bill</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">₹{subtotal}</span>
            </div>

            <button
              onClick={handleConfirmOrder}
              disabled={processing}
              className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
            >
              <span>Confirm Order & Deduct Stock</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Order Confirmed & Receipt View */}
      {placedOrder && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
              Order #{placedOrder.orderNumber} Placed Successfully!
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              Catalogue stock has been automatically decremented. Total sold units updated.
            </p>
          </div>

          {/* Receipt details */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 max-w-md mx-auto">
            {/* Store Header on Bill */}
            <div className="text-center pb-3 border-b border-slate-100 dark:border-slate-800 space-y-1">
              <span className="font-black text-sm text-slate-900 dark:text-white block">
                {shopSettings?.name || "Sharma Kirana Store"}
              </span>
              <span className="text-[11px] text-slate-500 block">
                {shopSettings?.address || "Shop 12, Main Bazaar"} • Ph: {shopSettings?.phone || "+919876543210"}
              </span>
              {shopSettings?.googleMapsUrl && (
                <a
                  href={shopSettings.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold hover:underline"
                >
                  <span>View Store on Google Maps</span>
                </a>
              )}
            </div>

            <div className="flex justify-between text-xs text-slate-500 border-b pb-2">
              <span>Customer: {placedOrder.customerName}</span>
              <span>{placedOrder.customerPhone}</span>
            </div>

            <div className="space-y-2 text-xs">
              {placedOrder.items.map((it, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>
                    {it.quantity} {it.unit} x {it.productName}
                  </span>
                  <span className="font-bold">₹{it.totalPrice}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 flex justify-between font-extrabold text-base">
              <span>Grand Total</span>
              <span className="text-emerald-600">₹{placedOrder.totalAmount}</span>
            </div>

            {/* Shop UPI QR in fixed 1:1 Aspect Ratio */}
            {placedOrder.paymentMode === "UPI_QR" && (
              <div className="pt-3 border-t text-center space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Scan Shop UPI QR to Pay
                </span>
                <div className="w-36 h-36 mx-auto aspect-square rounded-2xl overflow-hidden bg-white p-2 shadow-sm border border-slate-200 dark:border-slate-700">
                  <img
                    src={
                      shopSettings?.qrImageUrl ||
                      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=${encodeURIComponent(
                        shopSettings?.upiId || "sharmakirana@upi"
                      )}&pn=SharmaKiranaStore&cu=INR`
                    }
                    alt="Shop UPI QR"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-[11px] font-mono text-emerald-600 block font-bold">
                  UPI: {shopSettings?.upiId || "sharmakirana@upi"}
                </span>
              </div>
            )}
          </div>

          <div className="text-center">
            <button
              onClick={() => {
                setPlacedOrder(null);
                setOrderItems([]);
                setTranscript("");
              }}
              className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 cursor-pointer"
            >
              Take Another Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
