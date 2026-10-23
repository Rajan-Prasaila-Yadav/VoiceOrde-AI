# 🛡️ Safety & Validation Rules

> A wrong quantity, product or price is a **real financial loss**, so the app is built to refuse to guess.

---

## Core Validation Rules

| Situation | Required Behavior |
|-----------|-------------------|
| Ambiguous product or pack size | Ask the user to choose; **never auto-pick** |
| Product not in catalogue | Show "not found" and offer catalogue search; **never invent or substitute** |
| Out of stock or unpublished | Flag it; it **cannot be ordered** |
| Quantity missing, zero, negative or huge | Ask again or reject |
| Empty or failed transcription | **Never treated as an order**; offer retry or typing |
| Client sends a price or total | **Ignored**; the server recalculates everything |
| Price or stock changed after quote | Quote is invalidated and the customer reconfirms |
| Double tap on Confirm or network retry | An idempotency key ensures exactly one order |
| Gnani API down or language unsupported | Typed ordering still works; the limitation is explained |
| Public tracking page | Shows status only; **no phone number or full address** |

---

## Additional Safety Rules

### Money
- Money is stored as **integer paise**, never as floating-point numbers
- All calculations are done **server-side**
- Client-supplied prices and totals are **ignored**

### Stock
- Stock is **reserved** when an order is confirmed
- Stock is **restored** if the order is cancelled before dispatch

### Data Integrity
- Each order stores a **snapshot** of items, prices and address, so later edits never change history
- Status changes follow a **fixed order** and are logged with who changed them and when

### Privacy
- Raw audio is **discarded after processing**
- Logs **never contain** transcripts, phone numbers or API keys
- HTTPS on all routes
- Access checks on every backend route
- Unguessable tracking links (random tokens, not sequential IDs)

---

*[← Architecture](./19-architecture.md) | [Advantages & Limitations →](./21-advantages-and-limitations.md)*
