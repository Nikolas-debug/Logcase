import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Panel, type PanelShop } from "@/components/panel";
import { getSession, isStaff } from "@/modules/auth/access";
import { firstShopOf, membersByShop } from "@/modules/auth/queries";
import { catalogStats, categoryNames } from "@/modules/catalog/queries";
import { listShops, shopSlugById } from "@/modules/tenancy/queries";

export const metadata: Metadata = { title: "Panel · Logcase" };

// Logcase staff: every shop. Shop owners who land here (default after login) go to their own admin.
export default function PanelPage() {
  return (
    <Suspense fallback={<main className="min-h-svh bg-bg" />}>
      <PanelData />
    </Suspense>
  );
}

async function PanelData() {
  const session = await getSession();
  if (!session) redirect("/login?next=/panel");
  if (!isStaff(session)) {
    const shopId = await firstShopOf(session.user.id);
    const slug = shopId && (await shopSlugById(shopId));
    if (!slug) notFound();
    redirect(`/${slug}/admin`);
  }

  const [rows, stats, members] = await Promise.all([listShops(), catalogStats(), membersByShop()]);
  const shops: PanelShop[] = await Promise.all(
    rows.map(async (s) => ({
      slug: s.slug,
      name: s.name,
      tagline: s.tagline,
      city: s.city,
      whatsapp: s.whatsapp,
      instagram: s.instagram ?? "",
      logo: s.logoImageId ?? "",
      accent: s.theme.accent,
      plan: s.plan,
      createdAt: s.createdAt.toISOString(),
      categories: await categoryNames(s.id),
      owners: members(s.id),
      ...stats(s.id),
    })),
  );
  return <Panel shops={shops} email={session.user.email} />;
}
