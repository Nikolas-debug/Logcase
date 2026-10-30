"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db";
import type { Theme } from "@/lib/shops";
import { requireShopAccess, requireStaff } from "../auth/access";
import { auth } from "../auth/auth";
import { memberships, user } from "../auth/schema";
import { syncCategories } from "../catalog/categories";
import { shops } from "./schema";

export type ShopInput = { name: string; tagline: string; city: string; whatsapp: string; instagram: string; accent: string; logo: string; categories: string[] };
export type NewShopInput = { name: string; whatsapp: string };
export type OwnerInput = { name: string; email: string; password: string };
type Result = { error?: string };

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RESERVED = new Set(["panel", "login", "api", "admin", "logcase", "loggo"]);
const WHATSAPP = /^\d{10,15}$/;
const WHATSAPP_ERROR = "WhatsApp con indicativo, solo números (ej. 573001234567).";

// Light storefront track (DESIGN.md) with the shop's accent; text on the accent flips for light accents.
function themeFor(accent: string): Theme {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(accent.slice(i, i + 2), 16) / 255);
  const light = 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.6;
  return { bg: "#fbfbf5", surface: "#ffffff", raised: "#f3efec", text: "#0a0a0a", muted: "#5e5860", accent, ink: light ? "#0a0a0a" : "#ffffff" };
}

function clean(input: ShopInput): ShopInput | string {
  const v = {
    ...input,
    name: input.name.trim(),
    tagline: input.tagline.trim(),
    city: input.city.trim(),
    whatsapp: input.whatsapp.replace(/\D/g, ""),
    instagram: input.instagram.trim().replace(/^@/, ""),
    categories: [...new Set(input.categories.map((c) => c.trim()).filter(Boolean))],
  };
  if (!v.name) return "El nombre es obligatorio.";
  if (!WHATSAPP.test(v.whatsapp)) return WHATSAPP_ERROR;
  if (!/^#[0-9a-f]{6}$/i.test(v.accent)) return "Color de acento inválido.";
  if (v.logo && !/^[\w-]{8,100}$/.test(v.logo)) return "Logo inválido, súbelo de nuevo.";
  if (!v.categories.length) return "Agrega al menos una categoría.";
  return v;
}

// Existing account (e.g. someone with two shops) is reused; otherwise it is created with the given password.
async function findOrCreateUser(owner: OwnerInput, shopName: string): Promise<{ id: string } | string> {
  const email = owner.email.trim().toLowerCase();
  if (!email) return "Escribe el correo.";
  const [found] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
  if (found) return found;
  if (owner.password.length < 8) return "La contraseña inicial debe tener al menos 8 caracteres.";
  try {
    const { user: created } = await auth.api.createUser({ body: { email, password: owner.password, name: owner.name.trim() || shopName, role: "user" }, headers: await headers() });
    return { id: created.id };
  } catch {
    return "No se pudo crear el usuario. Revisa el correo.";
  }
}

// Staff: the bare shop plus its owner. Logo, colors and categories are the owner's job (admin → Tienda).
export async function createShop(slug: string, input: NewShopInput, owner: OwnerInput): Promise<Result> {
  await requireStaff();
  const name = input.name.trim();
  const whatsapp = input.whatsapp.replace(/\D/g, "");
  if (!name) return { error: "El nombre es obligatorio." };
  if (!WHATSAPP.test(whatsapp)) return { error: WHATSAPP_ERROR };
  if (!SLUG.test(slug) || RESERVED.has(slug)) return { error: "Dirección inválida: minúsculas, números y guiones (ej. dulce-amor)." };
  if ((await db.select({ id: shops.id }).from(shops).where(eq(shops.slug, slug))).length) return { error: `Ya existe una tienda en /${slug}.` };

  const account = await findOrCreateUser(owner, name);
  if (typeof account === "string") return { error: account };

  const [shop] = await db.insert(shops).values({ slug, name, whatsapp, theme: themeFor("#c8336f") }).returning();
  await db.insert(memberships).values({ shopId: shop.id, userId: account.id });
  updateTag("shops");
  return {};
}

// Staff: give one more person access to this shop.
export async function grantAccess(slug: string, owner: OwnerInput): Promise<Result> {
  await requireStaff();
  const [shop] = await db.select().from(shops).where(eq(shops.slug, slug));
  if (!shop) return { error: "La tienda ya no existe." };
  const account = await findOrCreateUser(owner, shop.name);
  if (typeof account === "string") return { error: account };
  await db.insert(memberships).values({ shopId: shop.id, userId: account.id }).onConflictDoNothing();
  return {};
}

// Staff: a paused shop disappears from the storefront, the landing and its own admin.
export async function setShopActive(slug: string, active: boolean): Promise<Result> {
  await requireStaff();
  await db.update(shops).set({ active }).where(eq(shops.slug, slug));
  updateTag(`shop:${slug}`);
  updateTag("shops");
  return {};
}

// Owner: the shop's own details (admin → Tienda).
export async function updateShop(slug: string, input: ShopInput): Promise<Result> {
  const { shop } = await requireShopAccess(slug);
  const v = clean(input);
  if (typeof v === "string") return { error: v };
  const cats = await syncCategories(shop.id, v.categories);
  if (cats.error) return cats;
  await db
    .update(shops)
    .set({ name: v.name, tagline: v.tagline, city: v.city, whatsapp: v.whatsapp, instagram: v.instagram || null, logoImageId: v.logo || null, theme: { ...shop.theme, accent: v.accent, ink: themeFor(v.accent).ink } })
    .where(eq(shops.id, shop.id));
  // ponytail: a replaced logo stays on Cloudflare; reuse catalog's dropUnused if logos change often.
  updateTag(`shop:${slug}`);
  updateTag("shops");
  return {};
}
