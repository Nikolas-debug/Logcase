import { boolean, integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { shops } from "../tenancy/schema.ts";

const shopId = () => uuid().notNull().references(() => shops.id, { onDelete: "cascade" });

export const categories = pgTable(
  "categories",
  {
    id: uuid().primaryKey().defaultRandom(),
    shopId: shopId(),
    name: text().notNull(),
    position: integer().notNull().default(0),
  },
  (t) => [unique().on(t.shopId, t.name)],
);

// imageId: Cloudflare Images ID. Until the migration (CLAUDE.md roadmap step 9) it holds a /public path.
export const products = pgTable(
  "products",
  {
    id: uuid().primaryKey().defaultRandom(),
    shopId: shopId(),
    categoryId: uuid().notNull().references(() => categories.id),
    ref: text().notNull(),
    name: text().notNull(),
    description: text(),
    price: integer().notNull(), // COP
    stock: integer().notNull().default(0),
    sizes: text().array(),
    imageId: text().notNull(),
    active: boolean().notNull().default(true),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.shopId, t.ref)],
);

export const slides = pgTable("slides", {
  id: uuid().primaryKey().defaultRandom(),
  shopId: shopId(),
  categoryId: uuid().references(() => categories.id, { onDelete: "set null" }),
  title: text().notNull(),
  text: text(),
  imageId: text().notNull(),
  position: integer().notNull().default(0),
});
