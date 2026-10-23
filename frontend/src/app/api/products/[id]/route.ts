import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wbkyektreqlpylbclvic.supabase.co";
const supabaseAnonKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6India3lla3RyZXFscHlsYmNsdmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2ODUwNDEsImV4cCI6MjEwODI2MTA0MX0.YGhtexU-VlBfcefCnHr6uNhiXQgV_FMmB1hOQAxA5Ew";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from("products")
      .select("*, categories:category_id (name)")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    const formatted = {
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

    return NextResponse.json({ success: true, data: formatted });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updatePayload: any = {};
    if (body.sellingPrice !== undefined) updatePayload.selling_price = Number(body.sellingPrice);
    if (body.mrp !== undefined) updatePayload.mrp = Number(body.mrp);
    if (body.availableStock !== undefined) {
      updatePayload.available_stock = Number(body.availableStock);
      updatePayload.is_available = Number(body.availableStock) > 0;
    }
    if (body.name) updatePayload.name = body.name;
    if (body.hindiName !== undefined) updatePayload.hindi_name = body.hindiName;
    if (body.brand !== undefined) updatePayload.brand = body.brand;
    if (body.primaryImageUrl) updatePayload.primary_image_url = body.primaryImageUrl;

    const { error } = await supabase.from("products").update(updatePayload).eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "Product updated successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
