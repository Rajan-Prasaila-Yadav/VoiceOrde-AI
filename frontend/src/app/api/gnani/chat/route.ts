import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const HINDI_NUMBER_PATTERNS = [
  { regex: /(^|\s|[^a-zA-Z0-9\u0900-\u097F])(दस|dus|das|ten|10)($|\s|[^a-zA-Z0-9\u0900-\u097F])/i, val: 10 },
  { regex: /(^|\s|[^a-zA-Z0-9\u0900-\u097F])(नौ|nau|nine|9)($|\s|[^a-zA-Z0-9\u0900-\u097F])/i, val: 9 },
  { regex: /(^|\s|[^a-zA-Z0-9\u0900-\u097F])(आठ|aath|eight|8)($|\s|[^a-zA-Z0-9\u0900-\u097F])/i, val: 8 },
  { regex: /(^|\s|[^a-zA-Z0-9\u0900-\u097F])(सात|saat|seven|7)($|\s|[^a-zA-Z0-9\u0900-\u097F])/i, val: 7 },
  { regex: /(^|\s|[^a-zA-Z0-9\u0900-\u097F])(छह|छः|che|chheh|six|6)($|\s|[^a-zA-Z0-9\u0900-\u097F])/i, val: 6 },
  { regex: /(^|\s|[^a-zA-Z0-9\u0900-\u097F])(पाँच|पांच|paanch|panch|five|5)($|\s|[^a-zA-Z0-9\u0900-\u097F])/i, val: 5 },
  { regex: /(^|\s|[^a-zA-Z0-9\u0900-\u097F])(चार|chaar|char|four|4)($|\s|[^a-zA-Z0-9\u0900-\u097F])/i, val: 4 },
  { regex: /(^|\s|[^a-zA-Z0-9\u0900-\u097F])(तीन|teen|three|3)($|\s|[^a-zA-Z0-9\u0900-\u097F])/i, val: 3 },
  { regex: /(^|\s|[^a-zA-Z0-9\u0900-\u097F])(ढाई|dhai|2\.5)($|\s|[^a-zA-Z0-9\u0900-\u097F])/i, val: 2.5 },
  { regex: /(^|\s|[^a-zA-Z0-9\u0900-\u097F])(दो|do|टू|two|2)($|\s|[^a-zA-Z0-9\u0900-\u097F])/i, val: 2 },
  { regex: /(^|\s|[^a-zA-Z0-9\u0900-\u097F])(डेढ़|dedh|1\.5)($|\s|[^a-zA-Z0-9\u0900-\u097F])/i, val: 1.5 },
  { regex: /(^|\s|[^a-zA-Z0-9\u0900-\u097F])(एक|ek|वन|one|1)($|\s|[^a-zA-Z0-9\u0900-\u097F])/i, val: 1 },
  { regex: /(^|\s|[^a-zA-Z0-9\u0900-\u097F])(आधा|aadha|adha|half|0\.5)($|\s|[^a-zA-Z0-9\u0900-\u097F])/i, val: 0.5 },
  { regex: /(^|\s|[^a-zA-Z0-9\u0900-\u097F])(पाव|paav|pav|0\.25)($|\s|[^a-zA-Z0-9\u0900-\u097F])/i, val: 0.25 },
];

/**
 * Intelligent phonetic and semantic product matcher across English, Hindi & Hinglish
 */
