// ============================================================================
// Frontend API Client (Backend REST with direct Supabase fallback)
// ============================================================================

import { ProductFormData, ProductItem, OrderInput, OrderRecord } from "@/types";
import { createClient } from "@supabase/supabase-js";

const API_BASE = typeof window !== "undefined" ? "/api" : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000") + "/api";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Fast fetch with timeout
async function fetchWithTimeout(resource: string, options: RequestInit = {}, timeout = 2500) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

export class ApiClient {
  static async getProducts(shopId?: string): Promise<ProductItem[]> {
    // 1. Try Backend API first
    try {
      const res = await fetchWithTimeout(`${API_BASE}/products?shopId=${shopId || ""}`);
      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.length > 0) return data.data;
      }
    } catch (err) {
      console.log("[ApiClient]: Backend unreachable, falling back to direct Supabase client");
    }

    // 2. Direct Supabase Query Fallback
    try {
      const { data, error } = await supabaseClient
        .from("products")
        .select("*, categories:category_id (name)")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((p: any) => ({
          id: p.id,
          shopId: p.shop_id,
          name: p.name,
          hindiName: p.hindi_name,
          brand: p.brand || "",
          categoryId: p.category_id,
          categoryName: p.categories?.name || "General",
          unit: p.unit,
          unitStep: Number(p.unit_step || 1.0),
          mrp: Number(p.mrp),
          sellingPrice: Number(p.selling_price),
          availableStock: Number(p.available_stock),
          soldCount: Number(p.sold_count || 0),
          minStockAlert: Number(p.min_stock_alert || 5),
          isAvailable: p.is_available,
          barcode: p.barcode,
          description: p.description,
          aliases: p.aliases || [],
          primaryImageUrl: p.primary_image_url,
          imageAspectRatio: p.image_aspect_ratio || "1:1",
          imageCount: p.image_count || 1,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        }));
      }
    } catch (supErr) {
      console.warn("[ApiClient]: Supabase direct fallback failed", supErr);
    }

    return [];
  }

  static async getProductById(productId: string): Promise<ProductItem | null> {
    // 1. Try Backend API
    try {
      const res = await fetchWithTimeout(`${API_BASE}/products/${productId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.data) return data.data;
      }
    } catch (e) {}

    // 2. Try Supabase directly
    try {
      const { data, error } = await supabaseClient
        .from("products")
        .select("*, categories:category_id (name)")
        .eq("id", productId)
        .single();

      if (!error && data) {
        return {
          id: data.id,
          shopId: data.shop_id,
          name: data.name,
          hindiName: data.hindi_name,
          brand: data.brand || "",
          categoryId: data.category_id,
          categoryName: data.categories?.name || "General",
          unit: data.unit,
          unitStep: Number(data.unit_step || 1.0),
          mrp: Number(data.mrp),
          sellingPrice: Number(data.selling_price),
          availableStock: Number(data.available_stock),
          soldCount: Number(data.sold_count || 0),
          minStockAlert: Number(data.min_stock_alert || 5),
          isAvailable: data.is_available,
          barcode: data.barcode,
          description: data.description,
          aliases: data.aliases || [],
          primaryImageUrl: data.primary_image_url,
          imageAspectRatio: data.image_aspect_ratio || "1:1",
          imageCount: data.image_count || 1,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (e) {}

    return null;
  }

  static async getOrders(shopId?: string): Promise<OrderRecord[]> {
    // 1. Try Backend API first
    try {
      const res = await fetchWithTimeout(`${API_BASE}/orders?shopId=${shopId || ""}`);
      if (res.ok) {
        const data = await res.json();
        if (data.data && data.data.length > 0) return data.data;
      }
    } catch (err) {
      console.log("[ApiClient]: Backend unreachable, falling back to direct Supabase for orders");
    }

    // 2. Direct Supabase Query Fallback
    try {
      const { data, error } = await supabaseClient
        .from("orders")
        .select(`
          id,
          order_number,
          shop_id,
          customer_name,
          customer_phone,
          delivery_address,
          subtotal,
          delivery_fee,
          total_amount,
          status,
          payment_mode,
          payment_status,
          raw_transcript,
          detected_language,
          is_voice_order,
          created_at,
          items:order_items (
            id,
            product_id,
            product_name,
            unit,
            quantity,
            unit_price,
            total_price
          )
        `)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((o: any) => ({
          id: o.id,
          orderNumber: o.order_number,
          shopId: o.shop_id,
          customerName: o.customer_name,
          customerPhone: o.customer_phone,
          deliveryAddress: o.delivery_address,
          subtotal: Number(o.subtotal),
          deliveryFee: Number(o.delivery_fee || 0),
          totalAmount: Number(o.total_amount),
          status: o.status,
          paymentMode: o.payment_mode,
          paymentStatus: o.payment_status,
          rawTranscript: o.raw_transcript,
          detectedLanguage: o.detected_language,
          isVoiceOrder: o.is_voice_order,
          createdAt: o.created_at,
          items: (o.items || []).map((it: any) => ({
            id: it.id,
            productId: it.product_id,
            productName: it.product_name,
            unit: it.unit,
            quantity: Number(it.quantity),
            unitPrice: Number(it.unit_price),
            totalPrice: Number(it.total_price),
          })),
        }));
      }
    } catch (supErr) {
      console.warn("[ApiClient]: Supabase direct fallback failed for orders", supErr);
    }

    return [];
  }

  static async createProduct(product: ProductFormData): Promise<ProductItem> {
    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
      const data = await res.json();
      if (res.ok) return data.data;
    } catch (e) {}

    // Direct Supabase Insert fallback
    const { data: newProd, error } = await supabaseClient
      .from("products")
      .insert({
        shop_id: product.shopId || "00000000-0000-0000-0000-000000000001",
        name: product.name,
        hindi_name: product.hindiName || null,
        brand: product.brand || null,
        category_id: product.categoryId || null,
        unit: product.unit,
        unit_step: product.unitStep || 1.0,
        mrp: Number(product.mrp),
        selling_price: Number(product.sellingPrice),
        available_stock: Number(product.availableStock),
        sold_count: 0,
        min_stock_alert: Number(product.minStockAlert || 5),
        is_available: Number(product.availableStock) > 0,
        barcode: product.barcode || null,
        description: product.description || null,
        aliases: product.aliases || [],
        primary_image_url:
          product.primaryImageUrl ||
          "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
        image_aspect_ratio: product.imageAspectRatio || "1:1",
      })
      .select()
      .single();

    if (error || !newProd) throw new Error(error?.message || "Product creation failed");
    return {
      ...product,
      id: newProd.id,
      createdAt: newProd.created_at,
      updatedAt: newProd.updated_at,
    };
  }

  static async deductStock(productId: string, units: number) {
    try {
      await fetch(`${API_BASE}/products/${productId}/sold`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ units }),
      });
    } catch (e) {
      // Direct Supabase update
      const { data: prod } = await supabaseClient
        .from("products")
        .select("available_stock, sold_count")
        .eq("id", productId)
        .single();
      if (prod) {
        const newAvail = Math.max(0, Number(prod.available_stock) - units);
        const newSold = Number(prod.sold_count || 0) + units;
        await supabaseClient
          .from("products")
          .update({ available_stock: newAvail, sold_count: newSold, is_available: newAvail > 0 })
          .eq("id", productId);
      }
    }
  }

  static async restockUnits(productId: string, units: number) {
    try {
      await fetch(`${API_BASE}/products/${productId}/restock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ units }),
      });
    } catch (e) {
      const { data: prod } = await supabaseClient
        .from("products")
        .select("available_stock")
        .eq("id", productId)
        .single();
      if (prod) {
        const newAvail = Number(prod.available_stock) + units;
        await supabaseClient
          .from("products")
          .update({ available_stock: newAvail, is_available: true })
          .eq("id", productId);
      }
    }
  }

  static async transcribeAudio(audioBase64: string, language: string = "hi-IN") {
    const res = await fetch(`${API_BASE}/gnani/stt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audioBase64, language }),
    });
    return res.json();
  }

  static async extractOrder(transcript: string) {
    const res = await fetch(`${API_BASE}/gnani/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    });
    return res.json();
  }

  static async createOrder(order: OrderInput): Promise<OrderRecord> {
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });
      const data = await res.json();
      if (res.ok) return data.data;
    } catch (e) {}

    // Direct Supabase fallback
    const subtotal = order.items.reduce((acc, it) => acc + it.totalPrice, 0);
    const { data: ord, error: ordErr } = await supabaseClient
      .from("orders")
      .insert({
        shop_id: order.shopId,
        customer_name: order.customerName,
        customer_phone: order.customerPhone,
        delivery_address: order.deliveryAddress,
        raw_transcript: order.rawTranscript,
        detected_language: order.detectedLanguage || "hi-IN",
        is_voice_order: order.isVoiceOrder,
        subtotal,
        delivery_fee: 0,
        total_amount: subtotal,
        status: "PLACED",
        payment_mode: order.paymentMode,
        payment_status: "UNPAID",
      })
      .select()
      .single();

    if (ordErr || !ord) throw new Error(ordErr?.message || "Order placement failed");

    const itemRows = order.items.map((it) => ({
      order_id: ord.id,
      product_id: it.productId && !it.productId.startsWith("unmatched") ? it.productId : null,
      product_name: it.productName,
      unit: it.unit,
      quantity: it.quantity,
      unit_price: it.unitPrice,
      total_price: it.totalPrice,
    }));
    await supabaseClient.from("order_items").insert(itemRows);

    for (const it of order.items) {
      if (it.productId && !it.productId.startsWith("unmatched")) {
        await this.deductStock(it.productId, it.quantity);
      }
    }

    return {
      id: ord.id,
      orderNumber: ord.order_number,
      ...order,
      detectedLanguage: order.detectedLanguage || "hi-IN",
      subtotal,
      deliveryFee: 0,
      totalAmount: subtotal,
      status: "PLACED",
      paymentStatus: "UNPAID",
      createdAt: ord.created_at,
    };
  }

  static async updateOrder(
    orderId: string,
    updates: {
      status?: string;
      paymentStatus?: string;
      paymentMode?: string;
      deliveryAddress?: string;
      customerName?: string;
      customerPhone?: string;
    }
  ): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        return data.data;
      }
    } catch (e) {
      console.warn("[ApiClient]: Failed to patch /api/orders, falling back to direct Supabase");
    }

    // Direct Supabase fallback
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.paymentStatus !== undefined) updatePayload.payment_status = updates.paymentStatus;
    if (updates.paymentMode !== undefined) updatePayload.payment_mode = updates.paymentMode;
    if (updates.deliveryAddress !== undefined) updatePayload.delivery_address = updates.deliveryAddress;
    if (updates.customerName !== undefined) updatePayload.customer_name = updates.customerName;
    if (updates.customerPhone !== undefined) updatePayload.customer_phone = updates.customerPhone;

    const { data, error } = await supabaseClient
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
