"use server";

import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { db } from "@/db";
import type { Product, Slide } from "@/lib/shops";
import { requireShopAccess } from "../auth/access";
import { createUpload, deleteImage } from "../media/cloudflare";
import { shops } from "../tenancy/schema";
import { categories, products, slides } from "./schema";

type Result = { error?: string };
const IMAGE_ID = /^[\w-]{8,100}$/;

// One-time Cloudflare URL; the browser uploads the photo straight to it.
export async function createPhotoUpload(slug: string, kind: "product" | "slide" | "logo") {
  await requireShopAccess(slug);
  return createUpload({ shop: slug, kind });
}

async function categoryIds(shopId: string) {
  const rows = await db.select().from(categories).where(eq(categories.shopId, shopId));
  return new Map(rows.map((c) => [c.name, c.id]));
}

// Delete from Cloudflare only when no product, slide or logo still points at the image.
async function dropUnused(ids: (string | null | undefined)[]) {
  for (const id of new Set(ids)) {
    if (!id || id.startsWith("/")) continue;
    const used = await db.$count(products, eq(products.imageId, id)) + (await db.$count(slides, eq(slides.imageId, id))) + (await db.$count(shops, eq(shops.logoImageId, id)));
    if (!used) await deleteImage(id).catch((e) => console.error(e)); // an orphan costs storage, not correctness
  }
}

export async function saveProduct(slug: string, p: Product, prevRef?: string): Promise<Result> {
  const { shop } = await requireShopAccess(slug);
  const ref = p.ref.trim().toUpperCase();
  const name = p.name.trim();
  if (!ref || !name) return { error: "Nombre y referencia son obligatorios." };
  if (!Number.isInteger(p.price) || p.price < 0 || !Number.isInteger(p.stock) || p.stock < 0) return { error: "Precio y stock deben ser números enteros." };
  if (!IMAGE_ID.test(p.image)) return { error: "Agrega una foto." };
  const categoryId = (await categoryIds(shop.id)).get(p.category);
  if (!categoryId) return { error: "Elige una categoría válida." };

  const values = { ref, name, categoryId, price: p.price, stock: p.stock, sizes: p.sizes?.length ? p.sizes : null, imageId: p.image, description: p.description?.trim() || null, updatedAt: new Date() };
  const [clash] = await db.select({ ref: products.ref }).from(products).where(and(eq(products.shopId, shop.id), eq(products.ref, ref)));
  if (clash && ref !== prevRef) return { error: `La referencia ${ref} ya existe.` };

  if (prevRef) {
    const [old] = await db.select().from(products).where(and(eq(products.shopId, shop.id), eq(products.ref, prevRef)));
    if (!old) return { error: "El producto ya no existe." };
    await db.update(products).set(values).where(eq(products.id, old.id));
    if (old.imageId !== p.image) await dropUnused([old.imageId]);
  } else {
    await db.insert(products).values({ ...values, shopId: shop.id });
  }
  updateTag(`shop:${slug}`);
  return {};
}

export async function deleteProduct(slug: string, ref: string): Promise<Result> {
  const { shop } = await requireShopAccess(slug);
  const [old] = await db.delete(products).where(and(eq(products.shopId, shop.id), eq(products.ref, ref))).returning();
  if (old) await dropUnused([old.imageId]);
  updateTag(`shop:${slug}`);
  return {};
}

// The carousel is small and edited as a whole list (order matters), so it is replaced in one transaction.
export async function saveSlides(slug: string, list: Slide[]): Promise<Result> {
  const { shop } = await requireShopAccess(slug);
  if (list.some((s) => !s.title.trim() || !IMAGE_ID.test(s.image))) return { error: "Cada diapositiva necesita título y foto." };
  const cats = await categoryIds(shop.id);
  const before = await db.select({ imageId: slides.imageId }).from(slides).where(eq(slides.shopId, shop.id));
  await db.transaction(async (tx) => {
    await tx.delete(slides).where(eq(slides.shopId, shop.id));
    if (list.length)
      await tx.insert(slides).values(
        list.map((s, position) => ({
          shopId: shop.id,
          title: s.title.trim(),
          text: s.text?.trim() || null,
          imageId: s.image,
          categoryId: (s.category && cats.get(s.category)) || null,
          position,
        })),
      );
  });
  const kept = new Set(list.map((s) => s.image));
  await dropUnused(before.map((b) => b.imageId).filter((id) => !kept.has(id)));
  updateTag(`shop:${slug}`);
  return {};
}

