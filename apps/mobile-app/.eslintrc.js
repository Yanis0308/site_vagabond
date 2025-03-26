// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: ["../../.eslintrc", "expo"],
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
  ],

  plugins: ["@arthurgeron/react-usememo"],

  rules: {
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
  },
};
