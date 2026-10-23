"use client";

import React, { useState } from "react";
import {
  ProductFormData,
  ProductUnit,
  ImageAspectRatio,
  ProductItem,
} from "@/types";
import {
  Package,
  IndianRupee,
  Layers,
  Image as ImageIcon,
  Tag,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle,
  TrendingDown,
  Sparkles,
} from "lucide-react";

interface ProductFormProps {
  onSuccess?: (newProduct: ProductItem) => void;
  onCancel?: () => void;
}

const CATEGORIES = [
  "Flour & Grains (अनाज और आटा)",
  "Oil & Ghee (तेल और घी)",
  "Dairy & Butter (डेयरी उत्पाद)",
  "Pulses & Dal (दालें)",
  "Spices & Masala (मसाले)",
  "Sugar, Salt & Tea (चीनी, नमक, चाय)",
  "Snacks & Biscuits (नाश्ता और बिस्कुट)",
  "Personal & Home Care (सफाई और साबुन)",
];

const UNITS: ProductUnit[] = [
  "kg",
  "g",
  "litre",
  "ml",
  "piece",
  "packet",
  "dozen",
  "box",
  "bottle",
  "bundle",
];

const ASPECT_RATIOS: { label: string; value: ImageAspectRatio; cssRatio: string }[] = [
  { label: "1:1 Square (150x150)", value: "1:1", cssRatio: "aspect-square" },
  { label: "4:3 Standard (Grocery Card)", value: "4:3", cssRatio: "aspect-[4/3]" },
  { label: "16:9 Wide (Banner)", value: "16:9", cssRatio: "aspect-video" },
];

