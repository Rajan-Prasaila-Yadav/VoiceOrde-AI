import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: order, error } = await supabase
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
        discount,
        total_amount,
        status,
        payment_mode,
        payment_status,
        raw_transcript,
        detected_language,
        is_voice_order,
        created_at,
        updated_at,
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
      .eq("id", id)
      .single();

    if (error || !order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: order });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.status !== undefined) {
      updatePayload.status = body.status;
    }

    if (body.paymentStatus !== undefined) {
      updatePayload.payment_status = body.paymentStatus;
    }

    if (body.paymentMode !== undefined) {
      updatePayload.payment_mode = body.paymentMode;
    }

    if (body.deliveryAddress !== undefined) {
      updatePayload.delivery_address = body.deliveryAddress;
    }

    if (body.customerName !== undefined) {
      updatePayload.customer_name = body.customerName;
    }

    if (body.customerPhone !== undefined) {
      updatePayload.customer_phone = body.customerPhone;
    }

    const { data: updatedOrder, error } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error || !updatedOrder) {
      throw new Error(error?.message || "Failed to update order status");
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.order_number,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.payment_status,
        paymentMode: updatedOrder.payment_mode,
        deliveryAddress: updatedOrder.delivery_address,
        customerName: updatedOrder.customer_name,
        customerPhone: updatedOrder.customer_phone,
        updatedAt: updatedOrder.updated_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
