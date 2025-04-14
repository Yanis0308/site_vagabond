// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: [
    "../../.eslintrc",
    "next",
    "next/core-web-vitals",
    "next/typescript",
  ],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
    alwaysTryTypes: true,
  },

  ignorePatterns: ["node_modules/", "*.js", ".next/"],

  // https://github.com/vercel/next.js/issues/47047#issuecomment-2319613780
  settings: {
    next: {
      rootDir: ".",
    },
  },

  rules: {},
};
