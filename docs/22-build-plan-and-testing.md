# 🧪 Build Plan & Testing

> Start by testing the Gnani APIs with real Hinglish recordings, so any language or audio problem shows up in the first three days. If time runs short, cut Timbre, saved addresses and the daily summary first; **never cut the import, matching, clarification and confirmation steps**.

---

## Build Order

| Phase | Focus |
|-------|-------|
| **Phase 1** | Catalogue and order foundation — schema, auth, shop scoping, CSV import, product management, quote calculation, manual order creation. Seed demo data and write tests |
| **Phase 2** | Voice and extraction — integrate Prisma, transcript editing, structured extraction, catalogue matching, ambiguity handling. Preserve the typed-order path throughout |
| **Phase 3** | Delivery and confirmation — customer address capture, delivery-fee rules, final confirmation, idempotent order creation, tracking, status transitions |
| **Phase 4** | Timbre and multilingual polish — spoken summaries, language selection, tested regional-language scenarios, error handling, accessibility |
| **Phase 5** | Hardening and submission — end-to-end tests, privacy checks, deployment, demo recording, challenge submission materials |

> **Priority rule:** If time becomes constrained, ship a complete and trustworthy voice-to-order flow for a **smaller verified set of languages** rather than a broad language selector that does not work end to end.

---

## Release Checklist

- [ ] A valid CSV imports; invalid rows are reported and existing products are not deleted
- [ ] A customer places an order by voice in each language claimed as supported
- [ ] A shopkeeper records an order using the same engine
- [ ] An ambiguous pack size triggers a question before confirmation
- [ ] An unknown product is never invented or silently replaced
- [ ] An out-of-stock item cannot be ordered
- [ ] Changing a quantity updates the server-calculated total
- [ ] Nothing is saved before explicit confirmation
- [ ] Double-clicking Confirm creates only one order
- [ ] Status changes follow the allowed order only
- [ ] The tracking page shows no phone number or full address
- [ ] If Prisma or Timbre fails, typed ordering still works
- [ ] The deployed app works on a phone and a laptop

---

## What to Cut First (If Time Is Short)

| Cut Order | Feature | Fallback |
|-----------|---------|----------|
| Cut first | Timbre TTS | Written summary is always shown |
| Cut second | Saved customer addresses | Customer re-enters each time |
| Cut third | Daily sales summary | Shopkeeper filters orders manually |
| Cut fourth | PWA / installable app | Works fine as a regular web app |
| **Never cut** | CSV import | — |
| **Never cut** | Voice input + transcript editing | — |
| **Never cut** | Catalogue matching + clarification | — |
| **Never cut** | Server-side totals + confirmation | — |

---

*[← Advantages & Limitations](./21-advantages-and-limitations.md) | [Demo & Submission →](./23-demo-and-submission.md)*
