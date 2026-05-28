import rootConfig from "../../eslint.config.mjs";
import { tailwindcss } from "../../eslint.frontend.config.mjs";
import expoFlatConfig from "eslint-config-expo/flat.js";
import i18nextPlugin from "eslint-plugin-i18next";
import reactCompiler from "eslint-plugin-react-compiler";

// Filter out configs that define @typescript-eslint plugin to avoid "Cannot redefine plugin" error.
// Root config already provides TypeScript support via typescript-eslint.
const expoFlatConfigWithoutTypescript = expoFlatConfig.filter(
  (config) => !config.plugins?.["@typescript-eslint"],
);

export default [
  // Root config (TypeScript strict, prettier, react-you-might-not-need-an-effect, etc.)
  ...rootConfig,

  // Expo flat config (React, import resolution, expo rules - TypeScript excluded to avoid plugin conflict)
  ...expoFlatConfigWithoutTypescript,

  tailwindcss("./tailwind.config.js"),

  // i18next
  {
    plugins: { i18next: i18nextPlugin },
    rules: {
      ...i18nextPlugin.configs.recommended.rules,
    },
  },

  // React compiler
  reactCompiler.configs.recommended,

  // Performance: disable no-deprecated for mobile app — this rule causes ESLint
  // to hang due to quadratic type graph traversal with React Native/Expo types.
  {
    rules: {
      "@typescript-eslint/no-deprecated": "off",
    },
  },

  // Custom rules
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react-native-safe-area-context",
              importNames: ["useSafeAreaInsets"],
              message:
                "Use useSafeAreaCustom from @/hooks/other/useSafeAreaCustom instead.",
            },
            {
              name: "react-native",
              importNames: ["Text", "Image"],
              message:
                "Use CustomText or CustomImage instead of Text/Image from react-native.",
            },
            {
              name: "@/components/ui/text",
              message:
                "Use CustomText from @/components/custom-ui/CustomText instead.",
            },
            {
              name: "@/components/ui/image",
              message:
                "Use CustomImage from @/components/custom-ui/CustomImage instead.",
            },
            {
              name: "expo-image",
              importNames: ["Image"],
              message:
                "Use CustomImage from @/components/custom-ui/CustomImage instead.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.object.name='router'][callee.property.name='push']",
          message:
            "Use router.navigate() instead of router.push(); use router.dismiss() to close a modal.",
        },
        {
          selector: "NewExpression[callee.name='URLSearchParams']",
          message:
            "Do not use URLSearchParams (RN polyfill is buggy: ky reads it via iteration which silently drops entries — confirmed on VG-470 cursor pagination). Pass a plain object to ky's `searchParams`: { foo, bar } instead.",
        },
      ],
    },
  },

  // Ignores (mobile-app specific, root already has **/*.js, **/*.mjs, etc.)
  {
    ignores: [
      "node_modules/",
      ".expo/",
      "components/ui/",
      "**/*.js",
      "**/*.mjs",
      "scripts/",
      "expo-env.d.ts",
      "dist/*",
    ],
  },
];
