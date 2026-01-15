// https://docs.expo.dev/guides/using-eslint/
require("dotenv").config();

module.exports = {
  extends: ["../../.eslintrc"],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
    alwaysTryTypes: true,
  },

  plugins: [],

  ignorePatterns: ["node_modules/", "dist/", "*.js", "*.mjs"],

  rules: {},
};
