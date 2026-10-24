import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(req: Request) {
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

    if (error) throw error;

    const formatted = (data || []).map((o: any) => ({
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

    return NextResponse.json({ success: true, count: formatted.length, data: formatted });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ success: false, error: "Order must contain items" }, { status: 400 });
    }

    const subtotal = body.items.reduce((acc: number, it: any) => acc + Number(it.totalPrice), 0);

    const finalTotal = body.totalAmount !== undefined ? Number(body.totalAmount) : subtotal;
    const finalDiscount = Number(body.discount || 0);
    const finalDeliveryFee = Number(body.deliveryFee || 0);
    const finalPaymentStatus = body.paymentStatus || "UNPAID";

    const { data: ord, error: ordErr } = await supabase
      .from("orders")
      .insert({
        shop_id: body.shopId || "00000000-0000-0000-0000-000000000001",
        customer_name: body.customerName,
        customer_phone: body.customerPhone,
        delivery_address: body.deliveryAddress,
        raw_transcript: body.rawTranscript,
        detected_language: body.detectedLanguage || "hi-IN",
        is_voice_order: body.isVoiceOrder !== undefined ? body.isVoiceOrder : true,
        subtotal,
        delivery_fee: finalDeliveryFee,
        total_amount: finalTotal,
        status: body.status || "PLACED",
        payment_mode: body.paymentMode || "CASH",
        payment_status: finalPaymentStatus,
      })
      .select()
      .single();

    if (ordErr || !ord) throw new Error(ordErr?.message || "Order placement failed");

    // Insert order items
    const itemRows = body.items.map((it: any) => ({
      order_id: ord.id,
      product_id: it.productId && !it.productId.startsWith("unmatched") ? it.productId : null,
      product_name: it.productName,
      unit: it.unit,
      quantity: Number(it.quantity),
      unit_price: Number(it.unitPrice),
      total_price: Number(it.totalPrice),
    }));

    await supabase.from("order_items").insert(itemRows);

    // Deduct stock for each product
    for (const it of body.items) {
      if (it.productId && !it.productId.startsWith("unmatched")) {
        const { data: prod } = await supabase
          .from("products")
          .select("available_stock, sold_count")
          .eq("id", it.productId)
          .single();

        if (prod) {
          const newAvail = Math.max(0, Number(prod.available_stock) - Number(it.quantity));
          const newSold = Number(prod.sold_count || 0) + Number(it.quantity);
          await supabase
            .from("products")
            .update({
              available_stock: newAvail,
              sold_count: newSold,
              is_available: newAvail > 0,
            })
            .eq("id", it.productId);
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: ord.id,
          orderNumber: ord.order_number,
          ...body,
          subtotal,
          discount: finalDiscount,
          deliveryFee: finalDeliveryFee,
          totalAmount: finalTotal,
          paymentMode: ord.payment_mode,
          paymentStatus: ord.payment_status,
          status: ord.status,
          createdAt: ord.created_at,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
