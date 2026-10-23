# 📱 Screens & UI Wireframes

> Build one responsive web app that behaves like an app on a phone (it can be added to the home screen). A separate Android or iOS app is not needed for the challenge. **Design the phone screens first** and let them grow into the tablet and desktop layouts.

---

## Customer Screens (Phone)

### Screen 1: Shop Home

```
+------------------------------+
| Sharma Kirana Store    [EN v]|
| Open 8am-9pm | Delivery Rs 30|
+------------------------------+
| [ Search products...    ]    |
|                              |
| Rice 1 kg        Rs   72  [+]|
| Wheat flour 5 kg Rs  310  [+]|
| Cooking oil 1 L  Rs  110  [+]|
| Sugar 1 kg       Rs   48  [+]|
+------------------------------+
| (MIC)  Speak your order      |
| or type your order           |
+------------------------------+
```

---

### Screen 2: Voice Capture

```
+------------------------------+
| < Back            Language:  |
|                   [Hindi v]  |
+------------------------------+
|                              |
|        ( ((  MIC  )) )       |
|        Recording... 0:07     |
|                              |
|  [ Stop ]        [ Retry ]   |
|                              |
|  Tip: say items and amounts. |
|  Example: "do kilo chawal"   |
|                              |
|     [ Type instead ]         |
+------------------------------+
```

---

### Screen 3: Check the Items (Clarification Happens Here)

```
+------------------------------+
| Check your order             |
+------------------------------+
| You said:                    |
| "do kilo chawal aur atta"    |
| [ Edit text ]                |
+------------------------------+
| Rice 1 kg  x2   Rs 144   [x]|
| Atta ?     Choose size:      |
|  ( ) 1 kg  Rs 65             |
|  ( ) 5 kg  Rs 310            |
|  ( ) 10 kg Rs 600  Out       |
| Kaju     NOT FOUND [Search]  |
+------------------------------+
| Subtotal            Rs 144   |
| [ Continue ]  (disabled)     |
+------------------------------+
```

---

### Screen 4: Delivery Details

```
+------------------------------+
| Delivery details             |
+------------------------------+
| ( ) Delivery   ( ) Pickup    |
| Name   [ Sunita           ]  |
| Phone  [ 97XXXXXX21       ]  |
| Address[ 12 Market Rd     ]  |
| Area   [ Main Market      ]  |
| Pincode[ 500001 ]  OK area   |
| Landmark (optional)          |
|        [ Near bus stop    ]  |
| Note   [ Call on arrival  ]  |
| Fee: Rs 30 (flat)            |
| [ Review order ]             |
+------------------------------+
```

---

### Screen 5: Confirm

```
+------------------------------+
| Confirm your order           |
+------------------------------+
| Rice 1 kg x2        Rs 144  |
| Cooking oil 1 L x1   Rs 110  |
| Wheat flour 5 kg x1  Rs 310  |
| Delivery             Rs  30  |
| TOTAL                Rs 594  |
+------------------------------+
| Deliver to: 12 Market Rd     |
| Pay by: (o) Cash  ( ) UPI    |
|                              |
| [ Listen to summary ]        |
| [ Edit ]   [ CONFIRM ORDER ] |
+------------------------------+
```

---

### Screen 6: Tracking, Bill & Rating

```
+------------------------------+
| Order VO-00123               |
+------------------------------+
| [x] Placed        6:42 PM    |
| [x] Accepted      6:44 PM    |
| [x] Packing       6:50 PM    |
| [>] Out for delivery         |
| [ ] Delivered                |
+------------------------------+
| Payment: UPI - UNPAID        |
| [ Show bill ]  [ Show QR ]   |
| [ Call shop ]                |
+------------------------------+
| After delivery: rate 1-5     |
|  (*)(*)(*)(*)( )             |
+------------------------------+
```

---

## Shopkeeper Screens (Phone)

### Screen 1: Dashboard

```
+------------------------------+
| Today        [ + New order ] |
+------------------------------+
| Orders 12  Sales Rs 6,420    |
| To pack 3  Unpaid Rs 1,150   |
+------------------------------+
| #123 Sunita  Placed    Rs 594|
| #122 Ravi    Packing   Rs 240|
| #121 Meena   Delivered Rs  90|
+------------------------------+
| [Orders] [Catalogue] [More]  |
+------------------------------+
```

---

### Screen 2: Record an Order (Call or Walk-In)

```
+------------------------------+
| New order: record a call     |
+------------------------------+
| Customer [ 97XXXXXX21     ]  |
|  Found: Sunita, last address |
| (MIC) Record   [ Type ]      |
| Heard: "do kilo chawal..."   |
+------------------------------+
| Rice 1 kg x2   Rs 144   ok   |
| Atta ?  pick size  [Choose]  |
+------------------------------+
| Total Rs 594                 |
| Read back to customer:       |
| [ Play summary ] [ Confirm ] |
| Confirmed by: ( ) phone      |
+------------------------------+
```

---

### Screen 3: Order Detail, Status & Payment

```
+------------------------------+
| #123  Sunita  97XXXXXX21     |
| 12 Market Rd, Main Market    |
+------------------------------+
| Rice 1 kg x2          144    |
| Cooking oil 1 L x1     110   |
| Wheat flour 5 kg x1    310   |
| Delivery                30   |
| TOTAL Rs 594                 |
+------------------------------+
| Status: Packing              |
| [ Mark ready ] [ Cancel ]    |
| Payment: UNPAID              |
| [ Paid cash ] [ Paid UPI ]   |
| [ On credit ]  [ Send bill ] |
+------------------------------+
```

---

## Shopkeeper on Laptop / Tablet

```
+---------------------------------------------------------------------+
| VoiceOrder AI   Sharma Kirana Store                       [Rahul v] |
+-----------+---------------------------------------------------------+
| Dashboard | Today: Orders 12 | Sales Rs 6,420 | Unpaid Rs 1,150     |
| Orders    | Orders   [Search] [Status v] [Payment v] [Date v]       |
| New order | #   Customer Items Total   Status     Pay     Action    |
| Catalogue | 123 Sunita   3     594     Packing    Unpaid  [Open]    |
| Customers | 122 Ravi     2     240     Out        Paid    [Open]    |
| Reports   | 121 Meena    1     90      Delivered  Credit  [Open]    |
| Settings  |                                                         |
+-----------+---------------------------------------------------------+
```

---

## Responsive Rules

| Screen | Layout |
|--------|--------|
| **Phone (narrow)** | One column, bottom tab bar, large mic button, sticky Confirm button, touch targets at least 48 px, text at least 16 px |
| **Tablet** | Two columns: order list on the left, detail on the right |
| **Laptop** | Sidebar plus table, as above |

---

## Required UI States

Every screen needs these states:

| State | Description |
|-------|-------------|
| **Loading** | Spinner or skeleton while data loads |
| **Empty** | Helpful message when no data exists yet |
| **Error** | Error message with a **Retry** button |
| **Microphone denied** | Explain how to grant permission |
| **No speech heard** | Prompt to retry or type instead |
| **Too noisy** | Suggest a quieter spot or use typing |
| **Voice API failed** | The typing box is always one tap away |

---

*[← Order Lifecycle](./16-order-lifecycle.md) | [Features & Scope →](./18-features-and-scope.md)*
