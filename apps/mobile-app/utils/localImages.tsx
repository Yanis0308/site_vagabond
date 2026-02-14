export const localImages = {
  // require() needed for React Native/Expo static asset bundling - paths must be statically analyzable
  starStruck:
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- required for React Native/Expo static asset bundling
    require("@/assets/images/emojis/animated/star-struck.webp") as number,
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- required for React Native/Expo static asset bundling
  googleLogo: require("@/assets/images/google-logo.png") as number,
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- required for React Native/Expo static asset bundling
  appleLogo: require("@/assets/images/apple-logo.png") as number,
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- required for React Native/Expo static asset bundling
  wikipediaLogo: require("@/assets/images/wikipedia-logo.png") as number,
  noPhotoPlaceholder:
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- required for React Native/Expo static asset bundling
    require("@/assets/images/content/no-photo-placeholder.png") as number,
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- required for React Native/Expo static asset bundling
  weNeedYou: require("@/assets/images/content/we-need-you.png") as number,
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- required for React Native/Expo static asset bundling
  bearingImage: require("@/assets/images/bearing-icon.png") as number,
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- required for React Native/Expo static asset bundling
  checkIcon: require("@/assets/images/icons/check.png") as number,
  questionMarkIcon:
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- required for React Native/Expo static asset bundling
    require("@/assets/images/icons/question-mark.png") as number,
  fullIconWithText:
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- required for React Native/Expo static asset bundling
    require("@/assets/images/full-icon-with-text.png") as number,
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- required for React Native/Expo static asset bundling
  appLogo: require("@/assets/images/full-icon.png") as number,
} as const;
