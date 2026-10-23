import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 });
    }

    // Admin authentication
    if (email.toLowerCase() === "rajanprasaila@gmail.com" && password === "Rajan123@") {
      return NextResponse.json({
        success: true,
        user: {
          id: "admin-rajan-001",
          email: "rajanprasaila@gmail.com",
          fullName: "Rajan Prasaila (Admin)",
          role: "ADMIN",
        },
        token: "token_admin_rajanprasaila_session",
      });
    }

    return NextResponse.json({ success: false, error: "Invalid email or password credentials" }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
