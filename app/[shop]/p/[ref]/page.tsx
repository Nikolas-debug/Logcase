import { Suspense } from "react";
import { ProductView } from "@/components/product-view";
import { getShop } from "@/modules/catalog/queries";
import { listShopSlugs } from "@/modules/tenancy/queries";

export async function generateStaticParams() {
  const shops = await Promise.all((await listShopSlugs()).map(getShop));
  return shops.flatMap((s) => s?.products.map((p) => ({ shop: s.slug, ref: p.ref })) ?? []);
}

// Client view reads the product from the shop context (loaded from the database in the layout).
// Suspense: unlisted refs (admin-created) render from a fallback shell under partialPrefetching.
export default function ProductPage() {
  return (
    <Suspense>
      <ProductView />
    </Suspense>
  );
}
