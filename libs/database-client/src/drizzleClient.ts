import { logger } from "@vagabond/shared-utils";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { dirname, join } from "path";
import pg, { type Pool } from "pg";
import { fileURLToPath } from "url";

import * as schema from "./schema.js";
import { SUPABASE_SSL_CERT } from "./supabase-cert.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDev = process.env.NODE_ENV === "development";

export const getDrizzleClient = async (): Promise<
  NodePgDatabase<typeof schema> & {
    $client: Pool;
  } & {
    close: () => Promise<void>;
  }
> => {
  const databaseUrl = process.env.API_DATABASE_URL;
  if (databaseUrl === undefined) {
    throw new Error("API_DATABASE_URL environment variable is required");
  }

  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: isDev
      ? false
      : {
          rejectUnauthorized: true,
          ca: SUPABASE_SSL_CERT,
        },
    connectionTimeoutMillis: 10000,
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
  });
};

export type DrizzleClient = Awaited<ReturnType<typeof getDrizzleClient>>;
