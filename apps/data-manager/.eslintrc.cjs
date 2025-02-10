// https://docs.expo.dev/guides/using-eslint/
require("dotenv").config();

const ENABLE_SAFEQL = process.env.ENABLE_SAFEQL === "true";

module.exports = {
  extends: ["../../.eslintrc"],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
    alwaysTryTypes: true,
  },

  plugins: ENABLE_SAFEQL ? ["@ts-safeql/eslint-plugin"] : [],

  ignorePatterns: ["node_modules/", "*.js", "*.mjs"],

  rules: {
    ...(ENABLE_SAFEQL
      ? {
          "@ts-safeql/check-sql": [
            "error",
            {
              connections: {
                databaseUrl: process.env.DATA_MANAGER_DATABASE_URL,
                targets: [
                  // This makes knex.raw commands linted
                  {
                    tag: "+(knex|knexInstance).+(raw|transaction)",
                    transform: "Array<{type}>",
                  },
                ],
              },
            },
          ],
        }
      : {}),
  },
};
