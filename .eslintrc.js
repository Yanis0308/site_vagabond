/* eslint-env node */

module.exports = {
  extends: [
    "plugin:@typescript-eslint/strict-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
    "plugin:eslint-comments/recommended",
    "plugin:tailwindcss/recommended",
    "plugin:@tanstack/query/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["./libs/*/tsconfig.json", "./apps/*/tsconfig.json"],
    sourceType: "module",
    ecmaVersion: "latest",
  },
  ignorePatterns: ["**/*.js", "**/*.cjs", ".eslintrc.js"],
  plugins: ["@typescript-eslint", "prettier", "simple-import-sort"],
  rules: {
    "@typescript-eslint/restrict-template-expressions": [
      "error",
      { allowNumber: true, allowNullish: true },
    ],
    "@typescript-eslint/return-await": ["error", "always"],
    "eslint-comments/no-unused-disable": "error",
    "eslint-comments/require-description": "error",
    "@typescript-eslint/explicit-function-return-type": "error",
    "no-console": "error",
    "prettier/prettier": "error",
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
    "no-implicit-coercion": "error",
    "valid-typeof": "error",
    "@typescript-eslint/strict-boolean-expressions": [
      "error",
      {
        allowNullableBoolean: true,
        allowString: false,
        allowNumber: false,
        allowNullableObject: false,
      },
    ],
    eqeqeq: "error",
    "no-eq-null": "error",
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { fixStyle: "inline-type-imports" },
    ],
    // "@typescript-eslint/no-floating-promises": [
    //   "error",
    //   {
    //     allowForKnownSafePromises: [
    //       { from: "package", name: "FastifyInstance", package: "fastify" },
    //       { from: "package", name: "FastifyReply", package: "fastify" },
    //       { from: "package", name: "SafePromiseLike", package: "fastify" },
    //     ],
    //   },
    // ],
    "@typescript-eslint/array-type": ["error", { default: "array-simple" }],
    "@typescript-eslint/no-redundant-type-constituents": "off",
  },
};
