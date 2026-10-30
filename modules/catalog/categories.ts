import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "./schema";

// Make the shop's categories exactly `names`, in that order. Callers check access first.
// A category that still has products is kept and reported, so no product loses its category.
export async function syncCategories(shopId: string, names: string[]): Promise<{ error?: string }> {
  const existing = await db.select().from(categories).where(eq(categories.shopId, shopId));
  const removed = existing.filter((c) => !names.includes(c.name));
  if (removed.length) {
    const [used] = await db.select({ categoryId: products.categoryId }).from(products).where(inArray(products.categoryId, removed.map((c) => c.id))).limit(1);
    if (used) return { error: `La categoría ${removed.find((c) => c.id === used.categoryId)!.name} todavía tiene productos.` };
  }
  await db.transaction(async (tx) => {
    if (removed.length) await tx.delete(categories).where(inArray(categories.id, removed.map((c) => c.id)));
    for (const [position, name] of names.entries()) {
      const found = existing.find((c) => c.name === name);
      if (found) await tx.update(categories).set({ position }).where(and(eq(categories.id, found.id), eq(categories.shopId, shopId)));
      else await tx.insert(categories).values({ shopId, name, position });
    }
  });
  return {};
}
