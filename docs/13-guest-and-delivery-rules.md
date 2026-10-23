# 🏠 Guest Checkout, Missing Details & Delivery Rules

> **The rule:** The app asks for what is missing and never invents it. The order cannot be confirmed until the required details are present.

---

## Handling Missing Customer Details

| Situation | What the App Does |
|-----------|------------------|
| **Customer is not logged in** | Guest checkout. Only name and phone are needed; there is no password. A private tracking link is sent so they can follow the order |
| **Name or phone missing** | Confirm is disabled and the missing field is highlighted |
| **No address given** | Asks "Delivery or pickup?". Delivery needs an address; pickup needs only name and phone |
| **Address incomplete** | Required: address line, locality, city, pincode. Landmark is optional but encouraged |
| **Address outside the delivery area** | The shop sets its serviceable pincodes or areas. Outside them the app offers pickup. The shopkeeper can override with a written note |
| **Returning customer (same phone)** | Offers the last used address to reuse or edit |
| **Phone number never verified** | Shown as "unverified". The shopkeeper can call to check a first-time delivery order. OTP verification can be added later |
| **Walk-in customer with no details** | Shopkeeper saves it as a pickup order with an optional name |
| **Delivery fee** | A flat fee or free above an amount, set by the shop and shown before confirmation |

---

## Delivery Area

**Where will it deliver?** Only where the shopkeeper says: a list of pincodes or area names in Settings. There are no live maps or route planning in this version.

---

*[← User Flows](./12-user-flows.md) | [Item Handling Rules →](./14-item-handling-rules.md)*
