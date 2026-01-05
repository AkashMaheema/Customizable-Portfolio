import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Prisma ORM v7: connection URL is configured here (not in schema.prisma).
  // Use MIGRATE_DATABASE_URL when you want migrations to use Neon "Direct".
  // Runtime Prisma Client uses DATABASE_URL.
  datasource: {
    url: process.env.MIGRATE_DATABASE_URL ?? process.env.DATABASE_URL ?? "",
  },
});
