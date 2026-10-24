import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const GNANI_API_KEY = process.env.GNANI_API_KEY || "";
const GNANI_EVON_URL =
  process.env.GNANI_EVON_LLM_URL || "https://api.gnani.ai/v1/chat/completions";

export async function POST(req: Request) {
  try {
    const { message, customerPhone } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 });
    }

    const query = message.trim();
    const queryLower = query.toLowerCase();

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

    // 3. Check if customer is asking about previous orders
    if (queryLower.includes("order") || queryLower.includes("ऑर्डर") || queryLower.includes("status") || queryLower.includes("status kya")) {
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
        const itemNames = (latest.items || []).map((it: any) => `${it.quantity} ${it.unit} ${it.product_name}`).join(", ");
        const statusMap: Record<string, string> = {
          PLACED: "Place ho chuka hai (दुकानदार द्वारा स्वीकार किया जा रहा है)",
          ACCEPTED: "Dukandar ne accept kar liya hai (स्वीकार हो गया)",
          PACKING: "Pack ho raha hai (पैक किया जा रहा है)",
          DISPATCHED: "Delivery ke liye nikal chuka hai (रास्ते में है)",
          DELIVERED: "Deliver ho chuka hai (सफलतापूर्वक डिलीवर हो गया)",
        };
        const statusText = statusMap[latest.status] || latest.status;

        const reply = `Aapka aakhiri order #${latest.order_number} (₹${latest.total_amount}) abhi "${statusText}". Isme shamil tha: ${itemNames}.`;
        return NextResponse.json({
          success: true,
          intent: "ORDER_STATUS",
          reply,
          speakText: reply,
          items: [],
        });
      }
    }

    // 4. Try remote Gnani Evon LLM if configured
    if (GNANI_API_KEY && !GNANI_API_KEY.includes("your-") && GNANI_API_KEY !== "gnani-mock-key") {
      try {
        const catalogContext = (products || [])
          .slice(0, 30)
          .map(
            (p: any) =>
              `${p.brand ? p.brand + " " : ""}${p.name} (${p.hindi_name || ""}): ₹${p.selling_price}/${p.unit}, Stock: ${p.available_stock} ${p.unit}`
          )
          .join("\n");

        const prompt = `You are the polite, helpful AI voice assistant for "${shopName}" located at ${shopAddress}, Phone: ${shopPhone}.
Customer asks: "${query}"

Real Store Catalogue Data:
${catalogContext}

Instructions:
1. Answer warmly in natural Hindi / Hinglish.
2. If customer asks about item price or availability, quote the exact real price and stock from the catalogue.
3. If customer is ordering or wants to add items, confirm what items you added and total price.
4. Keep the answer concise (2-3 sentences max) so it sounds natural when spoken aloud.
5. If items were requested to buy/order, also provide a JSON block at the very end formatted as:
ITEMS_JSON: [{"productId": "uuid", "productName": "string", "quantity": number, "unit": "string", "unitPrice": number, "totalPrice": number}]`;

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
            temperature: 0.2,
          }),
        });

        if (response.ok) {
          const resData = await response.json();
          const content = resData.choices?.[0]?.message?.content || "";
          if (content) {
            let extractedItems: any[] = [];
            const jsonMatch = content.match(/ITEMS_JSON:\s*(\[[\s\S]*?\])/);
            if (jsonMatch) {
              try {
                extractedItems = JSON.parse(jsonMatch[1]);
              } catch (e) {}
            }
            const cleanReply = content.replace(/ITEMS_JSON:[\s\S]*$/, "").trim();
            return NextResponse.json({
              success: true,
              intent: extractedItems.length > 0 ? "ORDER" : "QUERY",
              reply: cleanReply,
              speakText: cleanReply,
              items: extractedItems,
            });
          }
        }
      } catch (err) {
        console.warn("Gnani Evon remote chat failed, continuing with intelligent real-database matcher");
      }
    }

    // 5. Intelligent Real-Database Reasoning Engine
    // Check if customer asked about shop timings, phone, or address
    if (
      queryLower.includes("address") ||
      queryLower.includes("kahan hai") ||
      queryLower.includes("pata") ||
      queryLower.includes("कहाँ") ||
      queryLower.includes("पता") ||
      queryLower.includes("dukaan") ||
      queryLower.includes("shop")
    ) {
      const reply = `${shopName} ${shopAddress} par sthit hai. Dukaan subah 8 baje se raat 9:30 baje tak khuli rehti hai. Phone number ${shopPhone} hai.`;
      return NextResponse.json({
        success: true,
        intent: "SHOP_INFO",
        reply,
        speakText: reply,
        items: [],
      });
    }

    // Check if customer is asking about a product's price or availability
    const matchedProducts = (products || []).filter((p: any) => {
      const nameL = (p.name || "").toLowerCase();
      const hindiL = (p.hindi_name || "").toLowerCase();
      const brandL = (p.brand || "").toLowerCase();
      const aliasL = (typeof p.aliases === "string" ? p.aliases : "").toLowerCase();

      return (
        queryLower.includes(nameL) ||
        (hindiL && queryLower.includes(hindiL)) ||
        (brandL && queryLower.includes(brandL)) ||
        (aliasL && queryLower.includes(aliasL)) ||
        nameL.split(/\s+/).some((token: string) => token.length > 3 && queryLower.includes(token))
      );
    });

    const isAskingPriceOrStock =
      queryLower.includes("price") ||
      queryLower.includes("rate") ||
      queryLower.includes("भाव") ||
      queryLower.includes("kitne ka") ||
      queryLower.includes("kitna") ||
      queryLower.includes("kitne") ||
      queryLower.includes("kya rate") ||
      queryLower.includes("available hai") ||
      queryLower.includes("mil jayega") ||
      queryLower.includes("stock") ||
      queryLower.includes("hai kya") ||
      queryLower.includes("kya price");

    if (matchedProducts.length > 0 && isAskingPriceOrStock) {
      const p = matchedProducts[0];
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

    // If customer is placing an order or asking to add items
    // Call our extract API handler logic
    const extractRes = await fetch(
      new URL("/api/gnani/extract", req.url).toString(),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: query }),
      }
    );

    const extractJson = await extractRes.json();
    const extracted = extractJson.items || [];

    const orderItems: any[] = [];
    for (const ext of extracted) {
      const spoken = (ext.spokenItem || "").toLowerCase().trim();
      const found = (products || []).find((p: any) => {
        const nameL = (p.name || "").toLowerCase();
        const hindiL = (p.hindi_name || "").toLowerCase();
        const brandL = (p.brand || "").toLowerCase();
        const aliasL = (typeof p.aliases === "string" ? p.aliases : "").toLowerCase();

        if (nameL.includes(spoken) || spoken.includes(nameL)) return true;
        if (hindiL && (hindiL.includes(spoken) || spoken.includes(hindiL))) return true;
        if (brandL && (spoken.includes(brandL) || brandL.includes(spoken))) return true;
        if (aliasL && aliasL.includes(spoken)) return true;

        const tokens = spoken.split(/\s+/).filter((t: string) => t.length > 2);
        for (const t of tokens) {
          if (nameL.includes(t) || aliasL.includes(t)) return true;
        }
        return false;
      });

      if (found) {
        orderItems.push({
          productId: found.id,
          productName: `${found.brand ? found.brand + " " : ""}${found.name}`.trim(),
          unit: found.unit,
          quantity: ext.quantity || 1,
          unitPrice: found.selling_price,
          totalPrice: found.selling_price * (ext.quantity || 1),
          availableStock: found.available_stock,
          stockError: found.available_stock < (ext.quantity || 1),
        });
      } else {
        orderItems.push({
          productId: "unmatched-" + Math.random().toString(36).substring(2, 9),
          productName: ext.spokenItem,
          unit: ext.unit || "piece",
          quantity: ext.quantity || 1,
          unitPrice: 50,
          totalPrice: 50 * (ext.quantity || 1),
          availableStock: 10,
          stockError: false,
        });
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

    // General fallback response
    const defaultReply = `Namaste! Sharma Kirana Store mein aapka swagat hai. Aap bolkar kisi bhi item ka rate pooch sakte hain ya seedha order de sakte hain (jaise: "दो किलो आटा और एक पैकेट बटर चाहिए").`;
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
