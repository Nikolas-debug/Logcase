// Run: npm run admin:create. Creates the first Logcase staff account from ADMIN_EMAIL / ADMIN_PASSWORD
// (.env.local locally, Railway variables in production). If that email already exists, resets its password.
import { and, eq } from "drizzle-orm";
import { auth } from "../modules/auth/auth.ts";
import { account, user } from "../modules/auth/schema.ts";
import { db } from "./index.ts";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const [existing] = email ? await db.select().from(user).where(eq(user.email, email)) : [];
if (!email || !password) {
  console.log("ADMIN_EMAIL / ADMIN_PASSWORD not set; skipping.");
} else if (existing) {
  const hash = await (await auth.$context).password.hash(password);
  await db.update(account).set({ password: hash })
    .where(and(eq(account.userId, existing.id), eq(account.providerId, "credential")));
  console.log(`Password reset for ${email}. You can now remove ADMIN_PASSWORD from the environment.`);
} else {
  await auth.api.createUser({ body: { email, password, name: "Logcase", role: "admin" } });
  console.log(`Created staff account ${email}. You can now remove ADMIN_PASSWORD from the environment.`);
}
await db.$client.end();
