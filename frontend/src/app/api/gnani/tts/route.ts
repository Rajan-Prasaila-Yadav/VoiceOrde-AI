import { NextResponse } from "next/server";

const VALID_PRODUCTION_KEY =
  "vach_1ytE2CY5X2DI0qFn3rQBO2t2ILc3nxcyuNCs3CrIOSSVRgGLhI5X8MT7peB0vPMtToo7De0ZlgUNcGcSpxq2M6c4PeNG3ZGy_ea8f9ec0a443e461fcee1d85f4bcb75d";

const GNANI_TIMBRE_URL = "https://api.vachana.ai/api/v1/tts/inference";

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

    // Always use verified valid Gnani API Key (override placeholder env values)
    const envKey = process.env.GNANI_API_KEY;
    const apiKey =
      envKey && envKey.startsWith("vach_") && !envKey.includes("your-")
        ? envKey
        : VALID_PRODUCTION_KEY;

    // Call Real Gnani Timbre TTS REST API
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
          "X-API-Key-ID": apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuf).toString("base64");

        return NextResponse.json({
          success: true,
          provider: `Gnani AI ${selectedModel}`,
          model: selectedModel,
          voice: selectedVoice,
          audioBase64: base64Audio,
          mimeType: "audio/wav",
          audioUrl: `data:audio/wav;base64,${base64Audio}`,
        });
      } else {
        const errText = await res.text();
        console.error(`[Gnani Timbre API ${res.status}]:`, errText);
        return NextResponse.json(
          {
            success: false,
            error: `Gnani API error (${res.status}): ${errText}`,
            model: selectedModel,
            voice: selectedVoice,
          },
          { status: res.status }
        );
      }
    } catch (err: any) {
      console.error("[Gnani Timbre fetch error]:", err.message);
      return NextResponse.json(
        {
          success: false,
          error: `Network error reaching Gnani Timbre: ${err.message}`,
          model: selectedModel,
          voice: selectedVoice,
        },
        { status: 502 }
      );
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
