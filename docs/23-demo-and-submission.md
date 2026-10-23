# 🎬 Demo Script, Submission & Interview Prep

---

## 60 to 90 Second Demo Script

Record the **real running app** on a phone, with no API keys or real phone numbers visible.

| Time | Scene | Show |
|------|-------|------|
| **0–10 s** | The problem | A busy shop, a fast mixed-language order, a handwritten bill with a mistake |
| **10–25 s** | Speak naturally | A Hinglish order recorded in the app; Gnani Prisma's transcript appears and is corrected live |
| **25–45 s** | Prove the intelligence | Catalogue matching with real prices; an ambiguous pack size or out-of-stock item makes the app ask instead of guess |
| **45–65 s** | Complete the order | Delivery address, total, Timbre reading the summary, Confirm, and the order number |
| **65–90 s** | Shop side | The order in the shopkeeper dashboard moving to dispatched; project name and one-line impact |

### What Must Be Visible in the Recording

- ✅ A real, working application — not a Figma prototype or simulated result
- ✅ A genuine Prisma API integration and a clearly visible transcription result
- ✅ A catalogue imported through the actual import workflow
- ✅ Real catalogue-backed prices and server-calculated totals
- ✅ At least one deliberately tested ambiguity or validation failure
- ✅ A confirmed order persisted in the database
- ✅ Timbre-generated audio if the API is available and working
- ✅ A clear explanation of what you built and what Gnani models contributed
- ❌ Do NOT show API keys, private customer information, or real phone numbers

---

## Draft LinkedIn / X Post

> **Introducing VoiceOrder AI:** a voice-first ordering assistant for India's neighbourhood shops.
>
> Speak an order in Hindi, Hinglish or a regional language. Gnani Prisma turns speech into text, the shop's own catalogue supplies products and prices, and nothing is saved until you confirm. Ambiguous items get a question, not a guess.
>
> Built for the Great Indian AI Internship Challenge.
>
> Demo: [link]
>
> `#GnaniAI` `#GreatIndianAIInternshipChallenge`

**Tips:**
- Tag Gnani AI in the post
- Mention Timbre **only if it works** in the final build
- Post a short "building-in-public" update this week
- Post the final demo **well before Nov 10**, because engagement is verified

---

## Award Fit

| Award Category | Why VoiceOrder AI Qualifies |
|---------------|-----------------------------|
| **Mixed Vibes** | Hinglish and code-mixed orders are the core use case |
| **Real Deal** | Kirana stores and delivery — a real-world problem |
| **Small Town, Big Build** | If your college is in a Tier 2 or Tier 3 town |
| **Solo Ninja** or **Two-Person Army** | Depending on how you register |
| **Demo Day Drop** | A sharp 60-second video showing the full order flow |

> Awards are not tied to internship selection. One person or team can win **only one** award.

---

## My 30-Second Interview Answer

> "I built a voice order desk for neighbourhood shops. A shopkeeper or customer speaks an order in Hindi, Hinglish or a regional language. Gnani Prisma turns it into text, my code matches it to the shop's catalogue and asks when anything is unclear, the server works out the bill, and nothing is saved until the customer confirms. **The AI never decides the price.**"

---

## FAQ — Questions and Answers in Simple Words

### Why would anyone use this when Blinkit, Zomato and Swiggy exist?
Those apps are for customers who browse and tap. This is for the shopkeeper who takes orders by talking, from regular customers who trust the shop. It is not a rival to them.

### Who is the real user?
The shopkeeper first. The customer benefits because ordering is just speaking.

### How does a phone order work, and does it cost money?
The customer calls the shop as usual. The shopkeeper puts the call on speaker and taps Record on another device. No call API and no extra phone charges. Only Gnani credits are used.

### Does the app answer calls by itself?
Not in this version. That needs a telephony provider with a business number and per-minute charges, so it is a later step.

### What if the customer is not logged in or gives no details?
Guest checkout needs only a name and phone. Delivery also needs an address; without one the app offers pickup. Confirm stays disabled until the required details are filled.

### Where will it deliver?
Only the pincodes or areas the shopkeeper lists. Outside them, the app offers pickup.

### How do payments work?
Cash, UPI or credit. For UPI the app shows a QR for the exact bill amount, and the money goes directly to the shop's account. The shopkeeper checks their UPI app and taps Paid, because the app cannot see the payment without a payment gateway.

### How does the customer get the bill?
In the app, on the tracking page. If the shopkeeper recorded the order, they tap Send bill and WhatsApp, SMS or print opens ready to send.

### What if the item is not found, said twice, in a different unit or has several sizes?
The app never guesses. It shows "not found", merges repeats after asking, converts only simple units, and lists sizes and brands to choose from.

### Can the AI decide a price?
**No.** Prices and stock come only from the catalogue. The AI only turns speech into a list of items.

### What exactly does Gnani do?
Prisma turns speech into text. Timbre reads the bill aloud. Everything else — matching, pricing, rules and records — is my own work.

### What if Timbre or Prisma does not work for a language?
The app falls back to typing and the written summary, and I will claim only what I tested.

### Is there history, payment tracking and rating?
Yes. Customers see past orders, shopkeepers see orders, customers and unpaid balances, and a delivered order can be rated 1 to 5.

### What happens to voice recordings?
The audio is processed and discarded by default; only the text and the order are kept.

### Web app or mobile app?
One responsive web app that works like an app on a phone. It is faster to build and easy for judges to open.

### What do the judges look at?
A working demo, real use of Gnani models, public engagement on the post, and then your interview, where you must explain your own build.

---

*[← Build Plan & Testing](./22-build-plan-and-testing.md) | [Back to Index →](./README.md)*
