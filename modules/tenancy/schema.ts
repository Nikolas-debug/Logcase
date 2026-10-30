import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { Theme } from "../../lib/shops.ts";

export const shops = pgTable("shops", {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  tagline: text().notNull().default(""),
  city: text().notNull().default(""),
  whatsapp: text().notNull(), // international format, digits only
  instagram: text(),
  logoImageId: text(),
  theme: jsonb().$type<Theme>().notNull(),
  plan: text().notNull().default("beta"),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
