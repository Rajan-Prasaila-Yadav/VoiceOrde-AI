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
  { regex: /(^|\s|[^a-zA-Z0-9\u0900-\u097F])(दो|do|टू|two|2)($|\s|[^a-zA-Z0-9\u0900-\u097F])/i, val: 2 },
  { regex: /(^|\s|[^a-zA-Z0-9\u0900-\u097F])(एक|ek|वन|one|1)($|\s|[^a-zA-Z0-9\u0900-\u097F])/i, val: 1 },
  { regex: /(^|\s|[^a-zA-Z0-9\u0900-\u097F])(आधा|aadha|adha|half|0\.5)($|\s|[^a-zA-Z0-9\u0900-\u097F])/i, val: 0.5 },
  { regex: /(^|\s|[^a-zA-Z0-9\u0900-\u097F])(पाव|paav|pav|0\.25)($|\s|[^a-zA-Z0-9\u0900-\u097F])/i, val: 0.25 },
];

function scoreProductMatch(product: any, queryWords: Set<string>): number {
  let score = 0;
  const nameTokens = (product.name || "").toLowerCase().split(/\s+/);
  const brandTokens = (product.brand || "").toLowerCase().split(/\s+/);
  const hindiTokens = (product.hindi_name || "").toLowerCase().split(/\s+/);
  const aliasTokens = (typeof product.aliases === "string" ? product.aliases : "")
    .toLowerCase()
    .split(/[\s,]+/);

  for (const t of [...nameTokens, ...brandTokens, ...hindiTokens, ...aliasTokens]) {
    if (t.length > 2 && queryWords.has(t)) {
      score += 2;
    }
  }

  if (product.brand && queryWords.has(product.brand.toLowerCase())) {
    score += 5;
  }

  return score;
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
      queryLower.replace(/[^\w\s\u0900-\u097F]/g, "").split(/\s+/)
    );

    // 1. Fetch live products from database
    const { data: products } = await supabase
      .from("products")
      .select("id, name, hindi_name, brand, selling_price, mrp, unit, available_stock, aliases")
      .eq("shop_id", "00000000-0000-0000-0000-000000000001");

    // 2. Fetch shop settings from database
    const { data: shop } = await supabase
      .from("shop_settings")
      .select("*")
      .eq("shop_id", "00000000-0000-0000-0000-000000000001")
      .maybeSingle();

    const shopName = shop?.store_name || "Sharma Kirana Store";
    const shopPhone = shop?.phone_number || "+91 9876543210";
    const shopAddress = shop?.complete_address || "Shop 12, Main Bazaar";

    // Find the last discussed product from previous assistant message
    const lastAssistantMessage = [...conversationHistory]
      .reverse()
      .find((m: any) => m.role === "assistant" && m.lastDiscussedProductId);

    const lastDiscussedProduct = lastAssistantMessage
      ? (products || []).find((p: any) => p.id === lastAssistantMessage.lastDiscussedProductId)
      : null;

    // 3. INTENT A: Greetings
    const isGreeting =
      /^(hello|hi|hey|namaste|हेलो|नमस्ते)(\s+hello|\s+hi|\s+bhaiya|\s+ji)?$/i.test(queryLower) ||
      queryLower === "hello hello" ||
      queryLower === "namaste bhaiya";

    if (isGreeting) {
      const reply = `Namaste! ${shopName} mein aapka swagat hai. Aapko aaj kya chahiye — Atta, Chawal, Tel, Masale ya koi aur grocery? Bolkar batayein!`;
      return NextResponse.json({
        success: true,
        intent: "GREETING",
        reply,
        speakText: reply,
        items: [],
      });
    }

    // 4. INTENT B: Catalogue Inquiry ("What are the items available?")
    const isCatalogueInquiry =
      /(what are the items|what items|items available|kya kya items|kya kya milta|kya kya hai|kya kya samaan|samaan kya|kya stock hai|products available|list of items|all items|koun koun sa|what do you have|inventory)/i.test(
        queryLower
      );

    if (isCatalogueInquiry) {
      const inStock = (products || []).filter((p: any) => p.available_stock > 0);
      const topItems = inStock
        .slice(0, 6)
        .map((p: any) => `${p.brand ? p.brand + " " : ""}${p.name} (₹${p.selling_price})`)
        .join(", ");

      const reply = `Haanji! ${shopName} mein Atta, Basmati Rice, Mustard Oil, Amul Butter, Ghee, Tata Salt, Madhur Sugar, Toor Dal, Everest Masala aur Red Label Tea stock mein available hain. Top items: ${topItems}. Aapko kaun sa item aur kitna chahiye?`;

      return NextResponse.json({
        success: true,
        intent: "CATALOGUE_INQUIRY",
        reply,
        speakText: reply,
        items: [],
      });
    }

    // 5. INTENT C: Customer asks for DISCOUNT (Strictly when requested by user/admin)
    const isAskingDiscount =
      /(discount|chhoot|छूट|डिस्काउंट|kam karo|kam hoga|koi offer|thoda kam|discount milega)/i.test(
        queryLower
      );

    if (isAskingDiscount) {
      const currentSubtotal = currentCart.reduce(
        (sum: number, it: any) => sum + Number(it.totalPrice || 0),
        0
      );

      let discountToGive = 0;
      let reply = "";

      if (currentSubtotal === 0) {
        reply = `Hamare paas MRP se pehle se hi ₹15-₹30 har item par sasta rate hai. Jab aap ₹500 se zyada ka order banayenge, toh hum 5% extra discount de denge! Pehle items cart mein add kar lijiye.`;
      } else if (currentSubtotal >= 500) {
        discountToGive = Math.round(currentSubtotal * 0.05); // 5% discount
        const newTotal = currentSubtotal - discountToGive;
        reply = `Bilkul! Aapke ₹${currentSubtotal} ke order par maine ₹${discountToGive} (5% discount) apply kar diya hai. Ab aapka naya total ₹${newTotal} hai. Kya aap order confirm karna chahte hain, ya kuch aur add karein?`;
      } else {
        discountToGive = 20; // Flat ₹20 discount
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

    // 6. INTENT D: Customer says "CONFIRM ORDER" or "Bas itna hi, order book karo"
    const isConfirmingOrder =
      /(confirm|confirm order|order kar do|order book karo|order place kar do|bas itna hi|aur kuch nahi|nahi bas|nahi aur nahi|itna hi chahiye)/i.test(
        queryLower
      );

    if (isConfirmingOrder && currentCart.length > 0) {
      const subtotal = currentCart.reduce(
        (acc: number, it: any) => acc + Number(it.totalPrice || 0),
        0
      );
      const discount = currentDiscount || 0;
      const grandTotal = Math.max(0, subtotal - discount);

      const itemsList = currentCart
        .map((it: any) => `${it.quantity} ${it.unit} ${it.productName} (₹${it.totalPrice})`)
        .join(", ");

      const reply = `Ji shukriya! Aapka final order: ${itemsList}. Subtotal ₹${subtotal}${
        discount > 0 ? `, Discount: ₹${discount}` : ""
      }, Grand Total: ₹${grandTotal}. Kripya neeche Confirm Order button tap karein aur apna delivery address check karein!`;

      return NextResponse.json({
        success: true,
        intent: "CONFIRM_FINAL_SUMMARY",
        reply,
        speakText: reply,
        items: [],
        readyToConfirm: true,
      });
    }

    // 7. INTENT E: Customer responds with UNIT/QUANTITY to follow up previous item!
    // Example: AI asked "Aashirvaad aata ₹265/kg hai. Kitna chahiye?" and customer says "1 kg", "ek kilo", "2 packet add kar do"
    const hasQuantityPattern =
      /(?:^|\s)\d+(\.\d+)?\s*(kg|kilo|litre|liter|packet|pkt|gram|gm)?(?:\s|$)/i.test(queryLower) ||
      /(ek|do|teen|chaar|paanch|aadha|paav|एक|दो|तीन|चार|पांच|आधा|पाव)\s*(kg|kilo|किलो|litre|liter|लीटर|packet|पैकेट|gram|ग्राम)?/i.test(
        queryLower
      );

    const isAffirmativeAdd =
      /(haan|ha|yes|add kar do|daal do|le lo|de do|chahiye|pack kar do)/i.test(queryLower);

    if (lastDiscussedProduct && (hasQuantityPattern || isAffirmativeAdd)) {
      let qty = 1;
      const numMatch = queryLower.match(/(?:^|\s)(\d+(?:\.\d+)?)(?:\s|$)/);
      if (numMatch) {
        qty = parseFloat(numMatch[1]);
      } else {
        for (const hp of HINDI_NUMBER_PATTERNS) {
          if (hp.regex.test(` ${queryLower} `)) {
            qty = hp.val;
            break;
          }
        }
      }

      let unit = lastDiscussedProduct.unit;
      if (/kilo|kg|किलो/i.test(queryLower)) unit = "kg";
      else if (/litre|liter|लीटर|ltr/i.test(queryLower)) unit = "litre";
      else if (/packet|पैकेट|pkt/i.test(queryLower)) unit = "packet";
      else if (/gram|ग्राम|gm/i.test(queryLower)) unit = "g";

      const lineTotal = lastDiscussedProduct.selling_price * qty;
      const newItem = {
        productId: lastDiscussedProduct.id,
        productName: `${lastDiscussedProduct.brand ? lastDiscussedProduct.brand + " " : ""}${
          lastDiscussedProduct.name
        }`.trim(),
        unit,
        quantity: qty,
        unitPrice: lastDiscussedProduct.selling_price,
        totalPrice: lineTotal,
        availableStock: lastDiscussedProduct.available_stock,
        stockError: lastDiscussedProduct.available_stock < qty,
      };

      const updatedCart = [...currentCart, newItem];
      const newSubtotal = updatedCart.reduce((sum, it) => sum + it.totalPrice, 0);

      // Suggest another category (Upsell)
      const suggestions = ["Chai (Red Label)", "Madhur Sugar", "Fortune Mustard Oil", "Toor Dal"];
      const nextSuggestion =
        suggestions.find((s) => !updatedCart.some((it) => it.productName.toLowerCase().includes(s.split(" ")[0].toLowerCase()))) ||
        "Chai patti ya Masale";

      const reply = `Maine ${qty} ${unit} ${newItem.productName} (₹${lineTotal}) aapke cart mein add kar diya hai! Total ab ₹${newSubtotal} hua hai. Kya aapko ${nextSuggestion} mein se kuch chahiye, ya order confirm karein?`;

      return NextResponse.json({
        success: true,
        intent: "ITEM_ADDED_FOLLOWUP",
        reply,
        speakText: reply,
        items: [newItem],
        lastDiscussedProductId: null,
      });
    }

    // 8. INTENT F: Customer asking for a specific product price or stock
    const isAskingPriceOrStock =
      /(price|rate|bhav|भाव|kitne ka|kitna hai|kitna|rate kya|available hai kya|mil jayega|stock mein hai|hai kya|kya price)/i.test(
        queryLower
      );

    const rankedProducts = (products || [])
      .map((p: any) => ({ product: p, score: scoreProductMatch(p, queryWords) }))
      .filter((r: any) => r.score > 0)
      .sort((a: any, b: any) => b.score - a.score);

    if (rankedProducts.length > 0 && isAskingPriceOrStock) {
      const p = rankedProducts[0].product;
      const prodName = `${p.brand ? p.brand + " " : ""}${p.name}`;
      const inStock = p.available_stock > 0;

      let reply = "";
      if (inStock) {
        reply = `Haanji! ${prodName} available hai. Iska rate ₹${p.selling_price} per ${p.unit} hai (MRP ₹${p.mrp}). Abhi ${p.available_stock} ${p.unit} stock mein hai. Aapko kitna chahiye — 1 ${p.unit} ya zyada?`;
      } else {
        reply = `Maaf kijiye, ${prodName} abhi out of stock hai. Par hamare paas doosre brands available hain. Kya main dikhaoon?`;
      }

      return NextResponse.json({
        success: true,
        intent: "PRICE_STOCK_QUERY",
        reply,
        speakText: reply,
        items: [],
        lastDiscussedProductId: p.id,
        lastDiscussedProductName: prodName,
      });
    }

    // 9. INTENT G: Multi-item direct spoken order (e.g. "2 kilo atta aur 1 packet butter chahiye")
    const hasOrderIntent =
      /(chahiye|चाहिए|dedo|de do|दे दो|lao|dena|add karo|pack karo|bhej do|mangwa do|kardo|daal do|le lo|pack)/i.test(
        queryLower
      ) || /(?:^|\s)\d+(\.\d+)?\s*(kg|kilo|litre|liter|packet|pkt|gram|gm)/i.test(queryLower);

    if (hasOrderIntent) {
      const clauses = query
        .split(/(?:[,|।\n]|\s+(?:aur|और|tatha|तथा|and|with|plus|\+)\s+)/i)
        .map((s) => s.trim())
        .filter((s) => s.length > 1);

      const newItems: any[] = [];

      for (const clause of clauses) {
        const lower = clause.toLowerCase();
        const clauseWords = new Set(
          lower.replace(/[^\w\s\u0900-\u097F]/g, "").split(/\s+/)
        );

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

        let detectedUnit = "packet";
        if (/kilo|kg|किलो/i.test(lower)) detectedUnit = "kg";
        else if (/litre|liter|लीटर|ltr|\bl\b/i.test(lower)) detectedUnit = "litre";
        else if (/packet|पैकेट|pkt/i.test(lower)) detectedUnit = "packet";
        else if (/gram|ग्राम|gm/i.test(lower)) detectedUnit = "g";

        const clauseRanked = (products || [])
          .map((p: any) => ({ product: p, score: scoreProductMatch(p, clauseWords) }))
          .filter((r: any) => r.score > 0)
          .sort((a: any, b: any) => b.score - a.score);

        if (clauseRanked.length > 0) {
          const found = clauseRanked[0].product;
          newItems.push({
            productId: found.id,
            productName: `${found.brand ? found.brand + " " : ""}${found.name}`.trim(),
            unit: found.unit,
            quantity: detectedQty,
            unitPrice: found.selling_price,
            totalPrice: found.selling_price * detectedQty,
            availableStock: found.available_stock,
            stockError: found.available_stock < detectedQty,
          });
        }
      }

      if (newItems.length > 0) {
        const summaryItems = newItems
          .map((it) => `${it.quantity} ${it.unit} ${it.productName} (₹${it.totalPrice})`)
          .join(", ");
        const allItems = [...currentCart, ...newItems];
        const newTotal = allItems.reduce((acc, it) => acc + it.totalPrice, 0);

        const reply = `Maine aapke cart mein add kar diya: ${summaryItems}. Total amount ₹${newTotal} hua hai. Kya aapko kisi aur category se kuch chahiye (jaise Chai, Masale, Sugar)? Ya order confirm karein?`;

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

    // 10. General Category Matching
    if (rankedProducts.length > 0) {
      const p = rankedProducts[0].product;
      const prodName = `${p.brand ? p.brand + " " : ""}${p.name}`;
      const reply = `Hamare paas ${prodName} ₹${p.selling_price} per ${p.unit} mein available hai. Aapko kitna chahiye — 1 ${p.unit} ya zyada?`;

      return NextResponse.json({
        success: true,
        intent: "CATEGORY_PROMPT",
        reply,
        speakText: reply,
        items: [],
        lastDiscussedProductId: p.id,
        lastDiscussedProductName: prodName,
      });
    }

    // 11. Natural Fallback
    const defaultReply = `Namaste! Sharma Kirana Store mein aapka swagat hai. Aap kisi bhi item ka naam aur quantity bolkar pooch sakte hain ya order de sakte hain (jaise: "दो किलो आटा और एक पैकेट बटर चाहिए").`;
    return NextResponse.json({
      success: true,
      intent: "GENERAL",
      reply: defaultReply,
      speakText: defaultReply,
      items: [],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
