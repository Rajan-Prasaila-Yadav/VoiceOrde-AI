import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const userEmail = user?.email?.toLowerCase() || "";

      // Check if Admin
      if (userEmail === "rajanprasaila@gmail.com") {
        return NextResponse.redirect(`${origin}/admin/products`);
      }

      // Check Customer Profile completion status
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("is_profile_completed")
        .eq("email", userEmail)
        .maybeSingle();

      if (!profile || !profile.is_profile_completed) {
        return NextResponse.redirect(`${origin}/profile/complete`);
      }

      return NextResponse.redirect(`${origin}/`);
    }
  }

  // Return the user to home with error flag if code exchange fails
  return NextResponse.redirect(`${origin}/?auth_error=true`);
}
