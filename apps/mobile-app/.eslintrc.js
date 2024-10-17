// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  root: true,
  extends: ["../../.eslintrc.base", "expo"],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
    alwaysTryTypes: true,
  },

  ignorePatterns: ["node_modules/", ".expo/", "components/ui/", "*.js"],
};
