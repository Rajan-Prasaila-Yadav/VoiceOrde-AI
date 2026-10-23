# ⚖️ Advantages & Limitations

---

## Advantages

- ✅ People order the way they speak — in Hindi, Hinglish or a regional language — with no typing
- ✅ It works with habits shops already have (phone calls and voice notes); customers need no new app
- ✅ Prices and stock come from the shop's catalogue, so billing mistakes drop
- ✅ The app asks when unsure instead of guessing
- ✅ Setup is quick: upload a CSV and start
- ✅ It keeps records of orders, payments, credit and customers
- ✅ No phone-line fees are needed for the MVP

---

## Limitations and Solutions

| Limitation | What Could Go Wrong | Solution |
|-----------|-------------------|---------|
| **Speech is misheard in noise or strong accents** | Wrong item or quantity | Editable transcript, a question whenever unsure, a read-back of the total, and a test set that includes noisy audio |
| **Brand or local product names are missing from the catalogue** | "Not found" | An `aliases` column in the CSV; the shopkeeper adds an alias from the "not found" list |
| **The LLM misreads a quantity** | Wrong amount | Strict JSON output, quantity checks, quantities shown large on the confirm screen, tests on tricky phrases |
| **Gnani API is down or credits run out** | Voice stops working | Typing and the product list still work; credit use is tracked; keys stay on the server |
| **Timbre is in beta** | Spoken read-back fails | The written summary is always shown, and Timbre is claimed only if it works in the final build |
| **Speakerphone audio is poor** | Lower accuracy | Test it, advise a quiet corner, always let the shopkeeper edit; real call handling is a later step |
| **Weak internet in small towns** | Order lost or double sent | Clear "not submitted" and "result unknown" states, safe retry with an idempotency key |
| **Wrong prices or stock in the catalogue** | Wrong bill | Import preview, quick price and stock edit, "last updated" shown |
| **Prank or fake orders** | Wasted effort | The shop accepts each order, can call to check, can block a number, and requests are rate limited |
| **UPI payment cannot be verified by the app** | Marked paid by mistake | Only the shopkeeper marks Paid, with an optional note for the UPI reference, and a daily cash, UPI and credit summary to reconcile |
| **Private data (voices, addresses)** | Leak | Raw audio deleted after use, no transcripts or phones in logs, HTTPS, access checks on every route, unguessable tracking links |
| **Shopkeepers may not adopt it** | Low use | Big buttons, a one-minute start, works alongside current habits |
| **Screens are in English first** | Some users struggle | Voice supports several languages; Hindi labels can be added if time allows |
| **Only 17 days** | Unfinished build | Strict must-have list and the build plan |
| **Duplicate orders** | Double charge | Disabled Confirm button after one tap and an idempotency key |

---

*[← Safety & Validation](./20-safety-and-validation.md) | [Build Plan & Testing →](./22-build-plan-and-testing.md)*
