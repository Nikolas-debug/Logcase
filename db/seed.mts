// Run: npm run db:seed. Loads the seed shops from lib/shops.ts; re-running replaces them (and their orders).
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { shops as seed } from "../lib/shops.ts";
import { categories, products, slides } from "../modules/catalog/schema.ts";
import { shops } from "../modules/tenancy/schema.ts";
import { db } from "./index.ts";
import cloudflare from "./cloudflare-ids.json" with { type: "json" };

// Local path → Cloudflare image ID for photos already uploaded (written by db:migrate-images).
const ids: Record<string, string> = cloudflare;
const image = (path: string) => ids[path] ?? path;

for (const s of Object.values(seed)) {
  const shopId = await db.transaction(async (tx) => {
    await tx.delete(shops).where(eq(shops.slug, s.slug)); // cascades to catalog and orders
    const [shop] = await tx
      .insert(shops)
      .values({ slug: s.slug, name: s.name, tagline: s.tagline, city: s.city, whatsapp: s.whatsapp, instagram: s.instagram, logoImageId: image(s.logo), theme: s.theme })
      .returning();
    const cats = await tx
      .insert(categories)
      .values(s.categories.map((name, position) => ({ shopId: shop.id, name, position })))
      .returning();
    const catId = (name: string) => {
      const c = cats.find((x) => x.name === name);
      assert(c, `unknown category ${name}`);
      return c.id;
    };
    await tx.insert(products).values(
      s.products.map((p) => ({
        shopId: shop.id,
        categoryId: catId(p.category),
        ref: p.ref,
        name: p.name,
        description: p.description,
        price: p.price,
        stock: p.stock,
        sizes: p.sizes,
        imageId: image(p.image),
      })),
    );
    await tx.insert(slides).values(
      s.slides.map((sl, position) => ({
        shopId: shop.id,
        categoryId: sl.category ? catId(sl.category) : null,
        title: sl.title,
        text: sl.text,
        imageId: image(sl.image),
        position,
      })),
    );
    return shop.id;
  });
  const count = await db.$count(products, eq(products.shopId, shopId));
  assert.equal(count, s.products.length);
  console.log(`${s.slug}: ${count} products, ${s.slides.length} slides`);
}
await db.$client.end();
