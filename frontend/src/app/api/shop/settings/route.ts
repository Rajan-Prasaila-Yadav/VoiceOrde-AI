import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

const DEFAULT_SHOP_ID =
  process.env.NEXT_PUBLIC_DEFAULT_SHOP_ID || "00000000-0000-0000-0000-000000000001";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET() {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        id: DEFAULT_SHOP_ID,
        name: "Sharma Kirana Store",
        ownerName: "Ramesh Sharma",
        phone: "+919876543210",
        whatsappNumber: "+919876543210",
        email: "sharmakirana@gmail.com",
        address: "Shop 12, Main Bazaar, Near Clock Tower",
        landmark: "Opposite SBI Bank",
        pincode: "110001",
        googleMapsUrl: "https://maps.google.com/?q=28.6139,77.2090",
        imageUrl:
          "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80",
        qrImageUrl:
          "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=sharmakirana@upi&pn=SharmaKiranaStore&cu=INR",
        upiId: "sharmakirana@upi",
      });
    }

    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .eq("id", DEFAULT_SHOP_ID)
      .maybeSingle();

    if (error || !data) {
      // Fallback to first shop if ID mismatch
      const { data: firstShop } = await supabase.from("shops").select("*").limit(1).maybeSingle();
      if (firstShop) {
        return NextResponse.json(mapShop(firstShop));
      }
    }

    return NextResponse.json(mapShop(data || {}));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const updatePayload: Record<string, any> = {
      name: body.name,
      owner_name: body.ownerName,
      phone: body.phone,
      whatsapp_number: body.whatsappNumber,
      email: body.email,
      address: body.address,
      landmark: body.landmark,
      pincode: body.pincode,
      google_maps_url: body.googleMapsUrl,
      image_url: body.imageUrl,
      qr_image_url: body.qrImageUrl,
      upi_id: body.upiId,
      updated_at: new Date().toISOString(),
    };

    if (supabaseUrl && supabaseAnonKey) {
      const { data, error } = await supabase
        .from("shops")
        .update(updatePayload)
        .eq("id", DEFAULT_SHOP_ID)
        .select()
        .single();

      if (error) {
        // Try updating first shop
        await supabase.from("shops").update(updatePayload).limit(1);
      }
    }

    return NextResponse.json({ success: true, shop: body });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function mapShop(s: any) {
  return {
    id: s.id || DEFAULT_SHOP_ID,
    name: s.name || "Sharma Kirana Store",
    ownerName: s.owner_name || "Ramesh Sharma",
    phone: s.phone || "+919876543210",
    whatsappNumber: s.whatsapp_number || s.phone || "+919876543210",
    email: s.email || "sharmakirana@gmail.com",
    address: s.address || "Shop 12, Main Bazaar, Near Clock Tower",
    landmark: s.landmark || "Opposite SBI Bank",
    pincode: s.pincode || "110001",
    googleMapsUrl: s.google_maps_url || "https://maps.google.com/?q=28.6139,77.2090",
    imageUrl:
      s.image_url ||
      "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80",
    qrImageUrl:
      s.qr_image_url ||
      "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=sharmakirana@upi&pn=SharmaKiranaStore&cu=INR",
    upiId: s.upi_id || "sharmakirana@upi",
  };
}
