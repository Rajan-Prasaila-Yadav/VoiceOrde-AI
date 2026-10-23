# 💰 Billing, Payments & UPI QR

## Sample Bill

The bill is created **only after the customer confirms**. Names, quantities and prices are copied into the order, so changing a price later never changes an old bill. The numbers below are made up.

```
+----------------------------------------+
|          SHARMA KIRANA STORE           |
|   Main Market, Example Town - 500001   |
|           Phone: 98XXXXXX10            |
+----------------------------------------+
| Bill no : VO-00123                     |
| Date    : 24 Oct 2026, 6:42 PM         |
| Customer: Sunita (97XXXXXX21)          |
| Deliver : 12 Market Rd, Main Market    |
|           (Near bus stop)              |
+----------------------------------------+
| Item               Qty    Rate  Amount |
| Rice 1 kg            2   72.00  144.00 |
| Cooking oil 1 L      1  110.00  110.00 |
| Wheat flour 5 kg     1  310.00  310.00 |
+----------------------------------------+
| Subtotal                        564.00 |
| Delivery fee                     30.00 |
| TOTAL                           594.00 |
+----------------------------------------+
| Payment : UPI - UNPAID                 |
| Confirmed: on screen, 6:40 PM          |
|                                        |
|     [ UPI QR CODE for Rs 594.00 ]      |
|                                        |
|     Thank you for shopping with us     |
+----------------------------------------+
```

---

## What Every Bill Keeps

- Shop name, address and phone
- Unique bill number
- Date and time
- Customer name and phone
- Delivery address or "pickup"
- Each item with quantity, unit, rate and amount
- Subtotal, delivery fee, any discount and total
- Payment mode and status
- How and when the customer confirmed
- A UPI QR when payment is pending
- A `manual` mark on any hand-added line
- A cancelled bill stays on record marked `cancelled`

> If the shop is registered for GST, an optional tax ID field can be printed; the MVP does not calculate tax, so check that with an accountant.

---

## Payment Modes

| Payment Mode | How It Works | Who Confirms Payment |
|-------------|-------------|---------------------|
| **Cash** | Paid at delivery or pickup | Shopkeeper or helper taps **Paid** |
| **UPI QR** | The app builds a payment QR from the shop's own UPI ID, the bill amount and the bill number. The customer scans it with any UPI app and the money goes straight to the shop | Shopkeeper checks their UPI app or SMS, then taps **Paid**. Without a payment gateway the app cannot confirm it automatically |
| **Credit (udhaar)** | Marked **On credit** and added to that customer's balance | Part payments are recorded later until the balance is zero |
| **Partly paid** | An advance is recorded and the balance stays open | Shopkeeper records each payment |

### Payment Statuses

`Unpaid` → `Paid` → or `Partly paid` → or `On credit`

> The UPI QR appears only if the shop has saved a UPI ID in Settings; otherwise only cash and credit are offered.

---

## How the Bill Is Sent

| Scenario | How It's Sent |
|----------|--------------|
| **Customer ordered in the app** | The bill appears on their tracking page right after confirmation, with **Download** and **Share** buttons |
| **Shopkeeper recorded the order** (call or walk-in) | The shopkeeper taps **Send bill** and chooses WhatsApp, SMS, copy link or print. WhatsApp and SMS open with the message and bill link ready, and the shopkeeper presses send |
| **Voice note orders** | The shopkeeper sends the bill back in the same WhatsApp chat |

> Fully automatic sending needs a paid messaging service and approvals, so it is left for later.

---

*[← Item Handling Rules](./14-item-handling-rules.md) | [Order Lifecycle →](./16-order-lifecycle.md)*
