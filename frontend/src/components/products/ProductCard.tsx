"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ProductItem } from "@/types";
import { Tag, TrendingDown, Plus, Minus, Edit, Trash2, X, Check, AlertTriangle, ExternalLink } from "lucide-react";

interface ProductCardProps {
  product: ProductItem;
  onStockUpdated?: () => void;
  isAdmin?: boolean;
}

export function ProductCard({ product, onStockUpdated, isAdmin = true }: ProductCardProps) {
  const [loading, setLoading] = useState(false);
  const [currentStock, setCurrentStock] = useState(product.availableStock);
  const [currentSold, setCurrentSold] = useState(product.soldCount || 0);
  const [sellingPrice, setSellingPrice] = useState(product.sellingPrice);
  const [mrp, setMrp] = useState(product.mrp);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPrice, setEditPrice] = useState(product.sellingPrice);
  const [editMrp, setEditMrp] = useState(product.mrp);
  const [editStock, setEditStock] = useState(product.availableStock);

  // Subtract 1 sold unit
  const handleSellOne = async () => {
    if (currentStock <= 0 || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}/sold`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ units: 1 }),
      });
      if (res.ok) {
        setCurrentStock((prev) => Math.max(0, prev - 1));
        setCurrentSold((prev) => prev + 1);
        if (onStockUpdated) onStockUpdated();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Restock 10 units
  const handleRestock = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}/restock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ units: 10 }),
      });
      if (res.ok) {
        setCurrentStock((prev) => prev + 10);
        if (onStockUpdated) onStockUpdated();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Save edits as Admin/Owner
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellingPrice: Number(editPrice),
          mrp: Number(editMrp),
          availableStock: Number(editStock),
        }),
      });
      if (res.ok) {
        setSellingPrice(Number(editPrice));
        setMrp(Number(editMrp));
        setCurrentStock(Number(editStock));
        setShowEditModal(false);
        if (onStockUpdated) onStockUpdated();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Delete product as Admin/Owner
  const handleDeleteProduct = async () => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setShowEditModal(false);
        if (onStockUpdated) onStockUpdated();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const aspectClass =
    product.imageAspectRatio === "1:1"
      ? "aspect-square"
      : product.imageAspectRatio === "4:3"
      ? "aspect-[4/3]"
      : "aspect-video";

  return (
    <>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group">
        <div>
          {/* Strictly Fixed Size & Aspect Ratio Image Container (NO EXTERNAL LINK TO PREVENT NAVIGATING AWAY) */}
          <div
            className={`w-full overflow-hidden bg-slate-100 dark:bg-slate-800 relative select-none ${aspectClass}`}
          >
            <img
              src={
                product.primaryImageUrl ||
                "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80"
              }
              alt={product.name}
              className="w-full h-full object-cover pointer-events-none"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://placehold.co/400x400/e2e8f0/64748b?text=Kirana+Item";
              }}
            />

            {/* Aspect ratio badge */}
            <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md text-white rounded text-[10px] font-mono pointer-events-none">
              {product.imageAspectRatio || "1:1"}
            </span>

            {/* Stock status badge */}
            {currentStock <= 0 ? (
              <span className="absolute top-2 left-2 px-2 py-0.5 bg-rose-600 text-white font-bold rounded text-[10px] uppercase pointer-events-none">
                Sold Out
              </span>
            ) : currentStock <= product.minStockAlert ? (
              <span className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500 text-white font-bold rounded text-[10px] uppercase pointer-events-none">
                Low Stock
              </span>
            ) : (
              <span className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-600 text-white font-bold rounded text-[10px] uppercase pointer-events-none">
                In Stock
              </span>
            )}

            {/* Admin quick edit button */}
            {isAdmin && (
              <button
                onClick={() => setShowEditModal(true)}
                title="Edit item price & stock (Owner only)"
                className="absolute bottom-2 right-2 p-1.5 bg-slate-900/80 hover:bg-slate-950 text-white rounded-lg opacity-80 hover:opacity-100 transition-all cursor-pointer shadow-md"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Content details */}
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {product.brand}
              </span>
              <span>{product.categoryName || "General"}</span>
            </div>

            <Link
              href={`/admin/products/${product.id}`}
              className="font-bold text-slate-900 dark:text-slate-100 text-sm line-clamp-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center justify-between group"
            >
              <span>{product.name}</span>
              <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            {product.hindiName && (
              <p className="text-xs text-slate-500 line-clamp-1">{product.hindiName}</p>
            )}

            {/* Price & Unit */}
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                ₹{sellingPrice}
              </span>
              <span className="text-xs text-slate-500 font-medium">/ {product.unit}</span>
              {mrp > sellingPrice && (
                <span className="text-xs text-slate-400 line-through">₹{mrp}</span>
              )}
            </div>

            {/* Live stock & Sold stats */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl text-center">
                <span className="block text-[10px] text-slate-500 uppercase">Available</span>
                <span
                  className={`font-bold ${
                    currentStock <= 0 ? "text-rose-600" : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {currentStock} {product.unit}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl text-center">
                <span className="block text-[10px] text-slate-500 uppercase">Total Sold</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {currentSold} {product.unit}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer: Live stock subtract button */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <button
            onClick={handleSellOne}
            disabled={loading || currentStock <= 0}
            title="Subtract 1 unit when sold in store"
            className="flex-1 py-1.5 px-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-rose-400 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-40 transition-all cursor-pointer"
          >
            <Minus className="w-3 h-3" />
            <span>-1 Sold</span>
          </button>

          <button
            onClick={handleRestock}
            disabled={loading}
            title="Add 10 units to stock"
            className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-40 transition-all cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>+10 Stock</span>
          </button>
        </div>
      </div>

      {/* Admin Quick Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-b pb-3">
              <Edit className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Edit Item (Owner Controls)
              </h3>
            </div>

            <p className="text-xs text-slate-500 font-semibold">{product.name}</p>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editMrp}
                    onChange={(e) => setEditMrp(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Available Stock ({product.unit})
                </label>
                <input
                  type="number"
                  required
                  value={editStock}
                  onChange={(e) => setEditStock(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleDeleteProduct}
                  className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
