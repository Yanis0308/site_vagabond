/* eslint-env node */
module.exports = {
  extends: [
    "plugin:@typescript-eslint/strict-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
    "plugin:eslint-comments/recommended",
    "plugin:tailwindcss/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
    ecmaVersion: "latest",
  },
  plugins: [
    "@typescript-eslint",
    "@arthurgeron/react-usememo",
    "prettier",
    "simple-import-sort",
  ],
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
    "@arthurgeron/react-usememo/require-usememo": [
      "error",
      {
        strict: false,
        checkHookReturnObject: true,
        fix: { addImports: true },
        checkHookCalls: true,
        ignoredHookCallsNames: { useStateManagement: false },
        ignoredPropNames: ["style"],
      },
    ],
    "@arthurgeron/react-usememo/require-memo": "error",
    // "@arthurgeron/react-usememo/require-usememo-children": "error",
    "prettier/prettier": "error",
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
  },
};
