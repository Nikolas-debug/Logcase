import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { db } from "../../db/index.ts";
import * as schema from "./schema.ts";

// Reads BETTER_AUTH_SECRET and BETTER_AUTH_URL from the environment.
// No public sign-up: Logcase staff create shop accounts from /panel (or db/create-admin.mts for the first admin).
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 8 },
  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(","), // e.g. the LAN address for phone testing
  plugins: [admin(), nextCookies()],
});
