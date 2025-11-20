import "dotenv/config";

import type { PrismaConfig } from "prisma";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "src/db/api-schema.prisma",
  migrations: {
    path: "src/db/migrations",
  },
  datasource: {
    // URL is optional at build time - we use adapter at runtime
    // Only needed for Prisma CLI migrations
    url: process.env.API_DATABASE_URL ? env("API_DATABASE_URL") : undefined,
  },
}) satisfies PrismaConfig;
