// ============================================================================
// Gnani AI API Endpoints Router
// Direct endpoints communicating with Gnani Prisma STT, Timbre TTS, and Evon LLM
// ============================================================================

import { Router, Request, Response } from "express";
import { GnaniProxy } from "@/proxy/gnani-proxy";

export const gnaniRouter = Router();

// POST /api/gnani/stt
gnaniRouter.post("/stt", async (req: Request, res: Response) => {
  try {
    const { audioBase64, language = "hi-IN", format = "wav" } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ success: false, error: "Missing audioBase64 field" });
    }

    const result = await GnaniProxy.transcribeAudio(audioBase64, language, format);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/gnani/tts
gnaniRouter.post("/tts", async (req: Request, res: Response) => {
  try {
    const { text, language = "hi-IN", voice, model } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: "Missing text to synthesize" });
    }

    const result = await GnaniProxy.synthesizeSpeech(text, language, voice, model);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/gnani/extract
gnaniRouter.post("/extract", async (req: Request, res: Response) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ success: false, error: "Missing transcript to extract" });
    }

    const extracted = await GnaniProxy.extractOrderEntities(transcript);
    res.json({ success: true, count: extracted.length, items: extracted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
