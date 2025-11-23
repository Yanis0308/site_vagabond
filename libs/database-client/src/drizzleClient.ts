import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { dirname, join } from "path";
import pg, { type Pool } from "pg";
import { fileURLToPath } from "url";

import * as schema from "./schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
