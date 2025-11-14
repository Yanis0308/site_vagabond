const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Fix for  ERROR  TypeError: Cannot read property 'defineProperty' of undefined, js engine: hermes
// https://github.com/expo/expo/discussions/35444
config.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(config, {
  input: "./global.css",
  // https://www.nativewind.dev/docs/api/with-nativewind#options
  // https://www.nativewind.dev/docs/tailwind/typography/font-size
  // rem is 14px on mobile instead of 16px - this affects not only text but also padding, margin, etc. - we disabled it here then set it to 16px in global.css
  inlineRem: false,
});
