import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { createBoundaryExtensions } from "./extensions/boundaryExtensions.js";
import { createPoiExtensions } from "./extensions/poiExtensions.js";
import { createSearchExtensions } from "./extensions/searchExtensions.js";
import { createVisitedPoiExtensions } from "./extensions/visitedPoiExtensions.js";
import { PrismaClient } from "./generated/client/index.js";

// Re-export types for external use
export type { CustomPoiCreateInput } from "./types.js";

const getBasePrismaClient = (withQueryLog = false): PrismaClient => {
  const databaseUrl = process.env.API_DATABASE_URL;
  if (databaseUrl === undefined) {
    throw new Error("API_DATABASE_URL environment variable is required");
  }

  const pool = new pg.Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);

  const prismaClient = new PrismaClient({
    adapter,
    log: withQueryLog
      ? ["info", "warn", "error", "query"]
      : ["info", "warn", "error"],
  });

  return prismaClient;
};
export type BasePrismaClient = ReturnType<typeof getBasePrismaClient>;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- too complex to type
export const getPrismaExtendedClient = (withQueryLog = false) => {
  const baseClient = getBasePrismaClient(withQueryLog);

  const prismaExtendedClient = baseClient.$extends({
    model: {
      poi: createPoiExtensions(baseClient),
      visitedPoi: createVisitedPoiExtensions(baseClient),
      boundary: createBoundaryExtensions(baseClient),
    },
  });

  // Add search extension as a custom method
  return Object.assign(prismaExtendedClient, {
    search: createSearchExtensions(baseClient),
  });
};
export type PrismaExtendedClient = ReturnType<typeof getPrismaExtendedClient>;
