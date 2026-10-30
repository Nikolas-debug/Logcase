import { cacheTag } from "next/cache";
import { asc, count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import type { Shop } from "@/lib/shops";
import { getShopRow } from "../tenancy/queries";
import { categories, products, slides } from "./schema";

// The storefront's whole view of a tenant, in the Shop shape the UI already uses.
// Images are Cloudflare IDs; the next/image loader turns them into URLs.
export async function getShop(slug: string): Promise<Shop | undefined> {
  "use cache";
  cacheTag(`shop:${slug}`);
  const row = await getShopRow(slug);
  if (!row?.active) return undefined;

  const [cats, prods, sls] = await Promise.all([
    db.select().from(categories).where(eq(categories.shopId, row.id)).orderBy(asc(categories.position)),
    db.select().from(products).where(eq(products.shopId, row.id)).orderBy(asc(products.ref)),
    db.select().from(slides).where(eq(slides.shopId, row.id)).orderBy(asc(slides.position)),
  ]);
  const catName = new Map(cats.map((c) => [c.id, c.name]));

  return {
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    city: row.city,
    whatsapp: row.whatsapp,
    instagram: row.instagram ?? "",
    logo: row.logoImageId ?? "",
    theme: row.theme,
    categories: cats.map((c) => c.name),
    slides: sls.map((s) => ({
      id: s.id,
      image: s.imageId,
      title: s.title,
      text: s.text ?? undefined,
      category: s.categoryId ? catName.get(s.categoryId) : undefined,
    })),
    // Grouped like the category chips, then by reference.
    products: prods
      .filter((p) => p.active)
      .sort((a, b) => cats.findIndex((c) => c.id === a.categoryId) - cats.findIndex((c) => c.id === b.categoryId))
      .map((p) => ({
        ref: p.ref,
        name: p.name,
        category: catName.get(p.categoryId)!,
        price: p.price,
        stock: p.stock,
        sizes: p.sizes ?? undefined,
        image: p.imageId,
        description: p.description ?? undefined,
      })),
  };
}

// Per-shop counts for the staff panel (live, not cached).
export async function catalogStats() {
  const [prods, sls] = await Promise.all([
    db.select({ shopId: products.shopId, total: count(), soldOut: count(sql`case when ${products.stock} <= 0 then 1 end`) }).from(products).groupBy(products.shopId),
    db.select({ shopId: slides.shopId, total: count() }).from(slides).groupBy(slides.shopId),
  ]);
  return (shopId: string) => ({
    products: prods.find((p) => p.shopId === shopId)?.total ?? 0,
    soldOut: prods.find((p) => p.shopId === shopId)?.soldOut ?? 0,
    slides: sls.find((s) => s.shopId === shopId)?.total ?? 0,
  });
}
