"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  Printer,
  Share2,
  Phone,
  QrCode,
  Star,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  Store,
  MapPin,
  CreditCard,
  Banknote,
} from "lucide-react";
import { OrderRecord } from "@/types";
import { supabaseClient } from "@/lib/api-client";

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [filterPhone, setFilterPhone] = useState("");
  const [shopSettings, setShopSettings] = useState<any>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    // 1. Sync phone from Supabase auth session or localStorage
    const syncPhone = async () => {
      try {
        const { data: authData } = await supabaseClient.auth.getUser();
        const user = authData?.user;
        if (user) {
          const email = user.email || "";
          if (email) {
            const profileRes = await fetch(`/api/customer/profile?email=${encodeURIComponent(email)}`);
            if (profileRes.ok) {
              const prof = await profileRes.json();
              if (prof.phone && prof.phone !== "+91") {
                setFilterPhone(prof.phone);
                localStorage.setItem("voiceorder_customer_phone", prof.phone);
                return;
              }
            }
          }
          if (user.phone) {
            setFilterPhone(user.phone);
            localStorage.setItem("voiceorder_customer_phone", user.phone);
            return;
          }
        }
      } catch (e) {
        console.warn("Could not sync auth session in my-orders:", e);
      }
      const cachedPhone = localStorage.getItem("voiceorder_customer_phone") || "";
      if (cachedPhone) {
        setFilterPhone(cachedPhone);
      }
    };
    syncPhone();

    // 2. Fetch Shop Settings
    fetch("/api/shop/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setShopSettings(data);
      })
      .catch((e) => console.warn(e));

    // 3. Fetch Orders
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      const json = await res.json();
      if (json.data) {
        setOrders(json.data);
        if (json.data.length > 0 && !selectedOrder) {
          setSelectedOrder(json.data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (!filterPhone.trim()) return true;
    const cleanFilter = filterPhone.replace(/\D/g, "");
    const cleanPhone = (o.customerPhone || "").replace(/\D/g, "");
    return cleanPhone.includes(cleanFilter) || cleanFilter.includes(cleanPhone);
  });

  const isPickupOrder = (order?: OrderRecord | null) => {
    if (!order) return false;
    const addr = (order.deliveryAddress || "").toLowerCase();
    return addr.includes("pickup") || addr.includes("दुकान") || addr.includes("store");
  };

  const getStatusStepIndex = (status: string) => {
    switch (status) {
      case "PLACED":
        return 0;
      case "ACCEPTED":
        return 1;
      case "PACKING":
        return 2;
      case "OUT_FOR_DELIVERY":
        return 3;
      case "DELIVERED":
        return 4;
      default:
        return 0;
    }
  };

  const getStepsForOrder = (order?: OrderRecord | null) => {
    if (isPickupOrder(order)) {
      return [
        { label: "Placed", desc: "Order recorded (ऑर्डर दर्ज हुआ)" },
        { label: "Accepted", desc: "Store accepted (स्वीकृत)" },
        { label: "Packing", desc: "Gathering items (पैकिंग जारी)" },
        { label: "Ready at Store", desc: "Ready for Pickup (दुकान पर तैयार)" },
        { label: "Picked Up", desc: "Customer received (सामान प्राप्त किया)" },
      ];
    }
    return [
      { label: "Placed", desc: "Order recorded (ऑर्डर दर्ज हुआ)" },
      { label: "Accepted", desc: "Store accepted (स्वीकृत)" },
      { label: "Packing", desc: "Gathering items (पैकिंग जारी)" },
      { label: "Out for Delivery", desc: "On the way (डिस्पैच / रास्ते में)" },
      { label: "Delivered", desc: "Delivered to home (घर पहुँचाया गया)" },
    ];
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleShareWhatsApp = (order: OrderRecord) => {
    const text = `*Order #${order.orderNumber} Receipt*\nShop: ${
      shopSettings?.name || "Sharma Kirana Store"
    }\nTotal: ₹${order.totalAmount}\nStatus: ${order.status}\nItems:\n${order.items
      .map((it) => `• ${it.quantity} ${it.unit} ${it.productName} - ₹${it.totalPrice}`)
      .join("\n")}\n\nTrack your order: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleRate = (orderId: string, rating: number) => {
    setRatings((prev) => ({ ...prev, [orderId]: rating }));
    alert(`Thank you! Your ${rating}-star feedback has been recorded for the store.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-1">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Customer Order Hub</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            My Orders & Itemized Bills (ऑर्डर ट्रैकिंग व रसीद)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time delivery progress, printable thermal-receipts, and instant UPI payment.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all self-start sm:self-auto"
        >
          <span>Speak New Order</span>
        </Link>
      </div>

      {/* Filter by Phone */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Showing Orders for Phone:
          </span>
          <input
            type="text"
            placeholder="Filter by phone (e.g. 9812345678)"
            value={filterPhone}
            onChange={(e) => setFilterPhone(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44"
          />
        </div>
        <span className="text-xs text-slate-500">
          Found {filteredOrders.length} order{filteredOrders.length === 1 ? "" : "s"}
        </span>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          Loading your order history and live status...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              No orders found for this phone number
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Speak your first grocery order on the Voice Order Desk to get an instant itemized bill and live tracking.
            </p>
          </div>
          <Link
            href="/"
            className="inline-block px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
          >
            Start Voice Order
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Order List (Left 5 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            {filteredOrders.map((ord) => {
              const isSelected = selectedOrder?.id === ord.id;
              const stepIdx = getStatusStepIndex(ord.status);

              return (
                <div
                  key={ord.id}
                  onClick={() => setSelectedOrder(ord)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-md ring-2 ring-emerald-500/20"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-emerald-600 block">
                        #{ord.orderNumber}
                      </span>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        {ord.customerName}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white block">
                        ₹{ord.totalAmount}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Status, Fulfillment & Payment Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          ord.status === "DELIVERED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : ord.status === "OUT_FOR_DELIVERY"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            : ord.status === "PACKING"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {isPickupOrder(ord) && ord.status === "DELIVERED"
                          ? "Picked Up"
                          : isPickupOrder(ord) && ord.status === "OUT_FOR_DELIVERY"
                          ? "Ready at Store"
                          : ord.status}
                      </span>

                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        {isPickupOrder(ord) ? (
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
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                          ord.paymentStatus === "PAID"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            : ord.paymentMode === "CREDIT_UDHAAR"
                            ? "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                        }`}
                      >
                        {ord.paymentStatus === "PAID"
                          ? "Paid (चुकता)"
                          : ord.paymentMode === "CREDIT_UDHAAR"
                          ? "Udhaar (उधार खाता)"
                          : "Left (बकाया)"}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        • {ord.items.length} item{ord.items.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Order Details & Thermal Receipt (Right 7 Cols) */}
          {selectedOrder && (
            <div className="lg:col-span-7 space-y-6">
              {/* Live Tracking Stepper Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Live Delivery Progress
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Order #{selectedOrder.orderNumber}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        selectedOrder.status === "DELIVERED"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : selectedOrder.status === "OUT_FOR_DELIVERY"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                          : selectedOrder.status === "PACKING"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {isPickupOrder(selectedOrder) && selectedOrder.status === "DELIVERED"
                        ? "Picked Up From Store"
                        : isPickupOrder(selectedOrder) && selectedOrder.status === "OUT_FOR_DELIVERY"
                        ? "Ready for Store Pickup"
                        : selectedOrder.status}
                    </span>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        selectedOrder.paymentStatus === "PAID"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200"
                      }`}
                    >
                      {selectedOrder.paymentStatus === "PAID" ? "Payment Done" : "Payment Left"}
                    </span>
                  </div>
                </div>

                {/* Horizontal Stepper */}
                <div className="relative">
                  <div className="grid grid-cols-5 gap-1 text-center">
                    {getStepsForOrder(selectedOrder).map((st, idx) => {
                      const curIdx = getStatusStepIndex(selectedOrder.status);
                      const isComplete = idx <= curIdx;
                      const isCurrent = idx === curIdx;

                      return (
                        <div key={st.label} className="flex flex-col items-center">
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                              isComplete
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700"
                            } ${isCurrent ? "ring-4 ring-emerald-500/20 scale-110" : ""}`}
                          >
                            {isComplete ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                          </div>
                          <span
                            className={`text-[11px] font-bold mt-1.5 leading-tight ${
                              isComplete
                                ? "text-slate-900 dark:text-white"
                                : "text-slate-400"
                            }`}
                          >
                            {st.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Rating after delivery */}
                {selectedOrder.status === "DELIVERED" && (
                  <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                        How was your order experience?
                      </span>
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                        Rate delivery & item freshness
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRate(selectedOrder.id, star)}
                          className="p-1 text-amber-400 hover:scale-125 transition-transform cursor-pointer"
                        >
                          <Star
                            className="w-5 h-5"
                            fill={
                              (ratings[selectedOrder.id] || 0) >= star
                                ? "currentColor"
                                : "none"
                            }
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Printable Itemized Bill (Thermal Receipt Standard) */}
              <div
                id="printable-bill"
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5"
              >
                {/* Actions Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Itemized Tax Invoice & Receipt
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleShareWhatsApp(selectedOrder)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      onClick={handlePrintReceipt}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold cursor-pointer hover:opacity-90 shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Bill</span>
                    </button>
                  </div>
                </div>

                {/* Shop Information Header */}
                <div className="text-center space-y-1">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {shopSettings?.name || "Sharma Kirana Store"}
                  </h2>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {shopSettings?.address || "Shop 12, Main Bazaar, Example Town - 500001"}
                  </p>
                  <p className="text-xs font-mono text-slate-600 dark:text-slate-400">
                    Phone: {shopSettings?.phone || "+91 9876543210"}
                  </p>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                      Bill Number
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      #{selectedOrder.orderNumber}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                      Order Date & Time
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {new Date(selectedOrder.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                      Customer
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      {selectedOrder.customerName}
                    </span>
                    <span className="text-slate-500">{selectedOrder.customerPhone}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                      {isPickupOrder(selectedOrder) ? "Fulfillment Mode" : "Deliver To"}
                    </span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px] block truncate">
                      {selectedOrder.deliveryAddress || (isPickupOrder(selectedOrder) ? "Store Self-Pickup" : "Home Delivery")}
                    </span>
                  </div>
                </div>

                {/* Items Table */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3 font-bold text-slate-600 dark:text-slate-300">Item</th>
                        <th className="p-3 text-center font-bold text-slate-600 dark:text-slate-300">
                          Qty
                        </th>
                        <th className="p-3 text-right font-bold text-slate-600 dark:text-slate-300">
                          Rate
                        </th>
                        <th className="p-3 text-right font-bold text-slate-600 dark:text-slate-300">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedOrder.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-3 font-medium text-slate-900 dark:text-white">
                            {it.productName}
                          </td>
                          <td className="p-3 text-center text-slate-600 dark:text-slate-400">
                            {it.quantity} {it.unit}
                          </td>
                          <td className="p-3 text-right text-slate-600 dark:text-slate-400">
                            ₹{it.unitPrice}
                          </td>
                          <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                            ₹{it.totalPrice}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Breakdown */}
                <div className="space-y-1.5 text-xs pt-2">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span>₹{selectedOrder.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Delivery Fee</span>
                    <span>₹{selectedOrder.deliveryFee || 0}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span>Grand Total</span>
                    <span className="text-emerald-600">₹{selectedOrder.totalAmount}</span>
                  </div>
                </div>

                {/* Payment & QR Section */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Payment Mode
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedOrder.paymentMode === "UPI_QR"
                          ? "UPI Digital (GPay/PhonePe)"
                          : selectedOrder.paymentMode === "CREDIT_UDHAAR"
                          ? "Shop Udhaar Khata (उधार खाता)"
                          : "Cash on Delivery / Counter (नकद)"}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Payment Status
                      </span>
                      <span
                        className={`font-bold px-2.5 py-0.5 rounded text-[10px] uppercase ${
                          selectedOrder.paymentStatus === "PAID"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : selectedOrder.paymentMode === "CREDIT_UDHAAR"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}
                      >
                        {selectedOrder.paymentStatus === "PAID"
                          ? "Payment Done (चुकता)"
                          : selectedOrder.paymentMode === "CREDIT_UDHAAR"
                          ? "Udhaar Recorded (उधार में लिखा गया)"
                          : "Payment Left (बकाया • देय)"}
                      </span>
                    </div>
                  </div>

                  {/* UPI QR Display for Unpaid UPI Orders */}
                  {selectedOrder.paymentMode === "UPI_QR" && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-center space-y-2">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                        Scan to Pay with Any UPI App (GPay / PhonePe / Paytm)
                      </span>
                      <div className="w-36 h-36 mx-auto aspect-square rounded-2xl bg-white p-2 border border-slate-200 shadow-sm flex items-center justify-center">
                        <img
                          src={
                            shopSettings?.qrImageUrl ||
                            `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=${encodeURIComponent(
                              shopSettings?.upiId || "sharmakirana@upi"
                            )}&pn=SharmaKiranaStore&am=${selectedOrder.totalAmount}&cu=INR`
                          }
                          alt="Shop UPI QR"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-600 block">
                        UPI: {shopSettings?.upiId || "sharmakirana@upi"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer notes */}
                <div className="text-center pt-2 text-[10px] text-slate-400">
                  <p>Confirmed on screen via VoiceOrder AI • Thank you for your business!</p>
                  <p className="mt-1">For queries, call the store at {shopSettings?.phone || "+91 9876543210"}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
