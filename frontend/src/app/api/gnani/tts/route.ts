import { NextResponse } from "next/server";

const GNANI_API_KEY =
  process.env.GNANI_API_KEY ||
  "vach_1ytE2CY5X2DI0qFn3rQBO2t2ILc3nxcyuNCs3CrIOSSVRgGLhI5X8MT7peB0vPMtToo7De0ZlgUNcGcSpxq2M6c4PeNG3ZGy_ea8f9ec0a443e461fcee1d85f4bcb75d";

const GNANI_TIMBRE_URL =
  process.env.GNANI_TIMBRE_TTS_URL || "https://api.vachana.ai/api/v1/tts/inference";

export async function POST(req: Request) {
  try {
    const { text, language = "hi-IN", voice, model } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ success: false, error: "Text is required" }, { status: 400 });
    }

    // Determine target Gnani voice model and speaker
    const selectedModel = model === "timbre-v2.5" ? "timbre-v2.5" : "timbre-v3.0";
    let selectedVoice = voice;
    if (!selectedVoice) {
      selectedVoice = selectedModel === "timbre-v3.0" ? "Shivani" : "Nalini";
    }

    // Clean text for speech synthesis
    const cleanText = text
      .replace(/[*_#`~•]/g, " ")
      .replace(/\([^)]*\)/g, " ")
      .replace(/₹\s*(\d+)/g, "$1 rupaye ")
      .replace(/₹/g, " rupaye ")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/[\\/|]/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\bdot\b/gi, "")
      .replace(/\.+$/g, "")
      .trim();

    if (!cleanText) {
      return NextResponse.json({ success: false, error: "No text to speak" }, { status: 400 });
    }

    // Call Real Gnani Timbre TTS REST API
    if (GNANI_API_KEY && !GNANI_API_KEY.includes("your-")) {
      try {
        const payload = {
          text: cleanText,
          voice: selectedVoice,
          model: selectedModel,
          language: language || "hi-IN",
          speed: 1.0,
          audio_config: {
            sample_rate: 24000,
            num_channels: 1,
            sample_width: 2,
            encoding: "linear_pcm",
            container: "wav",
          },
        };

        const res = await fetch(GNANI_TIMBRE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key-ID": GNANI_API_KEY,
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const arrayBuf = await res.arrayBuffer();
          const base64Audio = Buffer.from(arrayBuf).toString("base64");

          return NextResponse.json({
            success: true,
            provider: "Gnani AI Timbre v2.5",
            model: "timbre-v2.5",
            audioBase64: base64Audio,
            mimeType: "audio/wav",
            audioUrl: `data:audio/wav;base64,${base64Audio}`,
          });
        } else {
          const errText = await res.text();
          console.warn(`[Gnani Timbre API ${res.status}]:`, errText);
        }
      } catch (err: any) {
        console.warn("[Gnani Timbre fetch error]:", err.message);
      }
    }

    // Graceful fallback flag if Gnani API is unavailable or offline
    return NextResponse.json({
      success: true,
      provider: "Browser SpeechSynthesis",
      fallback: true,
      cleanText,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
