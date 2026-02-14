// @ts-check

import eslint from "@eslint/js";
import eslintComments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import tanstackQuery from "@tanstack/eslint-plugin-query";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import reactYouMightNotNeedAnEffect from "eslint-plugin-react-you-might-not-need-an-effect";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tailwindcss from "eslint-plugin-tailwindcss";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Global ignores (replaces ignorePatterns)
  {
    ignores: [
      "**/*.js",
      "**/*.cjs",
      "**/*.mjs",
      "**/node_modules/",
      "**/dist/",
      "**/.expo/",
    ],
  },

  // Base configs
  eslint.configs.recommended,
  tseslint.configs.stylisticTypeChecked,
  tseslint.configs.strictTypeChecked,

  // eslint-comments
  eslintComments.recommended,

  // tailwindcss
  ...tailwindcss.configs["flat/recommended"],

  // tanstack query
  ...tanstackQuery.configs["flat/recommended"],

  // react-you-might-not-need-an-effect
  reactYouMightNotNeedAnEffect.configs.recommended,

  // prettier (must be last of the extends)
  eslintPluginPrettierRecommended,

  // TypeScript project-aware settings + custom rules
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true, allowNullish: true },
      ],
      "@typescript-eslint/return-await": ["error", "always"],
      "@eslint-community/eslint-comments/no-unused-disable": "error",
      "@eslint-community/eslint-comments/require-description": "error",
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
      "@typescript-eslint/array-type": ["error", { default: "array-simple" }],
      "@typescript-eslint/no-redundant-type-constituents": "off",
      "@typescript-eslint/no-unnecessary-condition": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "TaggedTemplateExpression[typeArguments]",
          message:
            "N'utilise pas sql<T>. Utilise .mapWith(Number), .mapWith(String), etc. à la place pour une conversion runtime.",
        },
      ],
    },
  },
);
