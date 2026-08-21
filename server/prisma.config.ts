import "dotenv/config";
import { defineConfig } from "prisma/config";

// `generate` and `validate` do not connect to PostgreSQL. The invalid fallback lets those
// commands run during a clean install; all DB commands and the server still require .env.
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://placeholder:placeholder@database.invalid:5432/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js",
  },
  datasource: {
    url: databaseUrl,
  },
});
