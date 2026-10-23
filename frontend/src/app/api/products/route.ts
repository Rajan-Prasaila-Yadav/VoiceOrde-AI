import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wbkyektreqlpylbclvic.supabase.co";
const supabaseAnonKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6India3lla3RyZXFscHlsYmNsdmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2ODUwNDEsImV4cCI6MjEwODI2MTA0MX0.YGhtexU-VlBfcefCnHr6uNhiXQgV_FMmB1hOQAxA5Ew";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(req: Request) {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories:category_id (name)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const formatted = (data || []).map((p: any) => ({
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

    return NextResponse.json({ success: true, count: formatted.length, data: formatted });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { data, error } = await supabase
      .from("products")
      .insert({
        shop_id: body.shopId || "00000000-0000-0000-0000-000000000001",
        name: body.name,
        hindi_name: body.hindiName || null,
        brand: body.brand || null,
        category_id: body.categoryId || null,
        unit: body.unit,
        unit_step: body.unitStep || 1.0,
        mrp: Number(body.mrp),
        selling_price: Number(body.sellingPrice),
        available_stock: Number(body.availableStock),
        sold_count: 0,
        min_stock_alert: Number(body.minStockAlert || 5),
        is_available: Number(body.availableStock) > 0,
        barcode: body.barcode || null,
        description: body.description || null,
        aliases: body.aliases || [],
        primary_image_url:
          body.primaryImageUrl ||
          "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
        image_aspect_ratio: body.imageAspectRatio || "1:1",
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
