"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { addItem, type CartItem } from "@/lib/cart";
import type { Product, Shop, Slide } from "@/lib/shops";

type ShopState = {
  shop: Shop;
  products: Product[];
  slides: Slide[];
  cart: CartItem[];
  setCart: (c: CartItem[]) => void;
  add: (p: Product, size?: string) => void;
};

const ShopContext = createContext<ShopState | null>(null);

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside <ShopProvider>");
  return ctx;
}

// Drop-up sheets are native popovers rendered by the shell; these ids are their handles.
export const SHEETS = { cart: "sheet-cart", categories: "sheet-categories", search: "sheet-search" } as const;
export const openSheet = (id: string) => document.getElementById(id)?.showPopover();
export const closeSheets = () => document.querySelectorAll<HTMLElement>(".sheet:popover-open").forEach((el) => el.hidePopover());

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function persist(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota or private mode: the cart keeps working in memory.
  }
}

// Products and slides come from the server (Postgres); only the cart lives in this browser.
export function ShopProvider({ shop, children }: { shop: Shop; children: React.ReactNode }) {
  const key = `logcase:${shop.slug}:cart`;
  const [cart, setCartState] = useState<CartItem[]>([]);

  useEffect(() => {
    // Read after mount so server and client render the same first frame.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCartState(load(key, []));
  }, [key]);

  const setCart = (c: CartItem[]) => {
    setCartState(c);
    persist(key, c);
  };
  const add = (p: Product, size?: string) =>
    setCart(addItem(cart, { ref: p.ref, name: p.name, price: p.price, size, qty: 1 }));

  return (
    <ShopContext.Provider value={{ shop, products: shop.products, slides: shop.slides, cart, setCart, add }}>
      {children}
    </ShopContext.Provider>
  );
}
