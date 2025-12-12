const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Use require condition to avoid ESM/CJS issues that can cause defineProperty errors
config.resolver.unstable_conditionNames = [
  "require",
  "node",
  "default",
  "react-native",
];

module.exports = withNativeWind(config, {
  input: "./global.css",
  // https://www.nativewind.dev/docs/api/with-nativewind#options
  // https://www.nativewind.dev/docs/tailwind/typography/font-size
  // rem is 14px on mobile instead of 16px - this affects not only text but also padding, margin, etc. - we disabled it here then set it to 16px in global.css
  inlineRem: false,
});
