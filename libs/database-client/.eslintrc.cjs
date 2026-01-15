// https://docs.expo.dev/guides/using-eslint/
require("dotenv").config();

const SAFEQL_DATABASE_URL = process.env.SAFEQL_DATABASE_URL;
console.log(
  "=== ESLint database client, SAFEQL_DATABASE_URL",
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

  ignorePatterns: [
    "node_modules/",
    "dist/",
    "drizzle.config.ts",
    "*.js",
    "*.mjs",
  ],
};
