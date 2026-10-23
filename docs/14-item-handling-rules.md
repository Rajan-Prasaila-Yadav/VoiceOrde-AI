# 📦 Item Handling Rules — Duplicates, Units, Variants & Edge Cases

> People order loosely, so the catalogue match has strict rules. **In every case below, the app asks the person to choose; it never picks silently.**

---

## Complete Item Handling Matrix

| Situation | Example | What the App Does |
|-----------|---------|-------------------|
| **Same item said twice** | "2 kilo chawal ... aur 1 kilo chawal" | Shows one line and asks **"Add up to 3 kg?"** |
| **Item not in the catalogue** | "kaju" | Shows **"Not found"** with a search box. No substitution. A shopkeeper may add a manual line with a price, marked `manual` on the bill |
| **Different unit** | "aadha litre tel" but oil is sold in 1 L bottles | Converts only simple pairs (kg ↔ g, litre ↔ ml). Otherwise asks **"500 ml or a 1 L bottle?"** |
| **Unit does not fit the product** | "do packet chawal" but rice is sold by kg | Asks **"How many kg?"** |
| **Size variants** | "atta" with 1 kg, 5 kg and 10 kg packs | Shows the sizes to choose from |
| **Brand variants** | Two brands of the same item | Shows both with price |
| **Two units in one phrase** | "do kilo aur paanch sau gram chini" | Shows **"2 kg + 500 g = 2.5 kg"** |
| **Hindi fraction words** | "dedh kilo", "dhai kilo", "sava kilo" | Reads them as **1.5, 2.5 and 1.25**, and shows the number so the user can check |
| **Quantity missing** | "chini bhej dena" | Asks **"How much?"** |
| **Several quantities for one item** | "teen packet, ek bada, ek chhota" | Asks the user to split them |
| **Only part is in stock** | 5 asked, 3 available | Asks **"Take 3?"** |
| **Out of stock** | Product at zero | Flagged; the app may list other products from the same category, but only the user can pick one |
| **Very large quantity** | "100 kg atta" | Warns and asks the user to re-enter |
| **Misheard word** | Wrong product in the transcript | The user edits the transcript text and extraction runs again |
| **Price changed after the quote** | Shopkeeper updated a price | The quote is rebuilt and the customer confirms again |

---

## Key Principles

1. **Never auto-pick** — if there's any ambiguity, ask
2. **Never substitute** — if an item isn't found, show "Not found", not a replacement
3. **Never invent prices** — all prices come from the catalogue database
4. **Always show the number** — when converting Hindi fractions or merging quantities, display the result for confirmation
5. **Respect stock** — out-of-stock items cannot be ordered, partial stock requires agreement

---

*[← Guest & Delivery Rules](./13-guest-and-delivery-rules.md) | [Billing & Payments →](./15-billing-and-payments.md)*
