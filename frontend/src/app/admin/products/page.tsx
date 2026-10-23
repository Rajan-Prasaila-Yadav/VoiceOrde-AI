"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ProductForm } from "@/components/products/ProductForm";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductItem } from "@/types";
import { ApiClient } from "@/lib/api-client";
import {
  Package,
  Plus,
  RefreshCw,
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Filter,
  Check,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  LayoutGrid,
  Table as TableIcon,
  Tag,
  Boxes,
  Percent,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
} from "lucide-react";

type SortOption =
  | "default"
  | "price_asc"
  | "price_desc"
  | "stock_desc"
  | "stock_asc"
  | "name_asc"
  | "name_desc"
  | "discount_desc"
  | "sold_desc";

type StockFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";
type DealFilter = "all" | "discounted" | "big_discount";

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // View Mode: Grid or List/Table
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedUnit, setSelectedUnit] = useState("all");
  const [selectedStock, setSelectedStock] = useState<StockFilter>("all");
  const [selectedPricePreset, setSelectedPricePreset] = useState("all");
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [selectedDeal, setSelectedDeal] = useState<DealFilter>("all");
  const [hideOutOfStock, setHideOutOfStock] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("default");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(12);

  // Mobile Filters Drawer Toggle
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Inline edit state for table view
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const items = await ApiClient.getProducts();
      setProducts(items);
    } catch (e) {
      console.warn("Failed to fetch products:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Reset pagination to page 1 whenever any filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedCategory,
    selectedBrand,
    selectedUnit,
    selectedStock,
    selectedPricePreset,
    minPriceInput,
    maxPriceInput,
    selectedDeal,
    hideOutOfStock,
    sortBy,
    itemsPerPage,
  ]);

  // Dynamically extract categories, brands, and units
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const cat = p.categoryName || "General";
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [products]);

  const brands = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      if (p.brand) {
        map.set(p.brand, (map.get(p.brand) || 0) + 1);
      }
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [products]);

  const units = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.unit) set.add(p.unit);
    });
    return Array.from(set).sort();
  }, [products]);

  // Inventory KPI Metrics
  const inventoryStats = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalValuation = 0;

    products.forEach((p) => {
      const stock = p.availableStock;
      const minAlert = p.minStockAlert || 5;
      if (stock <= 0) {
        outOfStock++;
      } else if (stock <= minAlert) {
        lowStock++;
      } else {
        inStock++;
      }
      totalValuation += stock * p.sellingPrice;
    });

    return {
      total: products.length,
      inStock,
      lowStock,
      outOfStock,
      totalValuation,
    };
  }, [products]);

  // Filter & Sort Pipeline
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // 1. Text Search across English name, Hindi name, brand, category, barcode, aliases
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = p.name.toLowerCase().includes(q);
          const matchHindi = p.hindiName ? p.hindiName.toLowerCase().includes(q) : false;
          const matchBrand = p.brand ? p.brand.toLowerCase().includes(q) : false;
          const matchCat = p.categoryName ? p.categoryName.toLowerCase().includes(q) : false;
          const matchBarcode = p.barcode ? p.barcode.toLowerCase().includes(q) : false;
          const matchUnit = p.unit ? p.unit.toLowerCase().includes(q) : false;
          const matchAliases = p.aliases ? p.aliases.some((a) => a.toLowerCase().includes(q)) : false;

          if (
            !matchName &&
            !matchHindi &&
            !matchBrand &&
            !matchCat &&
            !matchBarcode &&
            !matchUnit &&
            !matchAliases
          ) {
            return false;
          }
        }

        // 2. Category Filter
        if (selectedCategory !== "all" && p.categoryName !== selectedCategory) {
          return false;
        }

        // 3. Brand Filter
        if (selectedBrand !== "all" && p.brand !== selectedBrand) {
          return false;
        }

        // 4. Unit Filter
        if (selectedUnit !== "all" && p.unit !== selectedUnit) {
          return false;
        }

        // 5. Stock Status Filter
        const minAlert = p.minStockAlert || 5;
        if (selectedStock === "in_stock" && p.availableStock <= minAlert) {
          return false;
        }
        if (
          selectedStock === "low_stock" &&
          (p.availableStock <= 0 || p.availableStock > minAlert)
        ) {
          return false;
        }
        if (selectedStock === "out_of_stock" && p.availableStock > 0) {
          return false;
        }

        // 6. Hide Out of Stock toggle
        if (hideOutOfStock && p.availableStock <= 0) {
          return false;
        }

        // 7. Price Preset Filter
        if (selectedPricePreset === "under_50" && p.sellingPrice >= 50) return false;
        if (
          selectedPricePreset === "50_150" &&
          (p.sellingPrice < 50 || p.sellingPrice > 150)
        )
          return false;
        if (
          selectedPricePreset === "150_300" &&
          (p.sellingPrice < 150 || p.sellingPrice > 300)
        )
          return false;
        if (
          selectedPricePreset === "300_500" &&
          (p.sellingPrice < 300 || p.sellingPrice > 500)
        )
          return false;
        if (selectedPricePreset === "above_500" && p.sellingPrice <= 500) return false;

        // 8. Custom Price Range Inputs
        if (minPriceInput !== "" && !isNaN(Number(minPriceInput))) {
          if (p.sellingPrice < Number(minPriceInput)) return false;
        }
        if (maxPriceInput !== "" && !isNaN(Number(maxPriceInput))) {
          if (p.sellingPrice > Number(maxPriceInput)) return false;
        }

        // 9. Deals & Discounts Filter
        const discountAmount = p.mrp - p.sellingPrice;
        const discountPercent = p.mrp > 0 ? (discountAmount / p.mrp) * 100 : 0;
        if (selectedDeal === "discounted" && discountAmount <= 0) return false;
        if (selectedDeal === "big_discount" && discountPercent < 10) return false;

        return true;
      })
      .sort((a, b) => {
        const discountA = a.mrp > 0 ? ((a.mrp - a.sellingPrice) / a.mrp) * 100 : 0;
        const discountB = b.mrp > 0 ? ((b.mrp - b.sellingPrice) / b.mrp) * 100 : 0;

        switch (sortBy) {
          case "price_asc":
            return a.sellingPrice - b.sellingPrice;
          case "price_desc":
            return b.sellingPrice - a.sellingPrice;
          case "stock_desc":
            return b.availableStock - a.availableStock;
          case "stock_asc":
            return a.availableStock - b.availableStock;
          case "name_asc":
            return a.name.localeCompare(b.name);
          case "name_desc":
            return b.name.localeCompare(a.name);
          case "discount_desc":
            return discountB - discountA;
          case "sold_desc":
            return (b.soldCount || 0) - (a.soldCount || 0);
          default:
            return 0;
        }
      });
  }, [
    products,
    searchQuery,
    selectedCategory,
    selectedBrand,
    selectedUnit,
    selectedStock,
    selectedPricePreset,
    minPriceInput,
    maxPriceInput,
    selectedDeal,
    hideOutOfStock,
    sortBy,
  ]);

  // Paginated Slices
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    if (itemsPerPage === -1) return filteredProducts;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedBrand !== "all" ||
    selectedUnit !== "all" ||
    selectedStock !== "all" ||
    selectedPricePreset !== "all" ||
    minPriceInput !== "" ||
    maxPriceInput !== "" ||
    selectedDeal !== "all" ||
    hideOutOfStock ||
    sortBy !== "default";

  const resetAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedBrand("all");
    setSelectedUnit("all");
    setSelectedStock("all");
    setSelectedPricePreset("all");
    setMinPriceInput("");
    setMaxPriceInput("");
    setSelectedDeal("all");
    setHideOutOfStock(false);
    setSortBy("default");
    setCurrentPage(1);
  };

  // Quick Inline Save from Table View
  const handleSaveInlineEdit = async (productId: string) => {
    try {
      await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellingPrice: Number(editPrice),
          availableStock: Number(editStock),
        }),
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, sellingPrice: Number(editPrice), availableStock: Number(editStock) }
            : p
        )
      );
      setEditingProductId(null);
    } catch (e) {
      console.error("Inline save failed:", e);
    }
  };

  const handleQuickDeduct = async (productId: string) => {
    try {
      await ApiClient.deductStock(productId, 1);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? {
                ...p,
                availableStock: Math.max(0, p.availableStock - 1),
                soldCount: (p.soldCount || 0) + 1,
              }
            : p
        )
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuickRestock = async (productId: string) => {
    try {
      await ApiClient.restockUnits(productId, 10);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, availableStock: p.availableStock + 10 } : p
        )
      );
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white break-words">
              Catalogue & Inventory Desk
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
              Live DB
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse products, filter by parameters in the sidebar, inspect details, and manage prices.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
            <span>Filters</span>
          </button>

          <button
            onClick={fetchProducts}
            className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Refresh catalogue from DB"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? "Hide Form" : "Add New Item"}</span>
          </button>
        </div>
      </div>

      {/* Interactive Product Form (Collapsible) */}
      {showAddForm && (
        <div className="transition-all">
          <ProductForm
            onSuccess={(newProduct) => {
              setProducts((prev) => [newProduct, ...prev]);
              setShowAddForm(false);
            }}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => {
            setSelectedStock("all");
            setHideOutOfStock(false);
          }}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStock === "all" && !hideOutOfStock
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total SKUs</span>
            <Boxes className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {inventoryStats.total}
          </div>
          <span className="text-[10px] text-slate-400">All products</span>
        </button>

        <button
          onClick={() => setSelectedStock("in_stock")}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStock === "in_stock"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              In Stock
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {inventoryStats.inStock}
          </div>
          <span className="text-[10px] text-slate-400">&gt; 5 units available</span>
        </button>

        <button
          onClick={() => setSelectedStock("low_stock")}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStock === "low_stock"
              ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
              Low Stock
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400">
            {inventoryStats.lowStock}
          </div>
          <span className="text-[10px] text-amber-600/80 font-medium">1–5 units left</span>
        </button>

        <button
          onClick={() => setSelectedStock("out_of_stock")}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            selectedStock === "out_of_stock"
              ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
              Out of Stock
            </span>
            <X className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400">
            {inventoryStats.outOfStock}
          </div>
          <span className="text-[10px] text-rose-500/80 font-medium">Needs restock</span>
        </button>

        <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl border bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider">Inventory Value</span>
            <span className="text-xs font-bold text-emerald-400">₹</span>
          </div>
          <div className="text-xl font-black text-emerald-400">
            ₹{inventoryStats.totalValuation.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-slate-400">Live retail value</span>
        </div>
      </div>

      {/* 2-COLUMN SIDEBAR & MAIN CATALOGUE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ==================================================================== */}
        {/* LEFT COLUMN: FILTERS & SORTING SIDEBAR */}
        {/* ==================================================================== */}
        <aside
          className={`lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-5 ${
            showMobileSidebar ? "block" : "hidden lg:block"
          }`}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Filter & Sort</h2>
            </div>
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
              >
                Reset All
              </button>
            )}
          </div>

          {/* 1. Sorting Parameter */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
              Sort By Parameter
            </label>
            <div className="relative">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full pl-8 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="default">Default (Newest)</option>
                <option value="price_asc">Price: Low to High (₹ ↑)</option>
                <option value="price_desc">Price: High to Low (₹ ↓)</option>
                <option value="stock_desc">Stock: High to Low</option>
                <option value="stock_asc">Stock: Low to High (Alert)</option>
                <option value="discount_desc">Discount: Highest % Off</option>
                <option value="name_asc">Name: A to Z</option>
                <option value="name_desc">Name: Z to A</option>
                <option value="sold_desc">Best Sellers (Units Sold)</option>
              </select>
            </div>
          </div>

          {/* 2. Category Filter (Vertical List) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
              Categories
            </label>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === "all"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>All Categories</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    selectedCategory === "all"
                      ? "bg-emerald-700 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  {products.length}
                </span>
              </button>

              {categories.map(([cat, count]) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="truncate">{cat}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-emerald-700 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Brand Filter */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
              Brand
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="all">All Brands ({brands.length})</option>
              {brands.map(([b, count]) => (
                <option key={b} value={b}>
                  {b} ({count})
                </option>
              ))}
            </select>
          </div>

          {/* 4. Stock Status Filter */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
              Stock Availability
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: "all", label: "All Stock" },
                { id: "in_stock", label: "In Stock" },
                { id: "low_stock", label: "Low Stock" },
                { id: "out_of_stock", label: "Out of Stock" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedStock(item.id as StockFilter)}
                  className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg text-center cursor-pointer transition-all ${
                    selectedStock === item.id
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Unit / Packaging */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
              Packaging Unit
            </label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="all">All Units ({units.length})</option>
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* 6. Price Range Presets & Custom Inputs */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
              Price Range (₹)
            </label>
            <select
              value={selectedPricePreset}
              onChange={(e) => setSelectedPricePreset(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="all">All Prices</option>
              <option value="under_50">Under ₹50</option>
              <option value="50_150">₹50 – ₹150</option>
              <option value="150_300">₹150 – ₹300</option>
              <option value="300_500">₹300 – ₹500</option>
              <option value="above_500">Above ₹500</option>
            </select>

            <div className="flex items-center gap-1.5 pt-1 text-xs">
              <span className="text-slate-400">₹</span>
              <input
                type="number"
                placeholder="Min"
                value={minPriceInput}
                onChange={(e) => setMinPriceInput(e.target.value)}
                className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
              <span className="text-slate-400">to</span>
              <span className="text-slate-400">₹</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPriceInput}
                onChange={(e) => setMaxPriceInput(e.target.value)}
                className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          {/* 7. Deals & Discounts */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
              Offers & Deals
            </label>
            <select
              value={selectedDeal}
              onChange={(e) => setSelectedDeal(e.target.value as DealFilter)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="all">All Products</option>
              <option value="discounted">On Sale (Below MRP)</option>
              <option value="big_discount">Big Deals (≥ 10% Off)</option>
            </select>
          </div>

          {/* 8. Hide Out of Stock Checkbox */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={hideOutOfStock}
                onChange={(e) => setHideOutOfStock(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Hide Out of Stock items</span>
            </label>
          </div>
        </aside>

        {/* ==================================================================== */}
        {/* RIGHT COLUMN: MAIN SEARCH & CATALOGUE AREA */}
        {/* ==================================================================== */}
        <main className="lg:col-span-9 space-y-4">
          {/* Top Search & Display Controls Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Small Sleek Search by Name */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search item name, Hindi (आटा, तेल), brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Toggle + Items per page */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-white dark:bg-slate-900 text-emerald-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="Grid Cards"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    viewMode === "table"
                      ? "bg-white dark:bg-slate-900 text-emerald-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="Ledger Table"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>

              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <option value={12}>12 / page</option>
                <option value={24}>24 / page</option>
                <option value={48}>48 / page</option>
                <option value={-1}>All items</option>
              </select>
            </div>
          </div>

          {/* Active Filter Badges */}
          {hasActiveFilters && (
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-[11px] font-bold text-slate-400">Active:</span>

              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] font-semibold">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery("")}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedCategory !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 text-[11px] font-semibold">
                  {selectedCategory}
                  <button onClick={() => setSelectedCategory("all")}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedBrand !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 text-[11px] font-semibold">
                  Brand: {selectedBrand}
                  <button onClick={() => setSelectedBrand("all")}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedStock !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 text-[11px] font-semibold">
                  Stock: {selectedStock}
                  <button onClick={() => setSelectedStock("all")}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedPricePreset !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 text-[11px] font-semibold">
                  {selectedPricePreset}
                  <button onClick={() => setSelectedPricePreset("all")}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                onClick={resetAllFilters}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 ml-auto cursor-pointer"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-900 dark:text-white">{filteredProducts.length}</strong> of{" "}
              {products.length} products
            </span>
            {filteredProducts.length > 0 && itemsPerPage !== -1 && (
              <span>
                Page {currentPage} of {totalPages}
              </span>
            )}
          </div>

          {/* Catalogue Grid or Table */}
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600" />
              Loading catalogue items...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-3">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                No matching products found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No items match your active search or filter criteria. Try resetting filters.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={resetAllFilters}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            /* CARD GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {paginatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} onStockUpdated={fetchProducts} />
              ))}
            </div>
          ) : (
            /* LEDGER TABLE VIEW WITH LINK TO DETAIL PAGE */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Item & Hindi Name</th>
                      <th className="py-3 px-4">Brand & Category</th>
                      <th className="py-3 px-4">Unit</th>
                      <th className="py-3 px-4">MRP</th>
                      <th className="py-3 px-4">Selling Price</th>
                      <th className="py-3 px-4">Live Stock</th>
                      <th className="py-3 px-4 text-center">Quick Stock Adjust</th>
                      <th className="py-3 px-4 text-right">Detail / Edit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedProducts.map((p) => {
                      const isEditing = editingProductId === p.id;
                      const isLowStock =
                        p.availableStock > 0 && p.availableStock <= (p.minStockAlert || 5);
                      const isOutStock = p.availableStock <= 0;

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Item Name */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {p.primaryImageUrl ? (
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 pointer-events-none select-none">
                                  <img
                                    src={p.primaryImageUrl}
                                    alt={p.name}
                                    className="w-full h-full object-cover pointer-events-none"
                                  />
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                                  <Package className="w-5 h-5" />
                                </div>
                              )}
                              <div>
                                <Link
                                  href={`/admin/products/${p.id}`}
                                  className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 transition-colors flex items-center gap-1 group"
                                >
                                  <span>{p.name}</span>
                                  <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100" />
                                </Link>
                                {p.hindiName && (
                                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                    {p.hindiName}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Brand & Category */}
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {p.brand || "—"}
                            </span>
                            <div className="text-[11px] text-slate-400">{p.categoryName}</div>
                          </td>

                          {/* Unit */}
                          <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-400">
                            {p.unit}
                          </td>

                          {/* MRP */}
                          <td className="py-3 px-4 text-slate-400 line-through">₹{p.mrp}</td>

                          {/* Selling Price */}
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editPrice}
                                onChange={(e) => setEditPrice(Number(e.target.value))}
                                className="w-20 px-2 py-1 rounded border border-emerald-500 bg-white dark:bg-slate-800 text-xs font-bold"
                              />
                            ) : (
                              <span className="font-black text-slate-900 dark:text-white text-sm">
                                ₹{p.sellingPrice}
                              </span>
                            )}
                          </td>

                          {/* Live Stock */}
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editStock}
                                onChange={(e) => setEditStock(Number(e.target.value))}
                                className="w-16 px-2 py-1 rounded border border-emerald-500 bg-white dark:bg-slate-800 text-xs font-bold"
                              />
                            ) : (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  isOutStock
                                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                    : isLowStock
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                }`}
                              >
                                {p.availableStock} {p.unit}
                              </span>
                            )}
                          </td>

                          {/* Quick Stock Adjust Buttons */}
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => handleQuickDeduct(p.id)}
                                disabled={p.availableStock <= 0}
                                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-600 text-slate-600 text-[11px] font-bold transition-colors disabled:opacity-30 cursor-pointer"
                              >
                                -1 Sold
                              </button>
                              <button
                                onClick={() => handleQuickRestock(p.id)}
                                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 hover:text-emerald-600 text-slate-600 text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                +10 Restock
                              </button>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            {isEditing ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => handleSaveInlineEdit(p.id)}
                                  className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingProductId(null)}
                                  className="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 text-[11px] cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1">
                                <Link
                                  href={`/admin/products/${p.id}`}
                                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                  title="View product details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Link>
                                <button
                                  onClick={() => {
                                    setEditingProductId(p.id);
                                    setEditPrice(p.sellingPrice);
                                    setEditStock(p.availableStock);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                                  title="Edit price or stock"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredProducts.length > 0 && itemsPerPage !== -1 && totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-medium">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of{" "}
                {filteredProducts.length} items
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          currentPage === pageNum
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    pageNum === currentPage - 2 ||
                    pageNum === currentPage + 2
                  ) {
                    return (
                      <span key={pageNum} className="px-1 text-slate-400 text-xs">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
