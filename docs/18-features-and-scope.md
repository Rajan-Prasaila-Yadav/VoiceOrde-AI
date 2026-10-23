# ✅ Features, Scope & Gnani Usage

> The MVP must be finished by Nov 10, so features are split into what is required for a trustworthy demo and what is cut first if time runs short.

---

## Feature Priority

| Feature | Priority | Why It Matters |
|---------|----------|---------------|
| CSV catalogue import with row-level error report | **Must** | Prices and products come from the shop, not the AI |
| Voice order entry (customer and shopkeeper) with typed fallback | **Must** | Core product; typing keeps it usable if voice fails |
| Editable transcript | **Must** | Speech recognition is never perfect |
| Item extraction and catalogue matching | **Must** | Turns words into real products |
| Clarification for ambiguous or missing items | **Must** | Prevents wrong orders; the key trust feature |
| Server-calculated totals and delivery fee | **Must** | The client can never set prices |
| Explicit confirmation before saving | **Must** | No order without a clear yes |
| Delivery address and order status flow | **Must** | Makes it a real fulfilment tool |
| Shopkeeper dashboard with order list and filters | **Must** | Where the shop runs the day |
| Spoken order summary (Gnani Timbre) | **Should** | Strong demo moment; written summary is the fallback |
| Daily sales summary | **Could** | Nice for the shopkeeper |
| Saved customer addresses | **Could** | Convenience |
| Installable PWA | **Could** | Only if time remains |
| More languages | **Could** | Add only after end-to-end testing |

---

## What's NOT in This Version

- Phone calling (automatic call answering)
- WhatsApp bot
- Online payment gateway (UPI QR is shown, but shopkeeper confirms payment by hand)
- Multiple shops
- Route planning
- Complex delivery-fee rules (only a flat fee or free above an amount)

---

## What's In Scope (Kept Simple)

- A UPI QR on the bill
- A credit (udhaar) record per customer
- Order history for customers and the shop
- A 1 to 5 rating after delivery

---

## Where Gnani AI Is Used

Gnani Prisma is the core of the project; Gnani Timbre adds the spoken confirmation. **Everything that decides the order is my own engineering**, which is the part to explain in the interview.

| Part | Provided By | Role |
|------|------------|------|
| **Speech to text** | Gnani Prisma | Converts the customer's spoken Hindi, Hinglish or regional-language order into text |
| **Spoken summary** | Gnani Timbre (beta) | Reads the final order and total aloud before confirmation |
| **Item extraction** | A structured-output LLM | Pulls items, quantities and units from the transcript, with no prices |
| **Product matching, pricing, stock, delivery fee** | My code and database | The source of truth for every rupee and every item |
| **Confirmation, order saving, status tracking** | My code and database | Prevents duplicates and unconfirmed orders |

---

## Honesty Rules for the Submission

- List **only the Gnani models that are actually working** in the submitted build
- Support **only the languages tested end to end** (speech in, order out), and report which ones
- Check the **Gnani documentation** for each API's endpoint, audio formats, language codes and limits before coding, and keep the API calls behind a small adapter so the rest of the app does not depend on them
- Keep **API keys on the server only**

---

*[← Screens & UI](./17-screens-and-ui.md) | [Architecture →](./19-architecture.md)*
