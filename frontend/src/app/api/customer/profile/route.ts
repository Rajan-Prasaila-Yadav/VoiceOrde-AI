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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email query param required" }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        email,
        fullName: "",
        phone: "+91",
        whatsappNumber: "+91",
        address: "",
        pincode: "",
        landmark: "",
        googleMapsUrl: "",
        avatarUrl: "",
        isProfileCompleted: false,
      });
    }

    // Try finding profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (profile) {
      return NextResponse.json({
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name || "",
        phone: profile.phone || "+91",
        whatsappNumber: profile.whatsapp_number || profile.phone || "+91",
        address: profile.address || "",
        landmark: profile.landmark || "",
        pincode: profile.pincode || "",
        googleMapsUrl: profile.google_maps_url || "",
        avatarUrl: profile.avatar_url || "",
        isProfileCompleted: Boolean(profile.is_profile_completed),
      });
    }

    // Return empty profile ready to complete
    return NextResponse.json({
      email,
      fullName: "",
      phone: "+91",
      whatsappNumber: "+91",
      address: "",
      landmark: "",
      pincode: "",
      googleMapsUrl: "",
      avatarUrl: "",
      isProfileCompleted: false,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      email,
      fullName,
      phone,
      whatsappNumber,
      address,
      pincode,
      landmark,
      googleMapsUrl,
      avatarUrl,
    } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate 10 digit Indian number after +91
    const cleanPhone = (phone || "").replace(/^\+91/, "").replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit Indian mobile number." },
        { status: 400 }
      );
    }

    const formattedPhone = `+91${cleanPhone}`;
    const cleanWhatsApp = (whatsappNumber || phone || "").replace(/^\+91/, "").replace(/\D/g, "");
    const formattedWhatsApp = cleanWhatsApp.length === 10 ? `+91${cleanWhatsApp}` : formattedPhone;

    if (!fullName || !address || !pincode) {
      return NextResponse.json(
        { error: "Full Name, Address, and Pincode are mandatory to complete profile." },
        { status: 400 }
      );
    }

    if (supabaseUrl && supabaseAnonKey) {
      // 1. Update user_profiles
      await supabase.from("user_profiles").upsert(
        {
          email: email.toLowerCase(),
          full_name: fullName,
          phone: formattedPhone,
          whatsapp_number: formattedWhatsApp,
          address,
          pincode,
          landmark: landmark || "",
          google_maps_url: googleMapsUrl || "",
          avatar_url: avatarUrl || "",
          is_profile_completed: true,
        },
        { onConflict: "email" }
      );

      // 2. Also update or create customer record in customers table for billing
      await supabase.from("customers").upsert(
        {
          shop_id: DEFAULT_SHOP_ID,
          name: fullName,
          phone: formattedPhone,
          whatsapp_number: formattedWhatsApp,
          address,
          pincode,
          landmark: landmark || "",
          google_maps_url: googleMapsUrl || "",
          avatar_url: avatarUrl || "",
          email: email.toLowerCase(),
          is_profile_completed: true,
        },
        { onConflict: "shop_id,phone" }
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        email,
        fullName,
        phone: formattedPhone,
        whatsappNumber: formattedWhatsApp,
        address,
        pincode,
        landmark,
        googleMapsUrl,
        avatarUrl,
        isProfileCompleted: true,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
