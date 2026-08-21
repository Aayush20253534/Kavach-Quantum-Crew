import "dotenv/config";
import { defineConfig } from "prisma/config";

// `generate` and `validate` do not connect to PostgreSQL.
// DB commands require DIRECT_URL from .env.
const directDatabaseUrl =
  process.env.DIRECT_URL ??
  "postgresql://placeholder:placeholder@database.invalid:5432/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js",
  },

  datasource: {
    url: directDatabaseUrl,
  },
});