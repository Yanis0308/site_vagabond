import "dotenv/config";

import type { PrismaConfig } from "prisma";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "src/db/api-schema.prisma",
  migrations: {
    path: "src/db/migrations",
  },
  datasource: {
    url: env("API_DATABASE_URL"),
  },
}) satisfies PrismaConfig;
