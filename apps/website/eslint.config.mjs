import rootConfig from "../../eslint.config.mjs";
import nextConfig from "eslint-config-next";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import i18nextPlugin from "eslint-plugin-i18next";

export default [
  // Root config (TypeScript strict, prettier, etc.)
  ...rootConfig,

  ...nextConfig,
  ...nextCoreWebVitals,
  ...nextTypescript,

  // i18next
  {
    plugins: { i18next: i18nextPlugin },
    rules: {
      ...i18nextPlugin.configs.recommended.rules,
    },
  },

  // Custom rules
  {
    settings: {
      next: { rootDir: "." },
    },
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },

  // Ignores
  {
    ignores: ["node_modules/", ".next/"],
  },
];