export function ProductForm({ onSuccess, onCancel }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [hindiName, setHindiName] = useState("");
  const [brand, setBrand] = useState("");
  const [categoryName, setCategoryName] = useState(CATEGORIES[0]);
  const [unit, setUnit] = useState<ProductUnit>("kg");
  const [unitStep, setUnitStep] = useState(1);
  const [mrp, setMrp] = useState<number | "">("");
  const [sellingPrice, setSellingPrice] = useState<number | "">("");
  const [availableStock, setAvailableStock] = useState<number | "">("");
  const [minStockAlert, setMinStockAlert] = useState<number>(5);
  const [barcode, setBarcode] = useState("");
  const [description, setDescription] = useState("");
  const [aliases, setAliases] = useState("");

  // Fixed size image state
  const [primaryImageUrl, setPrimaryImageUrl] = useState("");
  const [imageAspectRatio, setImageAspectRatio] = useState<ImageAspectRatio>("1:1");
  const [imageCount, setImageCount] = useState<number>(1);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);

  // Computed discount
  const discountPercent =
    mrp && sellingPrice && Number(mrp) > Number(sellingPrice)
      ? Math.round(((Number(mrp) - Number(sellingPrice)) / Number(mrp)) * 100)
      : 0;

  const handleImageCountChange = (count: number) => {
    setImageCount(count);
    if (count > 1) {
      const extraNeeded = count - 1;
      const current = [...additionalImages];
      while (current.length < extraNeeded) current.push("");
      setAdditionalImages(current.slice(0, extraNeeded));
    } else {
      setAdditionalImages([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Item name is required");
    if (!brand.trim()) return setError("Brand name is required");
    if (sellingPrice === "" || Number(sellingPrice) <= 0)
      return setError("Valid selling price is required");
    if (availableStock === "" || Number(availableStock) < 0)
      return setError("Available stock / quantity is required");

    const payload: ProductFormData = {
      name: name.trim(),
      hindiName: hindiName.trim() || undefined,
      brand: brand.trim(),
      categoryName,
      unit,
      unitStep: Number(unitStep) || 1,
      mrp: mrp === "" ? Number(sellingPrice) : Number(mrp),
      sellingPrice: Number(sellingPrice),
      availableStock: Number(availableStock),
      soldCount: 0,
      minStockAlert: Number(minStockAlert) || 5,
      isAvailable: Number(availableStock) > 0,
      barcode: barcode.trim() || undefined,
      description: description.trim() || undefined,
      aliases: aliases
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      primaryImageUrl:
        primaryImageUrl.trim() ||
        "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60",
      imageAspectRatio,
      imageCount,
      additionalImages: additionalImages
        .filter((url) => url.trim().length > 0)
        .map((url, i) => ({
          url: url.trim(),
          aspectRatio: imageAspectRatio,
          displayOrder: i + 1,
        })),
    };

    setLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to add product");

      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);

      // Reset form
      setName("");
      setHindiName("");
      setBrand("");
      setMrp("");
      setSellingPrice("");
      setAvailableStock("");
      setPrimaryImageUrl("");
      setBarcode("");
      setDescription("");
      setAliases("");
      setAdditionalImages([]);
      setImageCount(1);

      if (onSuccess) onSuccess(json.data);
    } catch (err: any) {
      setError(err.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Add New Kirana Product</h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                Item details, units, pricing, image ratio, and automatic stock deduction
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-emerald-500/40 border border-emerald-400/40 rounded-full">
            Live Inventory Sync
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3 text-emerald-700 dark:text-emerald-300 text-sm animate-pulse">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>Product successfully saved! Ready to be ordered via voice.</span>
          </div>
        )}

        {/* SECTION 1: Product Identification */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm">
            <Tag className="w-4 h-4 text-emerald-600" />
            <span>1. Identification & Names</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Item Name (English) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sharbati Whole Wheat Atta"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Hindi / Spoken Name (हिंदी नाम)
              </label>
              <input
                type="text"
                placeholder="e.g. शरबती गेहूँ आटा"
                value={hindiName}
                onChange={(e) => setHindiName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Brand Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Aashirvaad, Amul, Fortune"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Type / Category
              </label>
              <select
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Spoken Aliases (Comma separated for voice recognition)
              </label>
              <input
                type="text"
                placeholder="aata, gehu aata, aashirwad atta"
                value={aliases}
                onChange={(e) => setAliases(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Units, Pricing & Stock Deduction */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm">
            <IndianRupee className="w-4 h-4 text-emerald-600" />
            <span>2. Units, Price & Live Stock</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Measurement Unit <span className="text-rose-500">*</span>
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as ProductUnit)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                MRP (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="e.g. 250"
                value={mrp}
                onChange={(e) => setMrp(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Selling Price (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  step="0.5"
                  placeholder="e.g. 230"
                  value={sellingPrice}
                  onChange={(e) =>
                    setSellingPrice(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-emerald-600 dark:text-emerald-400"
                />
                {discountPercent > 0 && (
                  <span className="absolute right-2 top-2 text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Available Stock (Units) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                placeholder="e.g. 50"
                value={availableStock}
                onChange={(e) =>
                  setAvailableStock(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
              />
            </div>
          </div>

          {/* Automatic stock deduction alert */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <TrendingDown className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <span className="font-semibold">Automatic Stock Subtraction:</span> Each time an order is placed
              or items are sold, the system subtracts the sold quantity from{" "}
              <strong>Available Units</strong> and increments <strong>Total Sold</strong>. If stock hits 0,
              it automatically flags as Out of Stock.
            </div>
          </div>
        </div>

        {/* SECTION 3: Fixed-Size Image, Aspect Ratio & Multi-Image Gallery */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm">
            <ImageIcon className="w-4 h-4 text-emerald-600" />
            <span>3. Image Specifications & Aspect Ratio</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Form controls */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Aspect Ratio (Fixed Dimension Container)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio.value}
                      type="button"
                      onClick={() => setImageAspectRatio(ratio.value)}
                      className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all text-center ${
                        imageAspectRatio === ratio.value
                          ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold ring-2 ring-emerald-500/20"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Primary Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={primaryImageUrl}
                    onChange={(e) => setPrimaryImageUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                    Total Number of Images
                  </label>
                  <select
                    value={imageCount}
                    onChange={(e) => handleImageCountChange(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "Image" : "Images (Gallery)"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Additional Image inputs if count > 1 */}
              {imageCount > 1 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Additional Gallery Images ({additionalImages.length})
                  </span>
                  {additionalImages.map((imgUrl, idx) => (
                    <input
                      key={idx}
                      type="url"
                      placeholder={`Additional Image #${idx + 2} URL (https://...)`}
                      value={imgUrl}
                      onChange={(e) => {
                        const updated = [...additionalImages];
                        updated[idx] = e.target.value;
                        setAdditionalImages(updated);
                      }}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Live Fixed-Size Preview Card */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Fixed Ratio Preview ({imageAspectRatio})
              </span>
              <div
                className={`w-full max-w-[200px] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-700 flex items-center justify-center relative shadow-sm ${
                  imageAspectRatio === "1:1"
                    ? "aspect-square"
                    : imageAspectRatio === "4:3"
                    ? "aspect-[4/3]"
                    : "aspect-video"
                }`}
              >
                {primaryImageUrl ? (
                  <img
                    src={primaryImageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/400x400/e2e8f0/64748b?text=Image+Load+Error";
                    }}
                  />
                ) : (
                  <div className="text-center p-3 text-slate-400 text-xs">
                    <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                    No image URL
                  </div>
                )}
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 text-white rounded text-[9px] font-mono">
                  {imageAspectRatio}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 text-center mt-2">
                Images adhere strictly to {imageAspectRatio} to prevent distorted kirana cards.
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 text-sm font-medium rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving Item...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Save Item to Catalogue</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
