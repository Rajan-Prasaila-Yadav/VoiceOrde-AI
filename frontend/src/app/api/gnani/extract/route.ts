import { NextResponse } from "next/server";

const GNANI_API_KEY = process.env.GNANI_API_KEY || "";
const GNANI_EVON_URL =
  process.env.GNANI_EVON_LLM_URL || "https://api.gnani.ai/v1/chat/completions";

const HINDI_NUMBER_PATTERNS = [
  { regex: /(^|\s|[^a-zA-Z0-9\u0900-\u097F])(दस|dus|das|ten|10)($|\s|[^a-zA-Z0-9\u0900-\u097F])/i, val: 10 },
  { regex: /(^|\s|[^a-zA-Z0-9\u0900-\u097F])(नौ|nau|nine|9)($|\s|[^a-zA-Z0-9\u0900-\u097F])/i, val: 9 },
  { regex: /(^|\s|[^a-zA-Z0-9\u0900-\u097F])(आठ|aath|eight|8)($|\s|[^a-zA-Z0-9\u0900-\u097F])/i, val: 8 },
  { regex: /(^|\s|[^a-zA-Z0-9\u0900-\u097F])(सात|saat|seven|7)($|\s|[^a-zA-Z0-9\u0900-\u097F])/i, val: 7 },
  { regex: /(^|\s|[^a-zA-Z0-9\u0900-\u097F])(छह|छः|che|chheh|six|6)($|\s|[^a-zA-Z0-9\u0900-\u097F])/i, val: 6 },
  { regex: /(^|\s|[^a-zA-Z0-9\u0900-\u097F])(पाँच|पांच|paanch|panch|five|5)($|\s|[^a-zA-Z0-9\u0900-\u097F])/i, val: 5 },
  { regex: /(^|\s|[^a-zA-Z0-9\u0900-\u097F])(चार|chaar|char|four|4)($|\s|[^a-zA-Z0-9\u0900-\u097F])/i, val: 4 },
  { regex: /(^|\s|[^a-zA-Z0-9\u0900-\u097F])(तीन|teen|three|3)($|\s|[^a-zA-Z0-9\u0900-\u097F])/i, val: 3 },
  { regex: /(^|\s|[^a-zA-Z0-9\u0900-\u097F])(दो|do|टू|two|2)($|\s|[^a-zA-Z0-9\u0900-\u097F])/i, val: 2 },
  { regex: /(^|\s|[^a-zA-Z0-9\u0900-\u097F])(एक|ek|वन|one|1)($|\s|[^a-zA-Z0-9\u0900-\u097F])/i, val: 1 },
  { regex: /(^|\s|[^a-zA-Z0-9\u0900-\u097F])(आधा|aadha|adha|half|0\.5)($|\s|[^a-zA-Z0-9\u0900-\u097F])/i, val: 0.5 },
  { regex: /(^|\s|[^a-zA-Z0-9\u0900-\u097F])(पाव|paav|pav|0\.25)($|\s|[^a-zA-Z0-9\u0900-\u097F])/i, val: 0.25 },
];

