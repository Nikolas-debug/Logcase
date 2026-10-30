import { cacheTag } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { shops } from "./schema";

export async function getShopRow(slug: string) {
  "use cache";
  cacheTag(`shop:${slug}`);
  const [shop] = await db.select().from(shops).where(eq(shops.slug, slug));
  return shop;
}

export async function listShopSlugs() {
  "use cache";
  cacheTag("shops");
  return (await db.select({ slug: shops.slug }).from(shops).orderBy(asc(shops.createdAt))).map((s) => s.slug);
}

// Staff panel: every shop, newest last (live, not cached).
export const listShops = () => db.select().from(shops).orderBy(asc(shops.createdAt));

export async function shopSlugById(id: string) {
  const [s] = await db.select({ slug: shops.slug }).from(shops).where(eq(shops.id, id));
  return s?.slug;
}