function scoreProductMatch(product: any, queryLower: string, queryWords: Set<string>): number {
  let score = 0;

  const nameLower = (product.name || "").toLowerCase();
  const brandLower = (product.brand || "").toLowerCase();
  const hindiLower = (product.hindi_name || "").toLowerCase();

  // Parse aliases safely whether stored as Array or string
  const aliases: string[] = Array.isArray(product.aliases)
    ? product.aliases.map((a: any) => String(a).toLowerCase().trim())
    : typeof product.aliases === "string"
    ? product.aliases.toLowerCase().split(/[\s,]+/).filter(Boolean)
    : [];

  // Exact phrase inclusion in aliases or name
  for (const alias of aliases) {
    if (alias.length > 2 && queryLower.includes(alias)) {
      score += 25;
    }
  }

  // Token matching
  const nameTokens = nameLower.split(/\s+/);
  const brandTokens = brandLower.split(/\s+/);
  const hindiTokens = hindiLower.split(/\s+/);

  for (const t of [...nameTokens, ...hindiTokens]) {
    if (t.length > 2 && queryWords.has(t)) {
      score += 5;
    }
  }

  for (const b of brandTokens) {
    if (b.length > 2 && queryWords.has(b)) {
      score += 15;
    }
  }

  // Domain-specific disambiguation bonuses (Prevent Haldi vs Chilli, Sugar vs Masala)
  const isChilliQuery = /(चिली|chilli|chili|mirch|mirchi|मिर्च|मिर्ची|degi|देगी|लाल मिर्च|lal mirch)/i.test(queryLower);
  const isTurmericQuery = /(haldi|हल्दी|turmeric)/i.test(queryLower);
  const isCorianderQuery = /(dhaniya|धनिया|coriander)/i.test(queryLower);
  const isGaramMasalaQuery = /(garam masala|गरम मसाला|sabji masala|mdh masala)/i.test(queryLower);
  const isSugarQuery = /(sugar|शुगर|चीनी|चीनि|cheeni|chini|shakkar|शक्कर)/i.test(queryLower);
  const isAttaQuery = /(atta|aata|आटा|aashirvaad|आशीर्वाद|chakki|sharbati)/i.test(queryLower);
  const isSaltQuery = /(salt|namak|नमक|टाटा नमक)/i.test(queryLower);
  const isOilQuery = /(mustard oil|sarson|सरसों|mustard|tel|तेल)/i.test(queryLower);
  const isMilkQuery = /(milk|doodh|दूध|amul taaza)/i.test(queryLower);
  const isTeaQuery = /(tea|chai|चाय|chai patti|चाय पत्ती|red label)/i.test(queryLower);

  if (isChilliQuery && (nameLower.includes("chilli") || nameLower.includes("mirch") || hindiLower.includes("मिर्च"))) {
    score += 40;
  }
  if (isTurmericQuery && (nameLower.includes("turmeric") || hindiLower.includes("हल्दी"))) {
    score += 40;
  }
  if (isCorianderQuery && (nameLower.includes("coriander") || hindiLower.includes("धनिया"))) {
    score += 40;
  }
  if (isGaramMasalaQuery && (nameLower.includes("garam masala") || hindiLower.includes("गरम मसाला"))) {
    score += 40;
  }
  if (isSugarQuery && (nameLower.includes("sugar") || hindiLower.includes("चीनी") || brandLower.includes("madhur"))) {
    score += 40;
  }
  if (isAttaQuery && (nameLower.includes("atta") || hindiLower.includes("आटा") || brandLower.includes("aashirvaad"))) {
    score += 40;
  }
  if (isSaltQuery && (nameLower.includes("salt") || hindiLower.includes("नमक"))) {
    score += 40;
  }
  if (isOilQuery && (nameLower.includes("oil") || hindiLower.includes("तेल") || nameLower.includes("mustard"))) {
    score += 40;
  }
  if (isMilkQuery && (nameLower.includes("milk") || hindiLower.includes("दूध"))) {
    score += 40;
  }
  if (isTeaQuery && (nameLower.includes("tea") || hindiLower.includes("चाय") || brandLower.includes("red label"))) {
    score += 40;
  }

  return score;
}

/**
 * Extracts quantity from text
 */
function extractQuantity(textLower: string): { qty: number; unit?: string } {
  let qty = 1;
  const numMatch = textLower.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*(k|kg|kilo|किलो|litre|liter|लीटर|packet|पैकेट|gram|ग्राम)?(?:\s|$)/i);
  if (numMatch) {
    qty = parseFloat(numMatch[1]);
  } else {
    for (const hp of HINDI_NUMBER_PATTERNS) {
      if (hp.regex.test(` ${textLower} `)) {
        qty = hp.val;
        break;
      }
    }
  }

  let unit: string | undefined;
  if (/kilo|kg|किलो|k(?:\s|$)/i.test(textLower)) unit = "kg";
  else if (/litre|liter|लीटर|ltr/i.test(textLower)) unit = "litre";
  else if (/packet|पैकेट|pkt/i.test(textLower)) unit = "packet";
  else if (/gram|ग्राम|gm/i.test(textLower)) unit = "g";

  return { qty, unit };
}

