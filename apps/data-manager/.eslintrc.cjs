// https://docs.expo.dev/guides/using-eslint/
require("dotenv").config();

const SAFEQL_DATABASE_URL = process.env.SAFEQL_DATABASE_URL;
console.log(
  "=== ESLint data manager, SAFEQL_DATABASE_URL",
  SAFEQL_DATABASE_URL,
);

module.exports = {
  extends: ["../../.eslintrc"],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
    alwaysTryTypes: true,
  },

  plugins: SAFEQL_DATABASE_URL ? ["@ts-safeql/eslint-plugin"] : [],

  ignorePatterns: ["node_modules/", "*.js", "*.mjs"],

  rules: {
    ...(SAFEQL_DATABASE_URL
      ? {
          "@ts-safeql/check-sql": [
            "error",
            {
              connections: {
                databaseUrl: SAFEQL_DATABASE_URL,
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
