"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ApiClient } from "@/lib/api-client";
import { ProductItem, OrderRecord } from "@/types";
import {
  ArrowLeft,
  Package,
  Tag,
  Boxes,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Plus,
  Minus,
  Edit,
  Trash2,
  Barcode,
  Mic,
  Clock,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [product, setProduct] = useState<ProductItem | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPrice, setEditPrice] = useState(0);
  const [editMrp, setEditMrp] = useState(0);
  const [editStock, setEditStock] = useState(0);

  const loadData = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const prod = await ApiClient.getProductById(productId);
      if (prod) {
        setProduct(prod);
        setEditPrice(prod.sellingPrice);
        setEditMrp(prod.mrp);
        setEditStock(prod.availableStock);
      }
      const allOrders = await ApiClient.getOrders();
      setOrders(allOrders);
    } catch (e) {
      console.warn("Error loading product detail:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [productId]);

  // Orders that contain this product
  const relatedOrders = orders.filter((o) =>
    o.items?.some((it) => it.productId === productId || it.productName.includes(product?.name || ""))
  );

  const handleSellOne = async () => {
    if (!product || product.availableStock <= 0 || actionLoading) return;
    setActionLoading(true);
    try {
      await ApiClient.deductStock(product.id, 1);
      setProduct((prev) =>
        prev
          ? {
              ...prev,
              availableStock: Math.max(0, prev.availableStock - 1),
              soldCount: (prev.soldCount || 0) + 1,
            }
          : null
      );
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestockTen = async () => {
    if (!product || actionLoading) return;
    setActionLoading(true);
    try {
      await ApiClient.restockUnits(product.id, 10);
      setProduct((prev) =>
        prev ? { ...prev, availableStock: prev.availableStock + 10 } : null
      );
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setActionLoading(true);
    try {
      await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellingPrice: Number(editPrice),
          mrp: Number(editMrp),
          availableStock: Number(editStock),
        }),
      });

      setProduct((prev) =>
        prev
          ? {
              ...prev,
              sellingPrice: Number(editPrice),
              mrp: Number(editMrp),
              availableStock: Number(editStock),
            }
          : null
      );
      setShowEditModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return;
    try {
      await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });
      router.push("/admin/products");
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 text-sm">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-600" />
        Loading product details from database...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center space-y-4">
        <Package className="w-16 h-16 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">
          Product Not Found
        </h2>
        <p className="text-xs text-slate-500">
          The requested product does not exist or has been removed from the catalogue.
        </p>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalogue</span>
        </Link>
      </div>
    );
  }

  const isLowStock =
    product.availableStock > 0 && product.availableStock <= (product.minStockAlert || 5);
  const isOutOfStock = product.availableStock <= 0;
  const discountAmount = Math.max(0, product.mrp - product.sellingPrice);
  const discountPercent =
    product.mrp > 0 ? Math.round((discountAmount / product.mrp) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link
            href="/admin/products"
            className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Catalogue</span>
          </Link>
          <span>/</span>
          <span>{product.categoryName || "General"}</span>
          <span>/</span>
          <span className="font-bold text-slate-900 dark:text-white truncate max-w-xs">
            {product.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Price / Stock</span>
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 cursor-pointer"
            title="Delete Product"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Product Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Fixed aspect ratio image preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
            {/* Fixed aspect ratio container (1:1 standard) */}
            <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden pointer-events-none select-none">
              {product.primaryImageUrl ? (
                <img
                  src={product.primaryImageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover pointer-events-none select-none"
                />
              ) : (
                <Package className="w-20 h-20 text-slate-300" />
              )}
            </div>

            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 shadow-sm backdrop-blur-sm">
                Aspect: {product.imageAspectRatio || "1:1"}
              </span>
              {discountPercent > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-sm">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            <div className="absolute bottom-4 right-4">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900/80 text-white backdrop-blur-sm">
                1 image
              </span>
            </div>
          </div>

          {/* Spoken AI Matching Aliases */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Mic className="w-4 h-4 text-emerald-600" />
              <span>Spoken Voice Matching Aliases</span>
            </div>
            <p className="text-[11px] text-slate-500">
              When customers speak any of these terms in Hindi or regional accents, Gnani AI matches
              this exact SKU.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {product.aliases && product.aliases.length > 0 ? (
                product.aliases.map((alias, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  >
                    "{alias}"
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">No aliases configured</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Specifications & Live Stock Ledger */}
        <div className="lg:col-span-7 space-y-6">
          {/* Header Title & Hindi Name */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              {product.brand && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  {product.brand}
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                {product.categoryName}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white break-words">
              {product.name}
            </h1>

            {product.hindiName && (
              <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {product.hindiName}
              </p>
            )}
          </div>

          {/* Pricing & Deals Card */}
          <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-semibold block">Selling Price</span>
              <div className="flex items-baseline gap-2.5 mt-0.5">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  ₹{product.sellingPrice}
                </span>
                <span className="text-xs font-bold text-slate-500">/ {product.unit}</span>
                {product.mrp > product.sellingPrice && (
                  <span className="text-sm text-slate-400 line-through">
                    MRP ₹{product.mrp}
                  </span>
                )}
              </div>
              {discountAmount > 0 && (
                <span className="text-xs font-bold text-rose-600 mt-1 inline-block">
                  Save ₹{discountAmount} ({discountPercent}% discount)
                </span>
              )}
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 font-semibold block">Unit Packaging</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                1 {product.unit} (Step: {product.unitStep || 1.0})
              </span>
              {product.barcode && (
                <div className="flex items-center justify-end gap-1 text-[11px] text-slate-500 mt-1">
                  <Barcode className="w-3.5 h-3.5" />
                  <span>{product.barcode}</span>
                </div>
              )}
            </div>
          </div>

          {/* Live Inventory Health & Fast Adjustment Bar */}
          <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                  Live Kirana Inventory
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-2xl font-black ${
                      isOutOfStock
                        ? "text-rose-600"
                        : isLowStock
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {product.availableStock} {product.unit} available
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isOutOfStock
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        : isLowStock
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    }`}
                  >
                    {isOutOfStock
                      ? "Out of Stock"
                      : isLowStock
                      ? "Low Stock Alert"
                      : "Well Stocked"}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 font-semibold block">Total Sold</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {product.soldCount || 0} {product.unit}
                </span>
              </div>
            </div>

            {/* Quick stock adjustment buttons */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleSellOne}
                disabled={product.availableStock <= 0 || actionLoading}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Minus className="w-3.5 h-3.5" />
                <span>-1 Sell (Counter Sale)</span>
              </button>

              <button
                onClick={handleRestockTen}
                disabled={actionLoading}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+10 Restock Units</span>
              </button>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                Product Description
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Related Orders & Stock Deduction History for this SKU */}
          <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Stock Deduction History
                </h3>
                <p className="text-[11px] text-slate-500">
                  Recent voice and counter orders deducting stock for this item
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {relatedOrders.length} deductions
              </span>
            </div>

            {relatedOrders.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                No orders have deducted stock for this item yet.
              </p>
            ) : (
              <div className="space-y-2">
                {relatedOrders.map((ord) => {
                  const itemInOrder = ord.items.find(
                    (it) => it.productId === productId || it.productName.includes(product.name)
                  );
                  return (
                    <div
                      key={ord.id}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          Order #{ord.orderNumber} • {ord.customerName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded">
                          -{itemInOrder?.quantity || 1} {product.unit} deducted
                        </span>
                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          ₹{itemInOrder?.totalPrice || product.sellingPrice}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Edit Product Details
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Selling Price (₹)
                </label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">MRP (₹)</label>
                <input
                  type="number"
                  value={editMrp}
                  onChange={(e) => setEditMrp(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Available Stock ({product.unit})
                </label>
                <input
                  type="number"
                  value={editStock}
                  onChange={(e) => setEditStock(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-emerald-600"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
