import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { db } from "@/db";
import { getShopRow } from "../tenancy/queries";
import { auth } from "./auth";
import { memberships } from "./schema";

// connection(): Better Auth reads the clock (`new Date()`), so keep the session check out of runtime prefetches.
export const getSession = async () => {
  await connection();
  return auth.api.getSession({ headers: await headers() });
};

export type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;
export const isStaff = (s: Session) => s.user.role === "admin";

async function requireUser(next: string) {
  const s = await getSession();
  if (!s) redirect(`/login?next=${encodeURIComponent(next)}`);
  return s;
}

// Logcase staff only: the platform panel and its actions.
export async function requireStaff() {
  const s = await requireUser("/panel");
  if (!isStaff(s)) notFound();
  return s;
}

// Members of this shop only: staff run shops from /panel but never edit a catalog. Every shop write goes through here.
export async function requireShopAccess(slug: string) {
  const s = await requireUser(`/${slug}/admin`);
  const shop = await getShopRow(slug);
  if (!shop?.active) notFound();
  const [m] = await db.select().from(memberships).where(and(eq(memberships.shopId, shop.id), eq(memberships.userId, s.user.id)));
  if (!m) redirect("/panel"); // staff land on the panel, owners of another shop on their own admin
  return { session: s, shop };
}
