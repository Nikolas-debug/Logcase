import { boolean, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { shops } from "../tenancy/schema.ts";

// Better Auth tables (core + admin plugin). Field names must match what Better Auth expects.
const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp({ withTimezone: true }).notNull().defaultNow();

export const user = pgTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  role: text(), // "admin" = Logcase staff (platform panel); "user" = shop owner/staff
  banned: boolean().default(false),
  banReason: text(),
  banExpires: timestamp({ withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const session = pgTable("session", {
  id: text().primaryKey(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  token: text().notNull().unique(),
  ipAddress: text(),
  userAgent: text(),
  userId: text().notNull().references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const account = pgTable("account", {
  id: text().primaryKey(),
  accountId: text().notNull(),
  providerId: text().notNull(),
  userId: text().notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: timestamp({ withTimezone: true }),
  refreshTokenExpiresAt: timestamp({ withTimezone: true }),
  scope: text(),
  password: text(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const verification = pgTable("verification", {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// Who can manage which shop.
export const memberships = pgTable(
  "memberships",
  {
    shopId: uuid().notNull().references(() => shops.id, { onDelete: "cascade" }),
    userId: text().notNull().references(() => user.id, { onDelete: "cascade" }),
    role: text().notNull().default("owner"),
  },
  (t) => [primaryKey({ columns: [t.shopId, t.userId] })],
);
