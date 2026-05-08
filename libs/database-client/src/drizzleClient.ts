import { logger } from "@vagabond/shared-utils";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { dirname, join } from "path";
import pg, { type Pool } from "pg";
import { fileURLToPath } from "url";

import { getPgSslOptions } from "./pg-ssl.js";
import * as schema from "./schema.js";

const PING_TIMEOUT_MS = 500;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDev = process.env.NODE_ENV === "development";

export const getDrizzleClient = async (): Promise<
  NodePgDatabase<typeof schema> & {
    $client: Pool;
  } & {
    close: () => Promise<void>;
    ping: () => Promise<void>;
  }
> => {
  const databaseUrl = process.env.API_DATABASE_URL;
  if (databaseUrl === undefined) {
    throw new Error("API_DATABASE_URL environment variable is required");
  }

  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: getPgSslOptions(isDev),
    max: 20,
    connectionTimeoutMillis: 20000,
    idleTimeoutMillis: 30000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  });

  pool.on("error", (err) => {
    logger.error({ err }, "PG pool connection error");
  });

  const db = drizzle(pool, { schema, casing: "snake_case" });
  await migrate(db, {
    migrationsFolder: join(__dirname, "migrations"),
    migrationsSchema: "public",
  });

  return Object.assign(db, {
    close: async () => {
      await pool.end();
    },
    ping: async () => {
      let timeoutId: NodeJS.Timeout | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error("DB ping timeout"));
        }, PING_TIMEOUT_MS);
      });
      try {
        await Promise.race([pool.query("SELECT 1"), timeoutPromise]);
      } finally {
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
        }
      }
    },
  });
};

export type DrizzleClient = Awaited<ReturnType<typeof getDrizzleClient>>;
