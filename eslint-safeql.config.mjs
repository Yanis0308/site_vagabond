/**
 * Shared SafeQL ESLint config.
 * Reused by apps/data-manager and libs/database-client.
 *
 * Usage (each project loads its .env with dotenv, then passes databaseUrl):
 *   import { config } from "dotenv";
 *   config({ path: import.meta.dirname + "/.env" });
 *   const safeqlConfig = await getSafeqlConfig(process.env.SAFEQL_DATABASE_URL);
 */

const TARGETS = [
  {
    // TODO: update for DrizzleORM
    tag: "+(knex|knexInstance).+(raw|transaction)",
    transform: "Array<{type}>",
  },
];

/**
 * @param {string | undefined} databaseUrl - SAFEQL_DATABASE_URL from process.env after dotenv is loaded by the caller.
 * @returns {Promise<import("eslint").Linter.FlatConfig[]>}
 */
export async function getSafeqlConfig(databaseUrl) {
  if (!databaseUrl) {
    console.log("[SafeQL] disabled (SAFEQL_DATABASE_URL not set)");
    return [];
  }

  console.log("[SafeQL] enabled");
  const plugin = (await import("@ts-safeql/eslint-plugin")).default;

  return [
    {
      plugins: {
        "@ts-safeql/eslint-plugin": plugin,
      },
      rules: {
        "@ts-safeql/check-sql": [
          "error",
          {
            connections: {
              databaseUrl,
              targets: TARGETS,
            },
          },
        ],
      },
    },
  ];
}
