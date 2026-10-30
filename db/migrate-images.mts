// Run: npm run db:migrate-images. Uploads every image still stored as a /public path to Cloudflare
// and replaces it with the Cloudflare ID. Safe to re-run: migrated rows no longer start with "/".
import { readFile, writeFile } from "node:fs/promises";
import { and, eq, like } from "drizzle-orm";
import { products, slides } from "../modules/catalog/schema.ts";
import { uploadFile } from "../modules/media/cloudflare.ts";
import { shops } from "../modules/tenancy/schema.ts";
import { db } from "./index.ts";
import known from "./cloudflare-ids.json" with { type: "json" };

const uploaded = new Map<string, string>(); // same file used twice (slide + product) uploads once

async function toCloudflare(path: string, shop: string, kind: "product" | "slide" | "logo") {
  let id = uploaded.get(path);
  if (!id) {
    const file = new Blob([await readFile(`public${path}`)], { type: "image/webp" });
    id = (await uploadFile(file, path.split("/").pop()!, { shop, kind })).id;
    uploaded.set(path, id);
    console.log(`${path} → ${id}`);
  }
  return id;
}

for (const shop of await db.select().from(shops)) {
  if (shop.logoImageId?.startsWith("/")) {
    await db.update(shops).set({ logoImageId: await toCloudflare(shop.logoImageId, shop.slug, "logo") }).where(eq(shops.id, shop.id));
  }
  for (const p of await db.select().from(products).where(and(eq(products.shopId, shop.id), like(products.imageId, "/%")))) {
    await db.update(products).set({ imageId: await toCloudflare(p.imageId, shop.slug, "product") }).where(eq(products.id, p.id));
  }
  for (const s of await db.select().from(slides).where(and(eq(slides.shopId, shop.id), like(slides.imageId, "/%")))) {
    await db.update(slides).set({ imageId: await toCloudflare(s.imageId, shop.slug, "slide") }).where(eq(slides.id, s.id));
  }
}
// Remember path → ID so db:seed keeps pointing at Cloudflare.
await writeFile(new URL("./cloudflare-ids.json", import.meta.url), JSON.stringify({ ...known, ...Object.fromEntries(uploaded) }, null, 2) + "\n");
console.log(`done: ${uploaded.size} files uploaded`);
await db.$client.end();
