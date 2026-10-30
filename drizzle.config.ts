import { defineConfig } from "drizzle-kit";

try {
  process.loadEnvFile(".env.local");
} catch {} // Railway injects DATABASE_URL instead

export default defineConfig({
  dialect: "postgresql",
  schema: "./modules/*/schema.ts",
  out: "./db/migrations",
  casing: "snake_case",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
