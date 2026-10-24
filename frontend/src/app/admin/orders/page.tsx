"use client";

import React, { useState, useEffect, useMemo } from "react";
import { OrderRecord } from "@/types";
import { ApiClient } from "@/lib/api-client";
import {
  ClipboardList,
  RefreshCw,
  CheckCircle2,
  CheckCircle,
  Clock,
  Phone,
  MapPin,
  IndianRupee,
  Search,
  Filter,
  ArrowUpDown,
  X,
  CreditCard,
  QrCode,
  Banknote,
  Receipt,
  TrendingUp,
  Mic,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Package,
  Truck,
  Store,
  AlertCircle,
} from "lucide-react";

type OrderSort = "newest" | "oldest" | "amount_desc" | "amount_asc" | "items_desc";

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState<"all" | "voice" | "counter">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "yesterday" | "week">("all");
  const [sortBy, setSortBy] = useState<OrderSort>("newest");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.getOrders();
      setOrders(data);
    } catch (e) {
      console.warn("Failed to fetch orders:", e);
    } finally {
      setLoading(false);
    }
  };

  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const isPickupOrder = (order?: OrderRecord | null) => {
    if (!order) return false;
    const addr = (order.deliveryAddress || "").toLowerCase();
    return addr.includes("pickup") || addr.includes("दुकान") || addr.includes("store");
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: "PLACED" | "ACCEPTED" | "PACKING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED"
  ) => {
    setUpdatingOrderId(orderId);
    try {
      await ApiClient.updateOrder(orderId, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleUpdatePaymentStatus = async (
    orderId: string,
    paymentStatus: "UNPAID" | "PAID" | "PARTIALLY_PAID",
    paymentMode?: "CASH" | "UPI_QR" | "CREDIT_UDHAAR"
  ) => {
    setUpdatingOrderId(orderId);
    try {
      const payload: any = { paymentStatus };
      if (paymentMode) payload.paymentMode = paymentMode;
      await ApiClient.updateOrder(orderId, payload);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, paymentStatus, ...(paymentMode ? { paymentMode } : {}) }
            : o
        )
      );
    } catch (err: any) {
      alert("Failed to update payment: " + err.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, paymentFilter, channelFilter, dateFilter, sortBy, itemsPerPage]);

  // Summary Metrics
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const upiCount = orders.filter((o) => o.paymentMode === "UPI_QR").length;
    const cashCount = orders.filter((o) => o.paymentMode === "CASH").length;
    const creditCount = orders.filter((o) => o.paymentMode === "CREDIT_UDHAAR").length;
    const voiceCount = orders.filter((o) => Boolean(o.isVoiceOrder || o.rawTranscript)).length;

    return { totalOrders, totalRevenue, avgOrderValue, upiCount, cashCount, creditCount, voiceCount };
  }, [orders]);

  // Filter & Sort Pipeline
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;
    const startOfWeek = now.getTime() - 7 * 86400000;

    return orders
      .filter((o) => {
        // 1. Text Search across Order #, Customer Name, Phone, Delivery Address, Spoken Speech, Item Name
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchNum = o.orderNumber ? String(o.orderNumber).includes(q) : false;
          const matchCust = o.customerName ? o.customerName.toLowerCase().includes(q) : false;
          const matchPhone = o.customerPhone ? o.customerPhone.toLowerCase().includes(q) : false;
          const matchAddr = o.deliveryAddress ? o.deliveryAddress.toLowerCase().includes(q) : false;
          const matchItems = o.items ? o.items.some((it) => it.productName.toLowerCase().includes(q)) : false;
          const matchTranscript = o.rawTranscript ? o.rawTranscript.toLowerCase().includes(q) : false;

          if (!matchNum && !matchCust && !matchPhone && !matchAddr && !matchItems && !matchTranscript) {
            return false;
          }
        }

        // 2. Status Filter
        if (statusFilter !== "all" && o.status !== statusFilter) {
          return false;
        }

        // 3. Payment Mode Filter
        if (paymentFilter !== "all" && o.paymentMode !== paymentFilter) {
          return false;
        }

        // 4. Order Channel (Voice vs Counter Desk)
        const isVoice = Boolean(o.isVoiceOrder || o.rawTranscript);
        if (channelFilter === "voice" && !isVoice) return false;
        if (channelFilter === "counter" && isVoice) return false;

        // 5. Date Range Filter
        const orderTime = new Date(o.createdAt).getTime();
        if (dateFilter === "today" && orderTime < startOfToday) return false;
        if (dateFilter === "yesterday" && (orderTime < startOfYesterday || orderTime >= startOfToday))
          return false;
        if (dateFilter === "week" && orderTime < startOfWeek) return false;

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case "oldest":
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case "amount_desc":
            return b.totalAmount - a.totalAmount;
          case "amount_asc":
            return a.totalAmount - b.totalAmount;
          case "items_desc":
            return (b.items?.length || 0) - (a.items?.length || 0);
          default:
            return 0;
        }
      });
  }, [orders, searchQuery, statusFilter, paymentFilter, channelFilter, dateFilter, sortBy]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "all" ||
    paymentFilter !== "all" ||
    channelFilter !== "all" ||
    dateFilter !== "all" ||
    sortBy !== "newest";

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPaymentFilter("all");
    setChannelFilter("all");
    setDateFilter("all");
    setSortBy("newest");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white break-words">
              Orders & Stock Deduction Audit
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
              Live Ledger
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time feed of placed voice orders, speech transcripts, and automated stock deductions.
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
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Feed</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => resetFilters()}
          className="p-3.5 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-left cursor-pointer hover:border-slate-300 transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Orders</span>
            <Receipt className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">{stats.totalOrders}</div>
          <span className="text-[10px] text-slate-400">All recorded orders</span>
        </button>

        <div className="p-3.5 rounded-2xl border bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Sales</span>
            <span className="text-xs font-bold text-emerald-400">₹</span>
          </div>
          <div className="text-xl font-black text-emerald-400">
            ₹{stats.totalRevenue.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-slate-400">Avg ₹{stats.avgOrderValue} / order</span>
        </div>

        <button
          onClick={() => setPaymentFilter("UPI_QR")}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            paymentFilter === "UPI_QR"
              ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              UPI / QR
            </span>
            <QrCode className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
            {stats.upiCount}
          </div>
          <span className="text-[10px] text-slate-400">Digital payments</span>
        </button>

        <button
          onClick={() => setChannelFilter("voice")}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            channelFilter === "voice"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Voice Orders
            </span>
            <Mic className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.voiceCount}
          </div>
          <span className="text-[10px] text-slate-400">Spoken in Hindi/Hinglish</span>
        </button>
      </div>

      {/* 2-COLUMN SIDEBAR & ORDERS FEED LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ==================================================================== */}
        {/* LEFT COLUMN: FILTERS & SORTING SIDEBAR */}
        {/* ==================================================================== */}
        <aside
          className={`lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-5 ${
            showMobileSidebar ? "block" : "hidden lg:block"
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Filter & Sort</h2>
            </div>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
              >
                Reset All
              </button>
            )}
          </div>

          {/* 1. Sort Orders */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
              Sort Orders
            </label>
            <div className="relative">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as OrderSort)}
                className="w-full pl-8 pr-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount_desc">Amount: High to Low (₹ ↓)</option>
                <option value="amount_asc">Amount: Low to High (₹ ↑)</option>
                <option value="items_desc">Most Items First</option>
              </select>
            </div>
          </div>

          {/* 2. Order Status Filter */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
              Order Status
            </label>
            <div className="space-y-1">
              {[
                { id: "all", label: "All Statuses" },
                { id: "DELIVERED", label: "Delivered" },
                { id: "PACKING", label: "Packing / Confirmed" },
                { id: "PLACED", label: "Placed / Pending" },
                { id: "CANCELLED", label: "Cancelled" },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === st.id
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{st.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      statusFilter === st.id
                        ? "bg-emerald-700 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    {st.id === "all" ? orders.length : orders.filter((o) => o.status === st.id).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Payment Mode Filter */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
              Payment Mode
            </label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="all">All Payments ({orders.length})</option>
              <option value="UPI_QR">UPI / QR ({stats.upiCount})</option>
              <option value="CASH">Cash ({stats.cashCount})</option>
              <option value="CREDIT_UDHAAR">Udhaar / Credit ({stats.creditCount})</option>
            </select>
          </div>

          {/* 4. Order Channel (Voice vs Counter) */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
              Order Source
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setChannelFilter("all")}
                className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg text-center cursor-pointer ${
                  channelFilter === "all"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600"
                }`}
              >
                All Sources
              </button>
              <button
                onClick={() => setChannelFilter("voice")}
                className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg text-center cursor-pointer ${
                  channelFilter === "voice"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600"
                }`}
              >
                Voice AI
              </button>
            </div>
          </div>

          {/* 5. Date Range Filter */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
              Date Period
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Past 7 Days</option>
            </select>
          </div>
        </aside>

        {/* ==================================================================== */}
        {/* RIGHT COLUMN: MAIN ORDERS FEED */}
        {/* ==================================================================== */}
        <main className="lg:col-span-9 space-y-4">
          {/* Top Search Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by order #, customer name, phone, item name, speech..."
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

            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0 cursor-pointer"
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
            </select>
          </div>

          {/* Active Filter Chips */}
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

              {statusFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 text-[11px] font-semibold">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter("all")}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {paymentFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 text-[11px] font-semibold">
                  Payment: {paymentFilter}
                  <button onClick={() => setPaymentFilter("all")}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {channelFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] font-semibold">
                  Source: Voice Orders
                  <button onClick={() => setChannelFilter("all")}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                onClick={resetFilters}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 ml-auto cursor-pointer"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-900 dark:text-white">{filteredOrders.length}</strong> of{" "}
              {orders.length} orders
            </span>
            {filteredOrders.length > 0 && (
              <span>
                Page {currentPage} of {totalPages}
              </span>
            )}
          </div>

          {/* Orders Feed */}
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600" />
              Loading orders feed...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-3">
              <ClipboardList className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                No matching orders found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No orders match your filter criteria. Try clearing filters or searching for another customer name.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-base text-slate-900 dark:text-white">
                        Order #{order.orderNumber}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          order.status === "DELIVERED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : order.status === "OUT_FOR_DELIVERY"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            : order.status === "PACKING"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : order.status === "CANCELLED"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {isPickupOrder(order) && order.status === "DELIVERED"
                          ? "Picked Up from Store"
                          : isPickupOrder(order) && order.status === "OUT_FOR_DELIVERY"
                          ? "Ready at Store"
                          : order.status}
                      </span>

                      {/* Fulfillment Badge */}
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        {isPickupOrder(order) ? (
                          <>
                            <Store className="w-3 h-3 text-amber-600" />
                            <span>Store Pickup</span>
                          </>
                        ) : (
                          <>
                            <Truck className="w-3 h-3 text-blue-600" />
                            <span>Home Delivery</span>
                          </>
                        )}
                      </span>

                      {/* Payment Status & Mode Badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                          order.paymentStatus === "PAID"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : order.paymentMode === "CREDIT_UDHAAR"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {order.paymentMode === "UPI_QR" && <QrCode className="w-3 h-3" />}
                        {order.paymentMode === "CASH" && <Banknote className="w-3 h-3" />}
                        {order.paymentMode === "CREDIT_UDHAAR" && <CreditCard className="w-3 h-3" />}
                        <span>
                          {order.paymentStatus === "PAID"
                            ? `Paid (${order.paymentMode})`
                            : order.paymentMode === "CREDIT_UDHAAR"
                            ? "Udhaar Khata (उधार)"
                            : `Left / Unpaid (${order.paymentMode})`}
                        </span>
                      </span>

                      {order.isVoiceOrder && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center gap-1">
                          <Mic className="w-3 h-3" />
                          <span>Voice Order</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(order.createdAt).toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {/* Customer and Delivery info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {order.customerName}
                      </span>
                      <span>({order.customerPhone})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{order.deliveryAddress}</span>
                    </div>
                  </div>

                  {/* Spoken Transcript if voice order */}
                  {order.rawTranscript && (
                    <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        Spoken Request (बोलकर दिया गया ऑर्डर):
                      </span>{" "}
                      "{order.rawTranscript}"
                    </div>
                  )}

                  {/* Items Table with deduction badge */}
                  <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-3.5 space-y-2 text-xs">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Ordered Items & Stock Deductions
                    </div>
                    {order.items.map((it, i) => (
                      <div
                        key={i}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 py-1 border-b border-slate-200/40 dark:border-slate-700/40 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="text-xs">
                            <strong className="text-slate-900 dark:text-white">{it.productName}</strong>{" "}
                            <span className="text-slate-500">— {it.quantity} {it.unit} @ ₹{it.unitPrice}</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2 pl-3.5 sm:pl-0">
                          <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
                            -{it.quantity} stock deducted
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white text-xs">
                            ₹{it.totalPrice}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Grand Total */}
                  <div className="flex items-center justify-between pt-2 text-sm font-black text-slate-900 dark:text-white">
                    <span>Grand Total</span>
                    <span className="text-emerald-600 dark:text-emerald-400 text-base">
                      ₹{order.totalAmount}
                    </span>
                  </div>

                  {/* Shopkeeper Live Workflow Action Controls: Status & Payment Actions */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                    {/* Status Actions */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                        Order Status:
                      </span>

                      {order.status !== "PACKING" && order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateOrderStatus(order.id, "PACKING")}
                          disabled={updatingOrderId === order.id}
                          className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1 shadow-2xs"
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>Pack Items (पैकिंग शुरू)</span>
                        </button>
                      )}

                      {order.status !== "OUT_FOR_DELIVERY" && order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateOrderStatus(order.id, "OUT_FOR_DELIVERY")}
                          disabled={updatingOrderId === order.id}
                          className="px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800 cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1 shadow-2xs"
                        >
                          {isPickupOrder(order) ? (
                            <>
                              <Store className="w-3.5 h-3.5" />
                              <span>Ready for Store Pickup (दुकान पर तैयार)</span>
                            </>
                          ) : (
                            <>
                              <Truck className="w-3.5 h-3.5" />
                              <span>Dispatch / Out for Delivery (डिस्पैच / रास्ते में)</span>
                            </>
                          )}
                        </button>
                      )}

                      {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateOrderStatus(order.id, "DELIVERED")}
                          disabled={updatingOrderId === order.id}
                          className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm disabled:opacity-50 transition-all flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{isPickupOrder(order) ? "Customer Picked Up (प्राप्त किया)" : "Delivered (वितरित)"}</span>
                        </button>
                      )}

                      {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
                        <button
                          type="button"
                          onClick={() => handleUpdateOrderStatus(order.id, "CANCELLED")}
                          disabled={updatingOrderId === order.id}
                          className="px-2 py-1 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer disabled:opacity-50 transition-all"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>

                    {/* Payment Actions */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                        Payment:
                      </span>

                      {order.paymentStatus !== "PAID" ? (
                        <button
                          type="button"
                          onClick={() => handleUpdatePaymentStatus(order.id, "PAID")}
                          disabled={updatingOrderId === order.id}
                          className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1 shadow-2xs"
                        >
                          <IndianRupee className="w-3.5 h-3.5" />
                          <span>Mark Paid (भुगतान प्राप्त • चुकता)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleUpdatePaymentStatus(order.id, "UNPAID")}
                          disabled={updatingOrderId === order.id}
                          className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1 shadow-2xs"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Mark as Left (बकाया)</span>
                        </button>
                      )}

                      {order.paymentMode !== "CREDIT_UDHAAR" && (
                        <button
                          type="button"
                          onClick={() => handleUpdatePaymentStatus(order.id, "UNPAID", "CREDIT_UDHAAR")}
                          disabled={updatingOrderId === order.id}
                          className="px-2.5 py-1 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800 cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1 shadow-2xs"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Record as Udhaar (उधार खाता)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredOrders.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-medium">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of{" "}
                {filteredOrders.length} orders
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
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
                ))}

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
