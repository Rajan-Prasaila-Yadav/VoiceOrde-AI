import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wbkyektreqlpylbclvic.supabase.co";
const supabaseAnonKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6India3lla3RyZXFscHlsYmNsdmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2ODUwNDEsImV4cCI6MjEwODI2MTA0MX0.YGhtexU-VlBfcefCnHr6uNhiXQgV_FMmB1hOQAxA5Ew";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const units = Number(body.units || 10);

    const { data: prod, error: fetchErr } = await supabase
      .from("products")
      .select("available_stock")
      .eq("id", id)
      .single();

    if (fetchErr || !prod) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    const newAvail = Number(prod.available_stock) + units;

    const { error: updateErr } = await supabase
      .from("products")
      .update({
        available_stock: newAvail,
        is_available: true,
      })
      .eq("id", id);

    if (updateErr) throw updateErr;

    return NextResponse.json({
      success: true,
      message: `Restocked ${units} units`,
      newAvailableStock: newAvail,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
