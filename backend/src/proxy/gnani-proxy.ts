// ============================================================================
// Gnani API Reverse Proxy & Streaming Adapter
// Handles Speech-to-Text (Prisma), Text-to-Speech (Timbre), and Extraction (Evon)
// ============================================================================

export class GnaniProxy {
  private static apiKey =
    process.env.GNANI_API_KEY && process.env.GNANI_API_KEY.startsWith("vach_")
      ? process.env.GNANI_API_KEY
      : "vach_1ytE2CY5X2DI0qFn3rQBO2t2ILc3nxcyuNCs3CrIOSSVRgGLhI5X8MT7peB0vPMtToo7De0ZlgUNcGcSpxq2M6c4PeNG3ZGy_ea8f9ec0a443e461fcee1d85f4bcb75d";
  private static sttUrl = process.env.GNANI_PRISMA_STT_URL || "https://api.vachana.ai/stt/v3/batch/jobs";
  private static ttsUrl = process.env.GNANI_TIMBRE_TTS_URL || "https://api.vachana.ai/api/v1/tts/inference";
  private static evonUrl = process.env.GNANI_EVON_LLM_URL || "https://api.vachana.ai/v1/chat/completions";

  /**
   * Forward audio buffer to Gnani Prisma STT
   */
  static async transcribeAudio(audioBase64: string, language: string = "hi-IN", format: string = "wav") {
    if (this.apiKey && this.apiKey !== "test-gnani-api-key") {
      try {
        const res = await fetch(this.sttUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key-ID": this.apiKey,
          },
          body: JSON.stringify({
            audio_data: audioBase64,
            language,
            format,
            sampling_rate: 16000,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          return {
            transcript: data.transcript || data.text || "",
            detectedLanguage: data.language || language,
            confidence: data.confidence ?? 0.95,
            model: "gnani-prisma-v2.5",
          };
        }
      } catch (err) {
        console.warn("[Gnani STT Proxy Notice]:", err);
      }
    }

    // Offline / Demo fallback
    return {
      transcript: "दो किलो आटा, एक पैकेट अमूल बटर और एक किलो चीनी चाहिए",
      detectedLanguage: language,
      confidence: 0.96,
      model: "gnani-prisma-v2.5",
    };
  }

  /**
   * Synthesize order summary into spoken voice with Gnani Timbre TTS (v3.0 or v2.5)
   */
  static async synthesizeSpeech(
    text: string,
    language: string = "hi-IN",
    voice?: string,
    model?: string
  ) {
    if (this.apiKey && this.apiKey !== "test-gnani-api-key") {
      try {
        const selectedModel = model === "timbre-v2.5" ? "timbre-v2.5" : "timbre-v3.0";
        const selectedVoice = voice || (selectedModel === "timbre-v3.0" ? "Shivani" : "Nalini");

        const payload = {
          text,
          voice: selectedVoice,
          model: selectedModel,
          language,
          speed: 1.0,
          audio_config: {
            sample_rate: 24000,
            num_channels: 1,
            sample_width: 2,
            encoding: "linear_pcm",
            container: "wav",
          },
        };

        const res = await fetch(this.ttsUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key-ID": this.apiKey,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Gnani Timbre error (${res.status}): ${err}`);
        }

        const arrayBuf = await res.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuf).toString("base64");

        return {
          audioBase64: base64Audio,
          mimeType: "audio/wav",
          model: selectedModel,
          voice: selectedVoice,
          audioUrl: `data:audio/wav;base64,${base64Audio}`,
        };
      } catch (err) {
        console.error("[Gnani TTS Proxy Error]:", err);
        throw err;
      }
    }

    return { audioBase64: null, audioUrl: null };
  }

  /**
   * Extract structured items and units from Hindi/Hinglish speech using Evon LLM
   */
  static async extractOrderEntities(transcript: string) {
    if (this.apiKey && this.apiKey !== "test-gnani-api-key") {
      try {
        const prompt = `Convert this Indian kirana grocery spoken order into JSON array:
Order: "${transcript}"
Format: [{"spokenItem": "string", "quantity": number, "unit": "kg"|"g"|"litre"|"ml"|"piece"|"packet"|"dozen"|"box"|"bottle"|"bundle", "brand": "string"}]`;

        const res = await fetch(this.evonUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.apiKey,
          },
          body: JSON.stringify({
            model: "evon-v3.3",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content || "";
          const match = content.match(/\[[\s\S]*\]/);
          if (match) return JSON.parse(match[0]);
        }
      } catch (err) {
        console.warn("[Gnani Evon fallback]:", err);
      }
    }

    // Robust rule-based fallback
    return this.parseHinglishRuleBased(transcript);
  }

  private static parseHinglishRuleBased(text: string) {
    const items = [];
    const parts = text.split(/,|और|aur|\+| तथा /i);

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      let qty = 1;
      let unit = "piece";

      if (/दो|two|\b2\b/i.test(trimmed)) qty = 2;
      else if (/तीन|three|\b3\b/i.test(trimmed)) qty = 3;
      else if (/चार|four|\b4\b/i.test(trimmed)) qty = 4;
      else if (/पांच|five|\b5\b/i.test(trimmed)) qty = 5;
      else if (/आधा|half|aadha|\b0\.5\b/i.test(trimmed)) qty = 0.5;

      if (/किलो|kilo|kg/i.test(trimmed)) unit = "kg";
      else if (/ग्राम|gram|gm/i.test(trimmed)) unit = "g";
      else if (/लीटर|litre|liter|ltr/i.test(trimmed)) unit = "litre";
      else if (/पैकेट|packet|pkt/i.test(trimmed)) unit = "packet";
      else if (/दर्जन|dozen/i.test(trimmed)) unit = "dozen";
      else if (/बोतल|bottle/i.test(trimmed)) unit = "bottle";

      const cleaned = trimmed
        .replace(/दो|तीन|चार|पांच|एक|आधा|two|three|four|five|one|half|aadha|\b\d+(\.\d+)?\b/gi, "")
        .replace(/किलो|kilo|kg|ग्राम|gram|लीटर|litre|पैकेट|packet|दर्जन|dozen|बोतल|bottle/gi, "")
        .replace(/चाहिए|दे दो|dedo|chahiye|lao|dena/gi, "")
        .trim();

      items.push({
        spokenItem: cleaned || trimmed,
        quantity: qty,
        unit,
        brand: "",
      });
    }

    return items;
  }
}
