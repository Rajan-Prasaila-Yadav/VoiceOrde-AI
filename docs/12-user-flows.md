# 🔄 User Flows & Order Channels

Both customers and shopkeepers can place orders, and both use the **same order engine** so prices and rules never differ.

---

## Customer Flow

1. **Open the shop page**, pick a language, and tap **Speak your order** (typing and a cart are available as fallback).

2. **Speak**, for example: *"Bhaiya, do kilo chawal, ek litre tel aur paanch kilo aata bhej dena."*

3. **Gnani Prisma returns a transcript.** The customer can correct it before anything else happens.

4. **An LLM extracts items, quantities and units.** It does not choose products or prices.

5. **The backend matches each item to the imported catalogue.** Unclear items (for example "two packets of atta" when several pack sizes exist) are shown for the customer to choose.

6. **The server calculates** the subtotal, delivery fee and total from database prices.

7. **The customer enters** name, phone and delivery address.

8. **The summary is shown and read aloud** with Gnani Timbre. The customer presses **Confirm order**. Audio alone never confirms.

9. **The order is saved once**, and the customer gets a tracking link.

---

## Shopkeeper Flow

1. **Sign in**, then choose **New order → Record for customer** (useful for phone calls and walk-ins).

2. **Speak or type** the order, review the transcript and the matched items, and resolve any flags.

3. **Select or enter** the customer's delivery details and read the total to the customer.

4. **Submit after the customer agrees.** The confirmation method and time are stored.

5. **Move the order** through: `placed → accepted → preparing → ready for dispatch → dispatched → delivered`. Cancelling needs a reason.

---

## Catalogue Setup (Shopkeeper, One Time)

Upload a **CSV of products**, preview valid and invalid rows, fix errors, then commit. Existing products are **never deleted** just because a later CSV omits them.

---

## How an Order Arrives: App, Voice Note or Phone Call

Every channel ends in the **same transcript** and the **same order engine**, so prices and rules never differ. Whenever an item is unclear, the loop asks a person instead of guessing.

| Channel | How It Works | Extra Cost |
|---------|-------------|-----------|
| **Customer app** | The customer opens the shop link or scans the shop's QR code, taps the mic and speaks | Only Gnani credits |
| **Voice note** | Customers already send WhatsApp voice notes. The shopkeeper uploads the note (or the customer records it on the shop link); Prisma transcribes it | Only Gnani credits |
| **Phone call** | The customer calls the shop's normal number. The shopkeeper puts the call on speaker and taps **Record** in the app on a second device, such as a tablet or laptop, so the app hears the caller | None beyond the normal phone plan |

### Do I Need a Real Phone Line or Pay Per Call?

**Not for the MVP.** The app never makes or answers calls itself. Answering calls automatically would need a telephony provider, a business number and per-minute charges, plus Indian telecom rules, and it is not needed to prove the idea. If it is added later, check a provider's current pricing and rules first.

### Who Pays What

- **Customer:** Nothing to use the app; only their own normal call or data charges.
- **Shopkeeper:** Their normal phone plan. The speech and voice calls use Gnani credits (5,000 programme credits during the challenge; check Gnani's pricing for any use after it).
- Audio from a speaker call is noisier, so accuracy can drop. That is why the transcript is always editable and a phone-audio test is part of the demo.

> If the shopkeeper records the order for a customer: the shopkeeper still reads the total back and asks "Confirm?" before saving. The app stores that it was confirmed by phone, who confirmed it and when.

---

*[← User Personas](./11-user-personas.md) | [Guest & Delivery Rules →](./13-guest-and-delivery-rules.md)*
