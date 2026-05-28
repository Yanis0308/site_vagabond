import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

import rootConfig from "../../eslint.config.mjs";
import { tailwindcss } from "../../eslint.frontend.config.mjs";

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

  // Composants UI générés par shadcn — règles strictes assouplies pour ne pas
  // exiger d'éditer à la main du code que `pnpm dlx shadcn add` réécrit.
  {
    files: ["components/ui/**", "hooks/use-mobile.ts"],
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/strict-boolean-expressions": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "no-eq-null": "off",
      eqeqeq: "off",
      "react-you-might-not-need-an-effect/no-initialize-state": "off",
    },
  },

  // Helpers Supabase SSR — `no-deprecated` est un faux positif (la signature
  // `getAll`/`setAll` qu'on utilise est la *nouvelle* API recommandée, l'autre
  // overload `get`/`set`/`remove` est celle qui est dépréciée). Le retour
  // unsafe vient d'un mismatch de génériques entre @supabase/ssr et
  // @supabase/supabase-js — vit côté lib, hors de notre contrôle.
  {
    files: ["lib/supabase/**"],
    rules: {
      "@typescript-eslint/no-deprecated": "off",
      "@typescript-eslint/no-unsafe-return": "off",
    },
  },

  {
    ignores: [".next/", "out/", "build/", "next-env.d.ts"],
  },
];
