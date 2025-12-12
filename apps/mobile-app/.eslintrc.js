// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: [
    "../../.eslintrc",
    "expo",
    "plugin:i18next/recommended",
    "plugin:react-you-might-not-need-an-effect/legacy-recommended",
  ],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
    alwaysTryTypes: true,
  },

  ignorePatterns: [
    "node_modules/",
    ".expo/",
    "components/ui/",
    "*.js",
    "expo-env.d.ts",
    "dist/*",
    "*.mjs",
  ],

  plugins: ["react-compiler"],

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
  },
};
