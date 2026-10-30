import { eq } from "drizzle-orm";
import { db } from "@/db";
import { memberships, user } from "./schema";

// shopId → member emails, for the staff panel.
export async function membersByShop() {
  const rows = await db.select({ shopId: memberships.shopId, email: user.email }).from(memberships).innerJoin(user, eq(user.id, memberships.userId));
  return (shopId: string) => rows.filter((r) => r.shopId === shopId).map((r) => r.email);
}

export async function firstShopOf(userId: string) {
  const [m] = await db.select({ shopId: memberships.shopId }).from(memberships).where(eq(memberships.userId, userId)).limit(1);
  return m?.shopId;
}
