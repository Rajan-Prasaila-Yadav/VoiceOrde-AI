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
    const { message, customerPhone } = await req.json();

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

    // 3. INTENT A: Greetings (Never add items to cart!)
    const isGreeting =
      /^(hello|hi|hey|namaste|हेलो|नमस्ते)(\s+hello|\s+hi|\s+bhaiya|\s+ji)?$/i.test(queryLower) ||
      queryLower === "hello hello" ||
      queryLower === "namaste bhaiya";

    if (isGreeting) {
      const reply = `Namaste! ${shopName} mein aapka swagat hai. Main aapka Kirana AI sahayak hoon. Aap kisi bhi grocery item ka rate pooch sakte hain, kya kya samaan hai jaan sakte hain, ya bolkar order de sakte hain!`;
      return NextResponse.json({
        success: true,
        intent: "GREETING",
        reply,
        speakText: reply,
        items: [],
      });
    }

    // 4. INTENT B: Catalogue Inquiry ("What are the items available?") (Never add items to cart!)
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

      const reply = `Haanji! ${shopName} mein taaza grocery stock available hai: Atta (Aashirvaad & Pillsbury), Basmati Rice (Daawat & India Gate), Fortune Mustard Oil, Amul Butter & Desi Ghee, Tata Salt, Madhur Sugar, Toor Dal, Everest Masale aur Red Label Tea. Top items: ${topItems}. Aap kisi bhi item ka bhav pooch sakte hain ya add karne ko bol sakte hain!`;

      return NextResponse.json({
        success: true,
        intent: "CATALOGUE_INQUIRY",
        reply,
        speakText: reply,
        items: [],
      });
    }

    // 5. INTENT C: Customer checking previous order status
    if (
      queryLower.includes("order status") ||
      queryLower.includes("mera order") ||
      queryLower.includes("order kahan hai") ||
      queryLower.includes("ऑर्डर स्टेटस")
    ) {
      let ordersQuery = supabase
        .from("orders")
        .select("order_number, status, total_amount, created_at, items:order_items(product_name, quantity, unit)")
        .order("created_at", { ascending: false })
        .limit(1);

      if (customerPhone) {
        ordersQuery = ordersQuery.eq("customer_phone", customerPhone);
      }

      const { data: latestOrders } = await ordersQuery;
      const latest = latestOrders?.[0];

      if (latest) {
        const itemNames = (latest.items || [])
          .map((it: any) => `${it.quantity} ${it.unit} ${it.product_name}`)
          .join(", ");
        const statusMap: Record<string, string> = {
          PLACED: "Order place ho chuka hai (दुकानदार स्वीकार कर रहा है)",
          ACCEPTED: "Store ne accept kar liya hai",
          PACKING: "Order pack ho raha hai",
          OUT_FOR_DELIVERY: "Delivery ke liye nikal chuka hai (रास्ते में है)",
          DELIVERED: "Safaltapoorvak deliver ho chuka hai",
        };
        const statusText = statusMap[latest.status] || latest.status;

        const reply = `Aapka order #${latest.order_number} (₹${latest.total_amount}) abhi "${statusText}". Isme items hain: ${itemNames}.`;
        return NextResponse.json({
          success: true,
          intent: "ORDER_STATUS",
          reply,
          speakText: reply,
          items: [],
        });
      } else {
        const reply = `Aapke phone number (${customerPhone || "guest"}) par abhi koi active order nahi mila. Aap naya order bolkar de sakte hain!`;
        return NextResponse.json({
          success: true,
          intent: "ORDER_STATUS",
          reply,
          speakText: reply,
          items: [],
        });
      }
    }

    // 6. INTENT D: Store Info / Timings / Location
    const isStoreInfo =
      /(kahan sthit|kahan hai|address kya|pata kya|kab khulti|kab tak khuli|store timing|dukaan kahan|shop kahan|phone number|contact number)/i.test(
        queryLower
      );

    if (isStoreInfo) {
      const reply = `${shopName} ${shopAddress} par sthit hai. Dukaan subah 8 baje se raat 9:30 baje tak khuli rehti hai. Phone number ${shopPhone} hai.`;
      return NextResponse.json({
        success: true,
        intent: "STORE_INFO",
        reply,
        speakText: reply,
        items: [],
      });
    }

    // 7. INTENT E: Specific Product Price or Stock Inquiry (Never add to cart, just answer!)
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
        reply = `Haanji! ${prodName} available hai. Iska rate ₹${p.selling_price} per ${p.unit} hai (MRP ₹${p.mrp}). Abhi ${p.available_stock} ${p.unit} stock mein hai. Kya aapko add karna hai?`;
      } else {
        reply = `Maaf kijiye, ${prodName} abhi out of stock hai. Par hum jaldi restock kar rahe hain!`;
      }

      return NextResponse.json({
        success: true,
        intent: "PRICE_STOCK_QUERY",
        reply,
        speakText: reply,
        items: [],
      });
    }

    // 8. INTENT F: Explicit Order Placement / Add to Cart
    // ONLY triggered if user explicitly uses order intent words or numeric quantities
    const hasOrderIntent =
      /(chahiye|चाहिए|dedo|de do|दे दो|lao|dena|add karo|pack karo|bhej do|mangwa do|kardo|daal do|le lo|pack)/i.test(
        queryLower
      ) || /(?:^|\s)\d+(\.\d+)?\s*(kg|kilo|litre|liter|packet|pkt|gram|gm)/i.test(queryLower);

    if (hasOrderIntent) {
      // In-memory precision clause parser
      const clauses = query
        .split(/(?:[,|।\n]|\s+(?:aur|और|tatha|तथा|and|with|plus|\+)\s+)/i)
        .map((s) => s.trim())
        .filter((s) => s.length > 1);

      const orderItems: any[] = [];

      for (const clause of clauses) {
        const lower = clause.toLowerCase();
        const clauseWords = new Set(
          lower.replace(/[^\w\s\u0900-\u097F]/g, "").split(/\s+/)
        );

        // Extract quantity
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
        if (/kilo|kg|किलो/i.test(lower)) detectedUnit = "kg";
        else if (/litre|liter|लीटर|ltr|\bl\b/i.test(lower)) detectedUnit = "litre";
        else if (/packet|पैकेट|pkt/i.test(lower)) detectedUnit = "packet";
        else if (/gram|ग्राम|gm/i.test(lower)) detectedUnit = "g";

        // Find actual product with token score
        const clauseRanked = (products || [])
          .map((p: any) => ({ product: p, score: scoreProductMatch(p, clauseWords) }))
          .filter((r: any) => r.score > 0)
          .sort((a: any, b: any) => b.score - a.score);

        if (clauseRanked.length > 0) {
          const found = clauseRanked[0].product;
          // Avoid duplicate lines in single speech
          const existing = orderItems.find((it) => it.productId === found.id);
          if (existing) {
            existing.quantity += detectedQty;
            existing.totalPrice = existing.quantity * existing.unitPrice;
          } else {
            orderItems.push({
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
      }

      if (orderItems.length > 0) {
        const summaryItems = orderItems
          .map((it) => `${it.quantity} ${it.unit} ${it.productName} (₹${it.totalPrice})`)
          .join(", ");
        const totalAmount = orderItems.reduce((acc, it) => acc + it.totalPrice, 0);

        const reply = `Maine aapke cart mein add kar diya: ${summaryItems}. Total amount ₹${totalAmount} hua hai. Neeche bill verify karke confirm karein!`;
        return NextResponse.json({
          success: true,
          intent: "ORDER_ADDED",
          reply,
          speakText: reply,
          items: orderItems,
        });
      }
    }

    // 9. If customer asked about a category (e.g. "atta kaun sa hai?", "rice options")
    if (rankedProducts.length > 0) {
      const pList = rankedProducts
        .slice(0, 3)
        .map((r: any) => `${r.product.brand ? r.product.brand + " " : ""}${r.product.name} (₹${r.product.selling_price}/${r.product.unit})`)
        .join(", ");

      const reply = `Haanji! Is category mein hamare paas ye options available hain: ${pList}. Kya aap inme se koi add karna chahte hain?`;
      return NextResponse.json({
        success: true,
        intent: "CATEGORY_INFO",
        reply,
        speakText: reply,
        items: [],
      });
    }

    // 10. Natural General Fallback (NEVER injects random items into cart!)
    const defaultReply = `Namaste! Sharma Kirana Store mein aapka swagat hai. Main aapka AI Kirana sahayak hoon. Aap kisi bhi grocery item ka rate pooch sakte hain ya seedha bolkar order de sakte hain (jaise: "दो किलो आटा और एक पैकेट बटर चाहिए").`;
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
