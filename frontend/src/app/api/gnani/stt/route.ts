import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { audioBase64, language = "hi-IN" } = await req.json();

    if (!audioBase64) {
      return NextResponse.json({ success: false, error: "Audio data is required" }, { status: 400 });
    }

    // In local dev/mock without Gnani audio credentials, return fallback transcript
    return NextResponse.json({
      success: true,
      transcript: "दो किलो आटा, एक पैकेट अमूल बटर और एक किलो चीनी चाहिए",
      language,
      confidence: 0.95,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
