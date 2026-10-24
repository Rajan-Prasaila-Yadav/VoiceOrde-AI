// ============================================================================
// Database & Storage Layer (Supabase REST + Prisma with in-memory fallback)
// ============================================================================

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { ProductInput } from "@/types";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

let prisma: PrismaClient | null = null;
try {
  prisma = new PrismaClient();
} catch (e) {
  console.warn("[Prisma]: Offline mode");
}

let memoryProducts: any[] = [];
let memoryOrders: any[] = [];

export class DatabaseService {
  // --- Products ---
  static async getProducts(shopId: string) {
    // 1. Try Supabase REST Client
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*, categories:category_id (name)")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((p) => ({
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
      } catch (err) {
        console.warn("[Supabase getProducts fallback]:", err);
      }
    }

    // 2. Try Prisma
    if (prisma) {
      try {
        const dbItems = await prisma.product.findMany({
          include: { category: true },
          orderBy: { createdAt: "desc" },
        });
        if (dbItems.length > 0) return dbItems;
      } catch (err) {}
    }

    // 3. Memory store
    return memoryProducts.filter((p) => !shopId || p.shopId === shopId);
  }

  static async createProduct(data: ProductInput, shopId: string) {
    const newProduct = {
      id: "prod-" + Date.now(),
      shopId,
      name: data.name,
      hindiName: data.hindiName || null,
      brand: data.brand || null,
      categoryId: data.categoryId || null,
      unit: data.unit,
      unitStep: data.unitStep || 1.0,
      mrp: Number(data.mrp),
      sellingPrice: Number(data.sellingPrice),
      availableStock: Number(data.availableStock),
      soldCount: 0,
      minStockAlert: Number(data.minStockAlert || 5),
      isAvailable: Number(data.availableStock) > 0,
      barcode: data.barcode || null,
      description: data.description || null,
      aliases: data.aliases || [],
      primaryImageUrl: data.primaryImageUrl || "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
      imageAspectRatio: data.imageAspectRatio || "1:1",
      imageCount: data.imageCount || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { data: inserted, error } = await supabase
          .from("products")
          .insert({
            shop_id: shopId,
            name: data.name,
            hindi_name: data.hindiName,
            brand: data.brand,
            category_id: data.categoryId,
            unit: data.unit,
            unit_step: data.unitStep || 1.0,
            mrp: data.mrp,
            selling_price: data.sellingPrice,
            available_stock: data.availableStock,
            sold_count: 0,
            min_stock_alert: data.minStockAlert || 5,
            is_available: Number(data.availableStock) > 0,
            barcode: data.barcode,
            description: data.description,
            aliases: data.aliases || [],
            primary_image_url: data.primaryImageUrl,
            image_aspect_ratio: data.imageAspectRatio || "1:1",
            image_count: data.imageCount || 1,
          })
          .select()
          .single();

        if (!error && inserted) {
          return { ...newProduct, id: inserted.id };
        }
      } catch (e) {}
    }

    memoryProducts.unshift(newProduct);
    return newProduct;
  }

  static async updateProduct(id: string, updates: Partial<ProductInput>) {
    if (supabase) {
      try {
        const updatePayload: any = { updated_at: new Date().toISOString() };
        if (updates.name) updatePayload.name = updates.name;
        if (updates.hindiName !== undefined) updatePayload.hindi_name = updates.hindiName;
        if (updates.brand) updatePayload.brand = updates.brand;
        if (updates.unit) updatePayload.unit = updates.unit;
        if (updates.sellingPrice !== undefined) updatePayload.selling_price = updates.sellingPrice;
        if (updates.mrp !== undefined) updatePayload.mrp = updates.mrp;
        if (updates.availableStock !== undefined) {
          updatePayload.available_stock = updates.availableStock;
          updatePayload.is_available = updates.availableStock > 0;
        }
        if (updates.primaryImageUrl) updatePayload.primary_image_url = updates.primaryImageUrl;

        await supabase.from("products").update(updatePayload).eq("id", id);
      } catch (e) {}
    }

    const item = memoryProducts.find((p) => p.id === id);
    if (item) {
      Object.assign(item, updates, { updatedAt: new Date().toISOString() });
    }
  }

  static async deleteProduct(id: string) {
    if (supabase) {
      try {
        await supabase.from("products").delete().eq("id", id);
      } catch (e) {}
    }
    memoryProducts = memoryProducts.filter((p) => p.id !== id);
  }

  static async deductStock(productId: string, quantity: number) {
    if (supabase) {
      try {
        const { data: prod } = await supabase
          .from("products")
          .select("available_stock, sold_count")
          .eq("id", productId)
          .single();

        if (prod) {
          const newAvail = Math.max(0, Number(prod.available_stock) - quantity);
          const newSold = Number(prod.sold_count || 0) + quantity;
          await supabase
            .from("products")
            .update({
              available_stock: newAvail,
              sold_count: newSold,
              is_available: newAvail > 0,
            })
            .eq("id", productId);
        }
      } catch (e) {}
    }

    const item = memoryProducts.find((p) => p.id === productId);
    if (item) {
      item.availableStock = Math.max(0, item.availableStock - quantity);
      item.soldCount = (item.soldCount || 0) + quantity;
      item.isAvailable = item.availableStock > 0;
      item.updatedAt = new Date().toISOString();
    }
  }

  static async restockUnits(productId: string, units: number) {
    if (supabase) {
      try {
        const { data: prod } = await supabase
          .from("products")
          .select("available_stock")
          .eq("id", productId)
          .single();

        if (prod) {
          const newAvail = Number(prod.available_stock) + units;
          await supabase
            .from("products")
            .update({
              available_stock: newAvail,
              is_available: true,
            })
            .eq("id", productId);
        }
      } catch (e) {}
    }

    const item = memoryProducts.find((p) => p.id === productId);
    if (item) {
      item.availableStock += units;
      item.isAvailable = true;
      item.updatedAt = new Date().toISOString();
    }
  }

  // --- Orders ---
  static async createOrder(orderData: any) {
    if (supabase) {
      try {
        const subtotal = orderData.items.reduce((acc: number, it: any) => acc + it.totalPrice, 0);
        const { data: ord, error: ordErr } = await supabase
          .from("orders")
          .insert({
            shop_id: orderData.shopId || "00000000-0000-0000-0000-000000000001",
            customer_name: orderData.customerName,
            customer_phone: orderData.customerPhone,
            delivery_address: orderData.deliveryAddress,
            raw_transcript: orderData.rawTranscript,
            detected_language: orderData.detectedLanguage || "hi-IN",
            is_voice_order: orderData.isVoiceOrder !== undefined ? orderData.isVoiceOrder : true,
            subtotal,
            delivery_fee: 0,
            total_amount: subtotal,
            status: "PLACED",
            payment_mode: orderData.paymentMode || "CASH",
            payment_status: "UNPAID",
          })
          .select()
          .single();

        if (!ordErr && ord) {
          const itemRows = orderData.items.map((it: any) => ({
            order_id: ord.id,
            product_id: it.productId && !it.productId.startsWith("unmatched") ? it.productId : null,
            product_name: it.productName,
            unit: it.unit,
            quantity: it.quantity,
            unit_price: it.unitPrice,
            total_price: it.totalPrice,
          }));
          await supabase.from("order_items").insert(itemRows);

          for (const item of orderData.items) {
            if (item.productId && !item.productId.startsWith("unmatched")) {
              await this.deductStock(item.productId, item.quantity);
            }
          }

          return {
            id: ord.id,
            orderNumber: ord.order_number,
            ...orderData,
            totalAmount: ord.total_amount,
            status: ord.status,
            createdAt: ord.created_at,
          };
        }
      } catch (e) {
        console.warn("createOrder Supabase error, falling back to memory:", e);
      }
    }

    const order = {
      id: "ord-" + Date.now(),
      orderNumber: memoryOrders.length + 101,
      ...orderData,
      subtotal: orderData.items.reduce((acc: number, it: any) => acc + it.totalPrice, 0),
      deliveryFee: 0,
      totalAmount: orderData.items.reduce((acc: number, it: any) => acc + it.totalPrice, 0),
      status: "PLACED",
      paymentStatus: "UNPAID",
      createdAt: new Date().toISOString(),
    };

    for (const item of orderData.items) {
      if (item.productId) {
        await this.deductStock(item.productId, item.quantity);
      }
    }

    memoryOrders.unshift(order);
    return order;
  }

  static async getOrders(shopId: string) {
    if (supabase) {
      try {
        const { data, error } = await supabase
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
      } catch (e) {
        console.warn("[getOrders Supabase error]:", e);
      }
    }
    return memoryOrders;
  }

  static async updateOrder(orderId: string, updates: any) {
    if (supabase) {
      try {
        const updatePayload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (updates.status !== undefined) updatePayload.status = updates.status;
        if (updates.paymentStatus !== undefined) updatePayload.payment_status = updates.paymentStatus;
        if (updates.paymentMode !== undefined) updatePayload.payment_mode = updates.paymentMode;
        if (updates.deliveryAddress !== undefined) updatePayload.delivery_address = updates.deliveryAddress;
        if (updates.customerName !== undefined) updatePayload.customer_name = updates.customerName;
        if (updates.customerPhone !== undefined) updatePayload.customer_phone = updates.customerPhone;

        const { data, error } = await supabase
          .from("orders")
          .update(updatePayload)
          .eq("id", orderId)
          .select()
          .single();

        if (!error && data) return data;
      } catch (e) {
        console.warn("[updateOrder Supabase error]:", e);
      }
    }

    const order = memoryOrders.find((o) => o.id === orderId);
    if (order) {
      Object.assign(order, updates, { updatedAt: new Date().toISOString() });
      return order;
    }
    return null;
  }
}
