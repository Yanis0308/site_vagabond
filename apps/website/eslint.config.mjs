import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

import rootConfig from "../../eslint.config.mjs";
import { tailwindcss } from "../../eslint.frontend.config.mjs";

// Filter out @typescript-eslint plugin (root config provides it) and strip
// the eslint-config-next parser so the root's @typescript-eslint/parser with
// projectService is used instead.
const nextConfigFiltered = nextCoreWebVitals
  .filter((config) => !config.plugins?.["@typescript-eslint"])
  .map((config) => {
    if (config.languageOptions?.parser) {
      const { parser: _parser, ...restLang } = config.languageOptions;
      return { ...config, languageOptions: restLang };
    }
    return config;
  });

export default [
  ...rootConfig,
  ...nextConfigFiltered,

  tailwindcss("app/globals.css"),

  // Seed scripts — console output is expected, return types not required
  {
    files: ["scripts/**/*.ts"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },

  // Ignores website-specific
  {
    ignores: [
      ".next/",
      "out/",
      "build/",
      "next-env.d.ts",
      "payload-types.ts",
      "app/(payload)/",
    ],
  },
];
