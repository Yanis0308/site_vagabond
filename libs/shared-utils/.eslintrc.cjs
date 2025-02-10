// https://docs.expo.dev/guides/using-eslint/
require("dotenv").config();

const DATABASE_URL = process.env.API_DATABASE_URL;
const ENABLE_SAFEQL = process.env.ENABLE_SAFEQL === "true";
if (ENABLE_SAFEQL && !DATABASE_URL) {
  throw new Error("API_DATABASE_URL is not set");
}

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
                databaseUrl: DATABASE_URL,
                targets: [
                  // This makes `prisma.$queryRaw` and `prisma.$executeRaw` commands linted
                  {
                    tag: "+(prisma|prismaExtendedClient).+($queryRaw|$executeRaw)",
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
