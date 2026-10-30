// Run: npm run admin:create. Creates the first Logcase staff account from ADMIN_EMAIL / ADMIN_PASSWORD
// (.env.local locally, Railway variables in production). Does nothing if that email already exists.
import { eq } from "drizzle-orm";
import { auth } from "../modules/auth/auth.ts";
import { user } from "../modules/auth/schema.ts";
import { db } from "./index.ts";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (!email || !password) {
  console.log("ADMIN_EMAIL / ADMIN_PASSWORD not set; skipping.");
} else if ((await db.select().from(user).where(eq(user.email, email))).length) {
  console.log(`${email} already exists; nothing to do.`);
} else {
  await auth.api.createUser({ body: { email, password, name: "Logcase", role: "admin" } });
  console.log(`Created staff account ${email}. You can now remove ADMIN_PASSWORD from the environment.`);
}
await db.$client.end();
