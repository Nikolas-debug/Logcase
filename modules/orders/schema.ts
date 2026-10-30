import { integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { products } from "../catalog/schema.ts";
import { shops } from "../tenancy/schema.ts";

export const orders = pgTable(
  "orders",
  {
    id: uuid().primaryKey().defaultRandom(),
    shopId: uuid().notNull().references(() => shops.id, { onDelete: "cascade" }),
    code: text().notNull(),
    customerName: text(),
    customerPhone: text(),
    total: integer().notNull(), // COP
    status: text().notNull().default("sent"),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.shopId, t.code)],
);

// name and unitPrice are copied at order time so old orders survive product edits.
export const orderItems = pgTable("order_items", {
  id: uuid().primaryKey().defaultRandom(),
  orderId: uuid().notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid().references(() => products.id, { onDelete: "set null" }),
  name: text().notNull(),
  size: text(),
  qty: integer().notNull(),
  unitPrice: integer().notNull(),
});
