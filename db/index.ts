import { drizzle } from "drizzle-orm/node-postgres";

// Server only. Columns are camelCase in TS, snake_case in Postgres.
export const db = drizzle(process.env.DATABASE_URL!, { casing: "snake_case" });
