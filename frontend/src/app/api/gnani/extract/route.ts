import { NextResponse } from "next/server";

const GNANI_API_KEY = process.env.GNANI_API_KEY || "gnani-mock-key";
const GNANI_EXTRACT_URL =
  process.env.GNANI_EXTRACT_URL || "https://api.gnani.ai/v1/extract";

const HINDI_NUMBER_MAP: Record<string, number> = {
  "ek": 1, "एक": 1, "वन": 1, "one": 1,
  "do": 2, "दो": 2, "टू": 2, "two": 2,
  "teen": 3, "तीन": 3, "three": 3,
  "chaar": 4, "char": 4, "चार": 4, "four": 4,
  "paanch": 5, "panch": 5, "पाँच": 5, "पांच": 5, "five": 5,
  "che": 6, "chheh": 6, "छह": 6, "six": 6,
  "saat": 7, "सात": 7, "seven": 7,
  "aath": 8, "आठ": 8, "eight": 8,
  "nau": 9, "नौ": 9, "nine": 9,
  "dus": 10, "das": 10, "दस": 10, "ten": 10,
  "aadha": 0.5, "adha": 0.5, "आधा": 0.5, "half": 0.5,
  "paav": 0.25, "pav": 0.25, "पाव": 0.25,
};

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json({ success: false, error: "Transcript is required" }, { status: 400 });
    }

    // 1. Try Gnani Evon LLM API if key is configured
    if (process.env.GNANI_API_KEY && process.env.GNANI_API_KEY !== "gnani-mock-key") {
      try {
        const response = await fetch(GNANI_EXTRACT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GNANI_API_KEY}`,
          },
          body: JSON.stringify({
            prompt: `Extract grocery items, numeric quantities, and units from this spoken Kirana order transcript: "${transcript}". Return JSON array with fields: spokenItem, quantity (number), unit.`,
          }),
        });

        if (response.ok) {
          const gnaniJson = await response.json();
          if (gnaniJson.items) {
            return NextResponse.json({ success: true, items: gnaniJson.items });
          }
        }
      } catch (err) {
        console.warn("Gnani remote API failed, falling back to intelligent rule extractor");
      }
    }

    // 2. Intelligent Indian Spoken Order Parser
    const clauses = transcript
      .split(/[,।aur\s+और\s+tatha\s+तथा\s+and\s+]/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 2);

    const items: Array<{ spokenItem: string; quantity: number; unit: string }> = [];

    const KNOWN_KEYWORDS = [
      { key: "atta", label: "Atta", unit: "kg" },
      { key: "आटा", label: "Atta", unit: "kg" },
      { key: "aata", label: "Atta", unit: "kg" },
      { key: "butter", label: "Butter", unit: "packet" },
      { key: "बटर", label: "Butter", unit: "packet" },
      { key: "makhan", label: "Butter", unit: "packet" },
      { key: "cheeni", label: "Sugar", unit: "kg" },
      { key: "chini", label: "Sugar", unit: "kg" },
      { key: "चीनी", label: "Sugar", unit: "kg" },
      { key: "sugar", label: "Sugar", unit: "kg" },
      { key: "tel", label: "Oil", unit: "litre" },
      { key: "oil", label: "Oil", unit: "litre" },
      { key: "तेल", label: "Oil", unit: "litre" },
      { key: "mustard oil", label: "Mustard Oil", unit: "litre" },
      { key: "sarson", label: "Mustard Oil", unit: "litre" },
      { key: "namak", label: "Salt", unit: "packet" },
      { key: "salt", label: "Salt", unit: "packet" },
      { key: "नमक", label: "Salt", unit: "packet" },
      { key: "chai", label: "Tea", unit: "packet" },
      { key: "tea", label: "Tea", unit: "packet" },
      { key: "चाय", label: "Tea", unit: "packet" },
      { key: "chawal", label: "Rice", unit: "kg" },
      { key: "rice", label: "Rice", unit: "kg" },
      { key: "चावल", label: "Rice", unit: "kg" },
      { key: "basmati", label: "Basmati Rice", unit: "kg" },
      { key: "doodh", label: "Milk", unit: "litre" },
      { key: "milk", label: "Milk", unit: "litre" },
      { key: "दूध", label: "Milk", unit: "litre" },
      { key: "paneer", label: "Paneer", unit: "packet" },
      { key: "पनीर", label: "Paneer", unit: "packet" },
      { key: "ghee", label: "Ghee", unit: "litre" },
      { key: "घी", label: "Ghee", unit: "litre" },
      { key: "dal", label: "Dal", unit: "kg" },
      { key: "दाल", label: "Dal", unit: "kg" },
      { key: "toor", label: "Toor Dal", unit: "kg" },
      { key: "masala", label: "Garam Masala", unit: "packet" },
      { key: "मसाला", label: "Garam Masala", unit: "packet" },
      { key: "biscuit", label: "Biscuits", unit: "packet" },
      { key: "बिस्कुट", label: "Biscuits", unit: "packet" },
      { key: "parle", label: "Parle G", unit: "packet" },
    ];

    for (const clause of clauses) {
      const lower = clause.toLowerCase();

      let detectedQty = 1;
      const numMatch = lower.match(/\b(\d+(?:\.\d+)?)\b/);
      if (numMatch) {
        detectedQty = parseFloat(numMatch[1]);
      } else {
        for (const [word, val] of Object.entries(HINDI_NUMBER_MAP)) {
          if (new RegExp(`\\b${word}\\b`, "i").test(lower)) {
            detectedQty = val;
            break;
          }
        }
      }

      let detectedUnit = "packet";
      if (lower.includes("kilo") || lower.includes("kg") || lower.includes("किलो")) {
        detectedUnit = "kg";
      } else if (lower.includes("litre") || lower.includes("liter") || lower.includes("लीटर") || lower.includes("l")) {
        detectedUnit = "litre";
      } else if (lower.includes("packet") || lower.includes("पैकेट")) {
        detectedUnit = "packet";
      } else if (lower.includes("gram") || lower.includes("ग्राम") || lower.includes("gm")) {
        detectedUnit = "g";
      }

      for (const itemDef of KNOWN_KEYWORDS) {
        if (lower.includes(itemDef.key)) {
          const alreadyAdded = items.some((it) => it.spokenItem === itemDef.label);
          if (!alreadyAdded) {
            items.push({
              spokenItem: itemDef.label,
              quantity: detectedQty,
              unit: detectedUnit === "packet" ? itemDef.unit : detectedUnit,
            });
          }
          break;
        }
      }
    }

    if (items.length === 0) {
      items.push({
        spokenItem: transcript.slice(0, 30),
        quantity: 1,
        unit: "piece",
      });
    }

    return NextResponse.json({ success: true, items });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
