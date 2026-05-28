// Configuration ESLint partagée entre les apps frontend (dashboard, website,
// mobile-app). Importée en complément de `eslint.config.mjs` racine.
//
// Pour l'instant, seul `better-tailwindcss` est mutualisé ici — son entryPoint
// diffère par app (Tailwind v3 → `tailwind.config.js`, v4 → `globals.css`),
// d'où la factory `tailwindcss(entryPoint)`. Ajouter ici toute règle qui
// concerne uniquement les apps frontend (et non les libs/apps backend).

import betterTailwindcss from "eslint-plugin-better-tailwindcss";

/**
 * Active `eslint-plugin-better-tailwindcss` avec le pointeur d'entrée Tailwind.
 *
 * @param {string} entryPoint chemin relatif à la racine de l'app
 *   (ex: `"./tailwind.config.js"` pour v3, `"app/globals.css"` pour v4).
 */
export function tailwindcss(entryPoint) {
  return {
    plugins: { "better-tailwindcss": betterTailwindcss },
    rules: {
      ...betterTailwindcss.configs["recommended-warn"].rules,
      // `printWidth: 120` évite l'oscillation single ↔ multi-line quand un
      // `<Element className="..." >` dépasse 80 chars sous nesting JSX
      // profond ou avec des classes Tailwind verbeuses (ex: `mask-[linear-gradient(...)]`).
      "better-tailwindcss/enforce-consistent-line-wrapping": [
        "warn",
        { printWidth: 120 },
      ],
    },
    settings: {
      "better-tailwindcss": { entryPoint },
    },
  };
}