const KNOWN_GROCERY_KEYWORDS: Array<{ keys: string[]; label: string; defaultUnit: string }> = [
  { keys: ["आशीर्वाद आटा", "aashirvaad", "आटा", "atta", "aata", "gehu"], label: "Atta", defaultUnit: "kg" },
  { keys: ["अमूल बटर", "amul butter", "बटर", "butter", "makhan"], label: "Amul Butter", defaultUnit: "packet" },
  { keys: ["चीनी", "cheeni", "chini", "sugar"], label: "Sugar", defaultUnit: "kg" },
  { keys: ["fortune", "फॉर्च्यून", "mustard oil", "सरसों का तेल", "सरसों तेल", "sarson", "तेल", "oil"], label: "Mustard Oil", defaultUnit: "litre" },
  { keys: ["tata salt", "टाटा नमक", "नमक", "namak", "salt"], label: "Tata Salt", defaultUnit: "packet" },
  { keys: ["toor dal", "tuvar dal", "arhar", "अरहर दाल", "तूर दाल", "तूवर दाल", "दाल", "dal"], label: "Toor Dal", defaultUnit: "kg" },
  { keys: ["red label", "रेड लेबल", "chai patti", "chai", "tea", "चाय पत्ती", "चाय"], label: "Red Label Tea", defaultUnit: "packet" },
  { keys: ["parle g", "parle-g", "पारले जी", "पारले", "biscuit", "बिस्कुट"], label: "Parle G Biscuits", defaultUnit: "packet" },
  { keys: ["amul taaza", "amul milk", "amul doodh", "taaza", "दूध", "doodh", "milk"], label: "Amul Taaza Milk", defaultUnit: "litre" },
  { keys: ["amul pure ghee", "amul ghee", "desi ghee", "घी", "ghee"], label: "Amul Pure Ghee", defaultUnit: "litre" },
  { keys: ["everest garam masala", "garam masala", "pav bhaji masala", "everest", "मसाला", "masala"], label: "Everest Garam Masala", defaultUnit: "packet" },
  { keys: ["india gate", "basmati", "बासमती", "चावल", "chawal", "rice"], label: "Basmati Rice", defaultUnit: "kg" },
  { keys: ["paneer", "पनीर"], label: "Paneer", defaultUnit: "packet" },
  { keys: ["surf excel", "detergent", "soap", "साबुन"], label: "Detergent", defaultUnit: "packet" },
];

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json({ success: false, error: "Transcript is required" }, { status: 400 });
    }

    const cleanInput = transcript.trim();

    // 1. If Gnani API Key is present, try remote Evon LLM
    if (GNANI_API_KEY && GNANI_API_KEY !== "gnani-mock-key" && !GNANI_API_KEY.includes("your-")) {
      try {
        const prompt = `You are an Indian kirana grocery order assistant. Parse this spoken order: "${cleanInput}".
Return ONLY a valid JSON array of objects with keys: "spokenItem" (string), "quantity" (number), "unit" ("kg"|"litre"|"packet"|"g"|"piece").
No markdown backticks, only JSON array.`;

        const response = await fetch(GNANI_EVON_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": GNANI_API_KEY,
            Authorization: `Bearer ${GNANI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "evon-v3.3",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
          }),
        });

        if (response.ok) {
          const resData = await response.json();
          const content =
            resData.choices?.[0]?.message?.content ||
            resData.content ||
            "";
          const match = content.match(/\[[\s\S]*\]/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return NextResponse.json({ success: true, items: parsed });
            }
          }
        }
      } catch (e) {
        console.warn("Gnani remote LLM extraction skipped, using intelligent parser");
      }
    }

    // 2. High-Precision Indian Spoken Clause Parser
    // Split on commas, Hindi full stops, newlines, or words: aur, और, tatha, तथा, and, with, plus, +
    const clauses = cleanInput
      .split(/(?:[,|।\n]|\s+(?:aur|और|tatha|तथा|and|with|plus|\+)\s+)/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 1);

    const items: Array<{ spokenItem: string; quantity: number; unit: string }> = [];

    for (const clause of clauses) {
      const lower = clause.toLowerCase();

      // Detect quantity
      let detectedQty = 1;
      const numMatch = lower.match(/(?:^|\s)(\d+(?:\.\d+)?)(?:\s|$)/);
      if (numMatch) {
        detectedQty = parseFloat(numMatch[1]);
      } else {
        for (const hp of HINDI_NUMBER_PATTERNS) {
          if (hp.regex.test(` ${lower} `)) {
            detectedQty = hp.val;
            break;
          }
        }
      }

      // Detect unit
      let detectedUnit = "packet";
      if (/kilo|kg|किलो|kgs/i.test(lower)) {
        detectedUnit = "kg";
      } else if (/litre|liter|लीटर|ltr|\bl\b/i.test(lower)) {
        detectedUnit = "litre";
      } else if (/packet|पैकेट|pkt|packets|pack/i.test(lower)) {
        detectedUnit = "packet";
      } else if (/gram|ग्राम|gm|\bg\b/i.test(lower)) {
        detectedUnit = "g";
      } else if (/piece|पीस|pieces|bottle|box|दर्जन|dozen/i.test(lower)) {
        detectedUnit = "piece";
      }

      // Detect item
      let matchedLabel: string | null = null;
      for (const itemDef of KNOWN_GROCERY_KEYWORDS) {
        for (const k of itemDef.keys) {
          if (lower.includes(k.toLowerCase())) {
            matchedLabel = itemDef.label;
            if (detectedUnit === "packet" && itemDef.defaultUnit !== "packet") {
              detectedUnit = itemDef.defaultUnit;
            }
            break;
          }
        }
        if (matchedLabel) break;
      }

      // If matched, push identified item
      if (matchedLabel) {
        const already = items.find((it) => it.spokenItem === matchedLabel);
        if (already) {
          already.quantity += detectedQty;
        } else {
          items.push({
            spokenItem: matchedLabel,
            quantity: detectedQty,
            unit: detectedUnit,
          });
        }
      } else {
        // Fallback: clean out quantities, units and filler words
        const cleaned = clause
          .replace(/(?:^|\s)(\d+(?:\.\d+)?)(?:\s|$)/g, " ")
          .replace(
            /\b(ek|do|teen|chaar|char|paanch|panch|che|saat|aath|nau|dus|das|aadha|adha|half|paav|pav|one|two|three|four|five|ten)\b/gi,
            " "
          )
          .replace(/\b(एक|दो|तीन|चार|पाँच|पांच|छह|सात|आठ|नौ|दस|आधा|पाव)\b/g, " ")
          .replace(/\b(kilo|kg|किलो|litre|liter|लीटर|ltr|packet|पैकेट|pkt|gram|ग्राम|gm|piece|pieces|packets|pack)\b/gi, " ")
          .replace(/\b(chahiye|चाहिए|dedo|de do|दे दो|lao|dena|mangwa do|bhej do|kripya|please|plz)\b/gi, " ")
          .replace(/\s+/g, " ")
          .trim();

        if (cleaned.length > 1) {
          items.push({
            spokenItem: cleaned,
            quantity: detectedQty,
            unit: detectedUnit,
          });
        }
      }
    }

    // Default safety fallback if nothing could be parsed
    if (items.length === 0) {
      items.push({
        spokenItem: cleanInput.slice(0, 30),
        quantity: 1,
        unit: "piece",
      });
    }

    return NextResponse.json({ success: true, count: items.length, items });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
