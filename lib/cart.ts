export type CartItem = { ref: string; name: string; price: number; size?: string; qty: number };

const same = (i: CartItem, ref: string, size?: string) => i.ref === ref && i.size === size;

export function addItem(cart: CartItem[], item: CartItem): CartItem[] {
  if (!cart.some((i) => same(i, item.ref, item.size))) return [...cart, item];
  return cart.map((i) => (same(i, item.ref, item.size) ? { ...i, qty: i.qty + item.qty } : i));
}

export function setQty(cart: CartItem[], ref: string, size: string | undefined, qty: number): CartItem[] {
  if (qty <= 0) return cart.filter((i) => !same(i, ref, size));
  return cart.map((i) => (same(i, ref, size) ? { ...i, qty } : i));
}

export const total = (cart: CartItem[]) => cart.reduce((sum, i) => sum + i.price * i.qty, 0);

const cop = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
export const formatCOP = (n: number) => cop.format(n);

export function whatsappUrl(phone: string, shopName: string, cart: CartItem[]) {
  const lines = cart.map(
    (i) => `• ${i.qty} x ${i.name} (Ref. ${i.ref}${i.size ? `, talla ${i.size}` : ""}) — ${formatCOP(i.price * i.qty)}`,
  );
  const text = [`¡Hola ${shopName}! Quiero hacer este pedido:`, "", ...lines, "", `Total: ${formatCOP(total(cart))}`].join("\n");
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