export async function POST(req: Request) {
  try {
    const {
      message,
      customerPhone,
      conversationHistory = [],
      currentCart = [],
      currentDiscount = 0,
    } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 });
    }

    const query = message.trim();
    const queryLower = query.toLowerCase();
    const queryWords = new Set(
      queryLower.replace(/[^\w\s\u0900-\u097F]/g, "").split(/\s+/).filter(Boolean)
    );

    // 1. Fetch live products from database
    const { data: products } = await supabase
      .from("products")
      .select("id, name, hindi_name, brand, selling_price, mrp, unit, available_stock, aliases")
      .eq("shop_id", "00000000-0000-0000-0000-000000000001");

    // 2. Fetch shop settings from database
    const { data: shop } = await supabase
      .from("shops")
      .select("*")
      .eq("id", "00000000-0000-0000-0000-000000000001")
      .maybeSingle();

    const shopName = shop?.name || "Yadav Kirana & General Store";

    // Detect language of the incoming query
    const englishWordCount = (query.match(/[a-zA-Z]/g) || []).length;
    const hindiWordCount = (query.match(/[\u0900-\u097F]/g) || []).length;
    const isEnglishQuery = englishWordCount > 10 && hindiWordCount === 0;

    // Find the last discussed product from previous assistant message
    const lastAssistantMessage = [...conversationHistory]
      .reverse()
      .find((m: any) => m.role === "assistant" && m.lastDiscussedProductId);

    const lastDiscussedProduct = lastAssistantMessage
      ? (products || []).find((p: any) => p.id === lastAssistantMessage.lastDiscussedProductId)
      : null;

    // Rank products matching the current query
    const rankedProducts = (products || [])
      .map((p: any) => ({ product: p, score: scoreProductMatch(p, queryLower, queryWords) }))
      .filter((r: any) => r.score > 0)
      .sort((a: any, b: any) => b.score - a.score);

    const topProduct = rankedProducts.length > 0 ? rankedProducts[0].product : null;

    // =========================================================================
    // 1. INTENT: ORDER CONFIRMATION
    // Matches: "confirm", "confirm order", "कन्फर्म", "कंफर्म", "बस इतना ही", "itna hi chahiye"
    // =========================================================================
    const isConfirmingOrder =
      /(confirm|confirm order|कन्फर्म|कंफर्म|order kar do|order book karo|order place kar do|bas itna hi|aur kuch nahi|nahi bas|nahi aur nahi|itna hi chahiye|बस इतना ही)/i.test(
        queryLower
      );

    if (isConfirmingOrder) {
      if (currentCart.length > 0) {
        const subtotal = currentCart.reduce((acc: number, it: any) => acc + Number(it.totalPrice || 0), 0);
        const discount = currentDiscount || 0;
        const grandTotal = Math.max(0, subtotal - discount);

        const itemsList = currentCart
          .map((it: any) => `${it.quantity} ${it.unit} ${it.productName} (₹${it.totalPrice})`)
          .join(", ");

        const reply = `Ji shukriya! Aapka final order: ${itemsList}. Subtotal ₹${subtotal}${
          discount > 0 ? `, Discount: ₹${discount}` : ""
        }, Grand Total: ₹${grandTotal}. Kripya neeche Confirm Order button tap karein aur delivery address check karein!`;

        return NextResponse.json({
          success: true,
          intent: "CONFIRM_FINAL_SUMMARY",
          reply,
          speakText: reply,
          items: [],
          readyToConfirm: true,
        });
      } else {
        const reply = `Aapke cart mein abhi koi item nahi hai. Pehle Atta, Chawal, Tel, Masale ya koi bhi saman add karein, fir confirm karein!`;
        return NextResponse.json({
          success: true,
          intent: "EMPTY_CART_CONFIRM",
          reply,
          speakText: reply,
          items: [],
        });
      }
    }

    // =========================================================================
    // 2. INTENT: DISCOUNT / OFFER INQUIRY
    // =========================================================================
    const isAskingDiscount =
      /(discount|chhoot|छूट|डिस्काउंट|kam karo|kam hoga|koi offer|thoda kam|discount milega)/i.test(queryLower);

    if (isAskingDiscount) {
      const currentSubtotal = currentCart.reduce(
        (sum: number, it: any) => sum + Number(it.totalPrice || 0),
        0
      );

      let discountToGive = 0;
      let reply = "";

      if (currentSubtotal === 0) {
        reply = `Hamare paas har grocery item par market se sasta rate hai. Jab aap ₹500 se zyada ka order banayenge, toh 5% extra discount mil jayega! Pehle saman add kar lijiye.`;
      } else if (currentSubtotal >= 500) {
        discountToGive = Math.round(currentSubtotal * 0.05);
        const newTotal = currentSubtotal - discountToGive;
        reply = `Bilkul! Aapke ₹${currentSubtotal} ke order par maine ₹${discountToGive} (5% discount) apply kar diya hai. Ab aapka naya total ₹${newTotal} hai. Kya aap order confirm karna chahte hain, ya kuch aur add karein?`;
      } else {
        discountToGive = 20;
        const newTotal = Math.max(0, currentSubtotal - discountToGive);
        reply = `Theek hai! Aapke order par ₹20 ka special discount laga diya hai. Naya total ₹${newTotal} ho gaya hai. Kya order confirm karein?`;
      }

      return NextResponse.json({
        success: true,
        intent: "DISCOUNT_APPLIED",
        reply,
        speakText: reply,
        items: [],
        appliedDiscount: discountToGive,
      });
    }

    // =========================================================================
    // 3. INTENT: CONVERSATIONAL & STORE QUERIES (Dynamic Kirana Shopkeeper Voice)
    // =========================================================================
    // A) How are you / हाल चाल
    if (/(how are you|how r u|kaise ho|हाउ आर यू|कैसे हो|हाल चाल|hal chal)/i.test(queryLower)) {
      const reply = isEnglishQuery
        ? `I am doing great, thank you! Welcome to ${shopName}. How may I help you with your groceries today?`
        : `नमस्ते! मैं बिल्कुल ठीक हूँ, पूछने के लिए धन्यवाद। ${shopName} में आपका स्वागत है! आज आपकी क्या सेवा करूँ? घर के लिए क्या सामान मँगवाना है?`;
      return NextResponse.json({
        success: true,
        intent: "CHITCHAT_HOW_ARE_YOU",
        reply,
        speakText: reply,
        items: [],
      });
    }

    // B) Delivery Coverage & City / किस किस शहर में
    if (/(किस किस शहर|कहाँ कहाँ|शहर|delivery location|which city|delivery areas|kahan deliver|coverage|service area)/i.test(queryLower)) {
      const reply = isEnglishQuery
        ? `We operate from ${shopName} (Main Market) and deliver across all nearby localities within 30 to 45 minutes! Just tell us your address and what you need.`
        : `हमारा स्टोर Shop No. 12, Main Market में स्थित है और हम आसपास के सभी लोकल एरिया में 30 से 45 मिनट के अंदर फ्री होम डिलीवरी करते हैं! आप अपना पता बताइये और जो सामान चाहिए निसंकोच बोलिए।`;
      return NextResponse.json({
        success: true,
        intent: "STORE_DELIVERY_QUERY",
        reply,
        speakText: reply,
        items: [],
      });
    }

    // C) Timings / Opening hours
    if (/(timing|time|kab khulti|open time|opening hour|dukaan kab)/i.test(queryLower)) {
      const reply = isEnglishQuery
        ? `${shopName} is open 7 days a week from 7:00 AM to 10:00 PM. You can place voice orders anytime!`
        : `हमारी दुकान सुबह 7:00 बजे से रात 10:00 बजे तक सातों दिन खुली रहती है! आप कभी भी बोलकर आर्डर दे सकते हैं।`;
      return NextResponse.json({
        success: true,
        intent: "STORE_TIMING_QUERY",
        reply,
        speakText: reply,
        items: [],
      });
    }

    // D) Payment Methods
    if (/(payment|kaise pay|online pay|cash on delivery|upi|qr code)/i.test(queryLower)) {
      const reply = isEnglishQuery
        ? `We accept Cash on Delivery, UPI QR scan, and local store credit (Udhaar Khata). You can choose your preferred method at checkout!`
        : `आप डिलीवरी पर कैश (COD), UPI QR कोड स्कैन करके, या उधारी खाते से पेमेंट कर सकते हैं!`;
      return NextResponse.json({
        success: true,
        intent: "STORE_PAYMENT_QUERY",
        reply,
        speakText: reply,
        items: [],
      });
    }

    // =========================================================================
    // 4. INTENT: SPECIFIC PRODUCT PRICE & STOCK INQUIRY
    // e.g. "Bhaiya, Aashirvaad aata ka price aur availability kya hai?", "चिली पाउडर का भाव क्या है?", "चीनी कितने की है?"
    // Check if query is asking about price/stock AND we found a specific product match
    // =========================================================================
    const isAskingPriceOrStock =
      /(price|rate|bhav|भाव|kitne ka|kitna hai|kitna|rate kya|available hai kya|mil jayega|stock mein hai|hai kya|kya price|availability|उपलब्ध)/i.test(
        queryLower
      );

    if (topProduct && (isAskingPriceOrStock || rankedProducts[0].score >= 25)) {
      // Check if user is asking to ADD it directly vs asking about price
      const hasDirectAddWord = /(add|chahiye|चाहिए|dedo|de do|दे दो|pack karo|daal do|le lo|bhej do)/i.test(queryLower);

      if (!hasDirectAddWord) {
        const prodName = `${topProduct.brand ? topProduct.brand + " " : ""}${topProduct.name}`;
        const inStock = topProduct.available_stock > 0;

        let reply = "";
        if (inStock) {
          reply = isEnglishQuery
            ? `Yes! ${prodName} is available in fresh stock. The price is ₹${topProduct.selling_price} per ${topProduct.unit} (MRP ₹${topProduct.mrp}). We have ${topProduct.available_stock} ${topProduct.unit} in stock. How much would you like to order?`
            : `हाँजी! ${prodName} ताज़ा स्टॉक में उपलब्ध है। इसका भाव ₹${topProduct.selling_price} प्रति ${topProduct.unit} है (MRP ₹${topProduct.mrp})। अभी ${topProduct.available_stock} ${topProduct.unit} उपलब्ध है। आपको कितना चाहिए — 1 ${topProduct.unit} या ज़्यादा?`;
        } else {
          reply = isEnglishQuery
            ? `Sorry, ${prodName} is currently out of stock. We have other similar brands available. Would you like to check?`
            : `माफ कीजिये, ${prodName} अभी आउट ऑफ स्टॉक है। लेकिन हमारे पास दूसरे अच्छे ब्रांड उपलब्ध हैं। क्या मैं दिखाऊँ?`;
        }

        return NextResponse.json({
          success: true,
          intent: "PRICE_STOCK_QUERY",
          reply,
          speakText: reply,
          items: [],
          lastDiscussedProductId: topProduct.id,
          lastDiscussedProductName: prodName,
        });
      }
    }

    // =========================================================================
    // 5. INTENT: DIRECT ORDER ADD (Single or Multi-item)
    // e.g. "1 litre Fortune mustard oil aur ek packet Tata salt chahiye", "add one Chilli Powder", "चीनी 5 पैकेट", "शुगर ढाई किलो"
    // =========================================================================
    const hasOrderAddIntent =
      /(chahiye|चाहिए|dedo|de do|दे दो|dena|देना|add|pack|bhej do|daal do|le lo|पैकेट|packet|kilo|किलो|litre|लीटर)/i.test(
        queryLower
      ) || topProduct;

    if (hasOrderAddIntent && topProduct) {
      // Split query by commas and conjunctions to support multi-item sentences
      const clauses = query
        .split(/(?:[,|।\n]|\s+(?:aur|और|tatha|तथा|and|with|plus|\+)\s+)/i)
        .map((s) => s.trim())
        .filter((s) => s.length > 1);

      const newItems: any[] = [];

      for (const clause of clauses) {
        const lowerClause = clause.toLowerCase();
        const clauseWords = new Set(lowerClause.replace(/[^\w\s\u0900-\u097F]/g, "").split(/\s+/).filter(Boolean));

        // Find the best matching product for this specific clause
        const clauseMatches = (products || [])
          .map((p: any) => ({ product: p, score: scoreProductMatch(p, lowerClause, clauseWords) }))
          .filter((r: any) => r.score > 0)
          .sort((a: any, b: any) => b.score - a.score);

        const matchedP = clauseMatches.length > 0 ? clauseMatches[0].product : topProduct;

        // Extract quantity from this clause
        const { qty, unit: detectedUnit } = extractQuantity(lowerClause);
        const finalUnit = detectedUnit || matchedP.unit;
        const lineTotal = matchedP.selling_price * qty;

        // Prevent duplicate addition in the same multi-item command
        if (!newItems.some((it) => it.productId === matchedP.id)) {
          newItems.push({
            productId: matchedP.id,
            productName: `${matchedP.brand ? matchedP.brand + " " : ""}${matchedP.name}`.trim(),
            unit: finalUnit,
            quantity: qty,
            unitPrice: matchedP.selling_price,
            totalPrice: lineTotal,
            availableStock: matchedP.available_stock,
            stockError: matchedP.available_stock < qty,
          });
        }
      }

      if (newItems.length > 0) {
        const summaryItems = newItems
          .map((it) => `${it.quantity} ${it.unit} ${it.productName} (₹${it.totalPrice})`)
          .join(", ");

        const allItems = [...currentCart, ...newItems];
        const newTotal = allItems.reduce((acc, it) => acc + it.totalPrice, 0);

        const reply = isEnglishQuery
          ? `Added to your cart: ${summaryItems}. Your cart total is now ₹${newTotal}. Would you like to add anything else (like Tea, Sugar, or Spices), or confirm the order?`
          : `मैंने आपके कार्ट में जोड़ दिया: ${summaryItems}। कुल राशि ₹${newTotal} हो गई है। क्या आपको किसी और किराना सामान (जैसे चाय, चीनी, मसाले) की ज़रूरत है, या आर्डर कन्फर्म करें?`;

        return NextResponse.json({
          success: true,
          intent: "ORDER_ADDED",
          reply,
          speakText: reply,
          items: newItems,
          lastDiscussedProductId: newItems[newItems.length - 1].productId,
        });
      }
    }

    // =========================================================================
    // 6. INTENT: FOLLOW-UP QUANTITY FOR LAST DISCUSSED PRODUCT
    // e.g. AI asked: "Aashirvaad aata ₹265/kg hai. Kitna chahiye?" and user says "1 kg add kar do", "haan 2 packet"
    // Strictly applies ONLY if user didn't mention a new product!
    // =========================================================================
    if (lastDiscussedProduct && rankedProducts.length === 0) {
      const { qty, unit: detectedUnit } = extractQuantity(queryLower);
      const isAffirmative = /(haan|ha|yes|add|daal do|le lo|de do|chahiye|pack)/i.test(queryLower);

      if (qty > 0 || isAffirmative) {
        const finalUnit = detectedUnit || lastDiscussedProduct.unit;
        const lineTotal = lastDiscussedProduct.selling_price * qty;

        const newItem = {
          productId: lastDiscussedProduct.id,
          productName: `${lastDiscussedProduct.brand ? lastDiscussedProduct.brand + " " : ""}${lastDiscussedProduct.name}`.trim(),
          unit: finalUnit,
          quantity: qty,
          unitPrice: lastDiscussedProduct.selling_price,
          totalPrice: lineTotal,
          availableStock: lastDiscussedProduct.available_stock,
          stockError: lastDiscussedProduct.available_stock < qty,
        };

        const updatedCart = [...currentCart, newItem];
        const newSubtotal = updatedCart.reduce((sum, it) => sum + it.totalPrice, 0);

        const reply = isEnglishQuery
          ? `Added ${qty} ${finalUnit} ${newItem.productName} (₹${lineTotal}) to your cart! Cart total is now ₹${newSubtotal}. Would you like anything else, or should we confirm the order?`
          : `मैंने ${qty} ${finalUnit} ${newItem.productName} (₹${lineTotal}) आपके कार्ट में जोड़ दिया! कुल राशि ₹${newSubtotal} हो गई है। क्या कुछ और सामान जोड़ना है, या आर्डर कन्फर्म करें?`;

        return NextResponse.json({
          success: true,
          intent: "ITEM_ADDED_FOLLOWUP",
          reply,
          speakText: reply,
          items: [newItem],
          lastDiscussedProductId: null,
        });
      }
    }

    // =========================================================================
    // 7. INTENT: GENERAL CATALOGUE / INVENTORY INQUIRY
    // e.g. "What are the items available?", "व्हाट आर द आइटम्स अवेलेबल इन द शॉप", "दुकान में क्या क्या सामान है"
    // =========================================================================
    const isCatalogueInquiry =
      /(what are the items|what items|items available|products available|available products|available items|what is available|what's available|list of items|all items|show items|show catalogue|store items|inventory|आइटम्स अवेलेबल|उपलब्ध सामान|क्या क्या सामान)/i.test(
        queryLower
      );

    if (isCatalogueInquiry) {
      if (isEnglishQuery) {
        const reply = `Welcome to ${shopName}! We have all daily grocery essentials in fresh stock:\n\n• 🌾 **Flour & Grains:** Aashirvaad Chakki Atta, Fortune Basmati Rice, Rajdhani Besan, Sooji\n• 🛢️ **Oils & Ghee:** Fortune Mustard Oil, Saffola Gold, Amul Pure Desi Ghee\n• 🧈 **Dairy & Staples:** Amul Butter, Taaza Milk, Madhur Sugar, Tata Salt\n• 🍲 **Pulses & Dals:** Tata Sampann Toor Dal, Moong Dal, Chana Dal\n• ☕ **Spices & Tea:** Red Label Tea, MDH Garam Masala, Haldi, Deggi Mirch\n\nWhich item and quantity would you like to order? Just speak the item name!`;
        const speakText = `Welcome to ${shopName}! We have fresh Atta, Basmati Rice, Cooking Oils, Pure Desi Ghee, Amul Butter, Tata Salt, Madhur Sugar, Pulses, and Spices in stock. What would you like to order? Just tell me the product name and quantity!`;

        return NextResponse.json({
          success: true,
          intent: "CATALOGUE_INQUIRY",
          reply,
          speakText,
          speakLang: "en-IN",
          items: [],
        });
      } else {
        const reply = `नमस्ते! ${shopName} में आपका स्वागत है। हमारे पास ये सभी मुख्य किराना सामान ताज़ा स्टॉक में उपलब्ध हैं:\n\n• 🌾 **आटा, चावल व अनाज:** Aashirvaad Atta, India Gate Basmati, Besan, Sooji\n• 🛢️ **तेल व देसी घी:** Fortune Mustard Oil, Saffola Gold, Amul Ghee\n• 🧈 **डेयरी व चीनी-नमक:** Taaza Milk, Amul Butter, Madhur Sugar, Tata Salt\n• 🍲 **दालें:** Toor Dal, Moong Dal, Chana Dal, Rajma, Chole\n• ☕ **मसाले व चाय:** Red Label Tea, MDH Deggi Mirch, Haldi, Garam Masala\n\nआपको इनमें से कौन सा सामान और कितनी मात्रा चाहिए? बोलकर बताइये!`;
        const speakText = `Namaste! ${shopName} mein Atta, Basmati Chawal, Mustard Oil, Desi Ghee, Amul Butter, Tata Namak, Madhur Chini, Daalein aur Chai Patti sab stock mein available hain. Aapko kaun sa item aur kitna chahiye? Bolkar batayein!`;

        return NextResponse.json({
          success: true,
          intent: "CATALOGUE_INQUIRY",
          reply,
          speakText,
          speakLang: "hi-IN",
          items: [],
        });
      }
    }

    // =========================================================================
    // 8. NATURAL CONVERSATIONAL FALLBACK
    // =========================================================================
    if (isEnglishQuery) {
      const defaultReply = `Hello! I am your Kirana assistant at ${shopName}. You can ask about item prices, stock, or tell me to add any grocery to your cart (for example: "1 kg sugar" or "2 bottles mustard oil"). How can I help you today?`;
      return NextResponse.json({
        success: true,
        intent: "GENERAL",
        reply: defaultReply,
        speakText: defaultReply,
        speakLang: "en-IN",
        items: [],
      });
    } else {
      const defaultReply = `नमस्ते! मैं ${shopName} का AI सहायक हूँ। आप किसी भी सामान का भाव पूछ सकते हैं या सीधे आर्डर दे सकते हैं (जैसे: "दो किलो आशीर्वाद आटा और एक पैकेट नमक")। बताइये आपको क्या सामान चाहिए?`;
      return NextResponse.json({
        success: true,
        intent: "GENERAL",
        reply: defaultReply,
        speakText: defaultReply,
        speakLang: "hi-IN",
        items: [],
      });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
