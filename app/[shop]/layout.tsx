import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Shell } from "@/components/shell";
import { ShopProvider } from "@/components/shop-provider";
import { getShop } from "@/modules/catalog/queries";
import { listShopSlugs } from "@/modules/tenancy/queries";

export async function generateStaticParams() {
  return (await listShopSlugs()).map((shop) => ({ shop }));
}

export async function generateMetadata(props: LayoutProps<"/[shop]">): Promise<Metadata> {
  const shop = await getShop((await props.params).shop);
  return shop ? { title: { default: shop.name, template: `%s · ${shop.name}` }, description: shop.tagline } : {};
}

export async function generateViewport(props: LayoutProps<"/[shop]">): Promise<Viewport> {
  const shop = await getShop((await props.params).shop);
  return { themeColor: shop?.theme.bg ?? "#fbfbf5" };
}

export default async function ShopLayout(props: LayoutProps<"/[shop]">) {
  const shop = await getShop((await props.params).shop);
  if (!shop) notFound();
  // Tenant theme → CSS vars consumed by the Tailwind tokens in globals.css.
  const vars = Object.fromEntries(Object.entries(shop.theme).map(([k, v]) => [`--${k}`, v])) as React.CSSProperties;
  return (
    <div style={vars}>
      <ShopProvider shop={shop}>
        <Shell>{props.children}</Shell>
      </ShopProvider>
    </div>
  );
}
