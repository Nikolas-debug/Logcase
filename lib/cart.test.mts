// Run: npm test
import assert from "node:assert/strict";
import { addItem, setQty, total, whatsappUrl } from "./cart.ts";

const pijama = { ref: "PSN0098", name: "Pijama Sonic", price: 45000, size: "10", qty: 1 };

let cart = addItem([], pijama);
cart = addItem(cart, pijama);
assert.equal(cart.length, 1, "same ref+size merges");
assert.equal(cart[0].qty, 2);

cart = addItem(cart, { ...pijama, size: "12" });
assert.equal(cart.length, 2, "different size is its own line");
assert.equal(total(cart), 135000);

cart = setQty(cart, "PSN0098", "12", 0);
assert.equal(cart.length, 1, "qty 0 removes the line");

const url = whatsappUrl("573006222300", "Dulce Amor", cart);
assert.ok(url.startsWith("https://wa.me/573006222300?text="));
const text = decodeURIComponent(url.split("text=")[1]);
assert.ok(text.includes("2 x Pijama Sonic (Ref. PSN0098, talla 10)"));
assert.ok(text.includes("90.000"));

console.log("cart ok");
