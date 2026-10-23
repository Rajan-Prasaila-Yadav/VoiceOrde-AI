# VoiceOrder AI — Project Overview

> **VoiceOrder AI** turns a spoken grocery order in Hindi, Hinglish or a regional language into a verified, priced order that a shopkeeper can deliver. The AI understands the request; the shop's own catalogue decides products, prices and totals; nothing is saved until the customer confirms.

*Oct 24, 2026 · @rthgy*

---

## One-Line Pitch

A voice order desk for neighbourhood shopkeepers. Any spoken order — from a walk-in, a phone call or a voice note — in Hindi, Hinglish or a regional language, becomes a correct, priced bill in seconds. Nothing is saved until the customer confirms.

---

## The Problem

Small shopkeepers take orders in person or by phone. They write items by hand, add up the bill in their head and repeat the order back. When the shop is busy, the caller speaks fast or mixes languages, mistakes happen: a wrong quantity, a wrong product or a wrong total. **Each mistake is direct money lost or a lost customer.**

---

## Who It Is For

- **Kirana and grocery shop owners** who take phone and walk-in orders.
- **Their customers**, who prefer speaking in their own language to typing.
- **Smaller towns especially**, where speech is multilingual and billing software is rare.

---

## The Core Idea

> **AI interprets, the database decides.**

The model never invents products, prices or totals. If an item is unclear, the app asks. This is what separates it from a demo that only transcribes speech: VoiceOrder AI ends in a **real, confirmed business transaction**.

---

## Why This Idea, and Why Not Just Use Blinkit or Zomato

Blinkit, Zomato, Swiggy and Flipkart win on speed, huge catalogues, offers and delivery fleets. A student project cannot beat them, so VoiceOrder AI does not try. It serves the neighbourhood shopkeeper, and the shopkeeper's real competitor is **not Blinkit: it is a notebook and a busy evening**.

| | **Big Delivery Apps** | **VoiceOrder AI** |
|---|---|---|
| **Built for** | Customers who browse and tap | Shopkeepers who take orders by talking |
| **How the order arrives** | In the app only | Walk-in, phone call, voice note or app |
| **Language** | Mostly typing, English-first menus | Speaking in Hindi, Hinglish or a regional language |
| **Relationship** | Anonymous, platform owns the customer | The shop's own regular customers |
| **Credit (udhaar) and local trust** | Not supported | Can be tracked per customer |
| **Setup for the shop** | Onboarding, commission, rules | Upload a CSV and start |

---

## Why This Needs Gnani's Models and Not a Generic Assistant

| Gnani Strength (from Gnani's published materials) | Why It Matters Here |
|---|---|
| Speech-to-text trained on noisy telephone audio | Shop floors and phone calls are noisy |
| Hinglish and other code-mixed speech | "Do kilo chawal aur ek litre tel" is how people really order |
| Indian languages | A regional-language order works without typing |
| Text-to-speech that handles Indian names and numbers | The bill can be read back so the customer can check it by ear |

---

## Honest Risks

Brand and regional product names may be misheard; shops may be slow to switch; many teams will build "voice assistants". The answer to all three is the same: **show ambiguity handling, correct totals and a noisy-audio case in the demo**.

---

## Finalized Product Decisions

| Area | Decision |
|---|---|
| Users | Customers and shopkeepers |
| Languages | Multiple supported Indian languages, subject to verified API support |
| Voice input | Gnani Prisma speech-to-text |
| Voice output | Gnani Timbre text-to-speech, subject to current API access |
| AI extraction | Structured item/quantity extraction, using a compatible LLM |
| Catalogue | Shopkeeper imports an existing product list |
| Product truth | Database controls prices, units, and stock |
| Fulfilment | Customer address, delivery instructions, and delivery status |
| Confirmation | Explicit review and confirmation before placing an order |
| Initial deployment | One shop, one inventory, one currency (INR) |
| Payments | Cash on delivery / UPI QR / credit (udhaar); no online payment gateway |
| Application | Responsive web app, installable as a PWA only if time permits |

---

*[← Timeline & Action Plan](./09-timeline-and-action-plan.md) | [User Personas →](./11-user-personas.md)*
