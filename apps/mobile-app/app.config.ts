import { type ConfigContext, type ExpoConfig } from "expo/config";

import { type ConfigType } from "./constants/Config";

// eslint-disable-next-line @arthurgeron/react-usememo/require-memo -- not a React component
export default ({ config }: ConfigContext): ExpoConfig => {
  const buildProfile = process.env.BUILD_PROFILE ?? "empty-build-profile";
  const isDevelopmentBuild = buildProfile !== "production";

  // eslint-disable-next-line no-console -- AppConfig debug logs
  console.log(
    "[AppConfig] buildProfile:",
    buildProfile,
    "| isDevelopmentBuild:",
    isDevelopmentBuild,
  );

  const variantConfig: {
    appName: string;
    packageAndBundleIdentifier: string;
    googleServicesFiles: {
      ios: string | undefined;
      android: string | undefined;
    };
    privateMapboxToken: string | undefined;
    runtimeConfig: ConfigType;
  } =
    // isDevelopmentBuild
    // ?
    {
      appName: buildProfile === "development" ? "DEV Vagabond" : "TST Vagabond",
      packageAndBundleIdentifier: "dev.com.vagabond.explore.tourism",
      googleServicesFiles: {
        ios: process.env.DEV_GOOGLE_SERVICES_PLIST,
        android: process.env.DEV_GOOGLE_SERVICES_JSON,
      },
      privateMapboxToken: process.env.DEV_PRIVATE_MAPBOX_TOKEN,
      runtimeConfig: {
        apiBaseUrl:
          buildProfile === "development"
            ? process.env.DEV_EXPO_PUBLIC_API_URL
            : // : process.env.PREVIEW_EXPO_PUBLIC_API_URL,
              process.env.DEV_EXPO_PUBLIC_API_URL,
        cdnUrl: process.env.DEV_EXPO_PUBLIC_CDN_URL,
        appleSignInRedirectUrl:
          process.env.DEV_EXPO_PUBLIC_APPLE_SIGN_IN_REDIRECT_URL,
        appleSignInServiceId:
          process.env.DEV_EXPO_PUBLIC_APPLE_SIGN_IN_SERVICE_ID,
        googleSignInWebClientId:
          process.env.DEV_EXPO_PUBLIC_GOOGLE_SIGN_IN_WEB_CLIENT_ID,
        publicMapboxToken: process.env.DEV_SEMI_PUBLIC_MAPBOX_TOKEN,
        vexoApiKey: process.env.DEV_EXPO_PUBLIC_VEXO_API_KEY,
        vexoApiKeyAdmin: process.env.DEV_EXPO_PUBLIC_VEXO_API_KEY_ADMIN,
      },
    };
  // : // We have never tested this before
  // {
  //   appName: "Vagabond",
  //   packageAndBundleIdentifier: "com.vagabond.explore.tourism",
  //   googleServicesFiles: {
  //     ios: process.env.PRD_GOOGLE_SERVICES_PLIST,
  //     android: process.env.PRD_GOOGLE_SERVICES_JSON,
  //   },
  //   privateMapboxToken: process.env.PRD_PRIVATE_MAPBOX_TOKEN,
  //   runtimeConfig: {
  //     apiBaseUrl: process.env.PRD_EXPO_PUBLIC_API_URL,
  //     cdnUrl: process.env.PRD_EXPO_PUBLIC_CDN_URL,
  //     appleSignInRedirectUrl:
  //       process.env.PRD_EXPO_PUBLIC_APPLE_SIGN_IN_REDIRECT_URL,
  //     appleSignInServiceId:
  //       process.env.PRD_EXPO_PUBLIC_APPLE_SIGN_IN_SERVICE_ID,
  //     googleSignInWebClientId:
  //       process.env.PRD_EXPO_PUBLIC_GOOGLE_SIGN_IN_WEB_CLIENT_ID,
  //     publicMapboxToken: process.env.PRD_PUBLIC_MAPBOX_TOKEN,
  //     vexoApiKey: process.env.PRD_EXPO_PUBLIC_VELO_API_KEY,
  //   },
  // };
  return {
    ...config,
    newArchEnabled: true,
    name: variantConfig.appName, // For Expo Go and standalone app
    slug: "mobile-app", // For Expo EAS project
    owner: "vagabond-app", // Expo account name
    version: "1.0.0",
    runtimeVersion: "1.0.0", // For Expo OTA updates
    updates: {
      fallbackToCacheTimeout: 30000,
      url: process.env.EXPO_EAS_UPDATES_URL,
    },
    orientation: "portrait",
    icon: "./assets/images/full-icon.png",
    scheme: "vagabond-app", // URL Scheme to open the app, here vagabond://mylinkexample
    userInterfaceStyle: "light", // For light / dark mode
    ios: {
      bundleIdentifier: variantConfig.packageAndBundleIdentifier,
      supportsTablet: true,
      // indicate to Expo to configure apple-sign-in in our Apple developer account
      // but after that we manage it with the non expo library @invertase/react-native-apple-authentication
      usesAppleSignIn: true,
      entitlements: {
        "com.apple.developer.applesignin": ["Default"],
      },
      googleServicesFile: variantConfig.googleServicesFiles.ios,
      config: {
        usesNonExemptEncryption: false,
      },
    },
    android: {
      edgeToEdgeEnabled: true,
      icon: "./assets/images/full-icon.png",
      adaptiveIcon: {
        foregroundImage: "./assets/images/icon-transparent-with-padding.png",
        backgroundImage: "./assets/images/icon-background.png",
      },
      permissions: [
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
      ],
      package: variantConfig.packageAndBundleIdentifier,
      googleServicesFile: variantConfig.googleServicesFiles.android,
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-font",
        {
          fonts: ["assets/fonts/SpaceMono-Regular.ttf"],
        },
      ],
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "Allow $(PRODUCT_NAME) to use your location.",
          // App open but backgrounded
          // isAndroidForegroundServiceEnabled: true,
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission:
            "The app accesses your photos to let you share them with your friends.",
        },
      ],
      [
        "expo-media-library",
        {
          photosPermission: "Allow $(PRODUCT_NAME) to access your photos.",
          savePhotosPermission: "Allow $(PRODUCT_NAME) to save photos.",
          isAccessMediaLocationEnabled: true,
        },
      ],
      [
        "expo-camera",
        {
          cameraPermission: "Allow $(PRODUCT_NAME) to access your camera",
          microphonePermission:
            "Allow $(PRODUCT_NAME) to access your microphone",
          recordAudioAndroid: true,
        },
      ],
      "@react-native-google-signin/google-signin",
      [
        "expo-secure-store",
        {
          faceIDPermission:
            "Allow $(PRODUCT_NAME) to access your Face ID biometric data.",
        },
      ],
      [
        "expo-dev-launcher",
        {
          launchMode: "most-recent",
        },
      ],
      "@react-native-firebase/app",
      "@react-native-firebase/crashlytics",
      "@react-native-firebase/auth",
      [
        "expo-build-properties",
        {
          ios: {
            // For firebase auth
            useFrameworks: "static",
          },
        },
      ],
      [
        "@rnmapbox/maps",
        {
          RNMapboxMapsDownloadToken: variantConfig.privateMapboxToken,
          // Manually update the version when needed
          RNMapboxMapsVersion: "11.10.1",
        },
      ],
      "expo-localization",
      "expo-web-browser",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#faf1e4",
          image: "./assets/images/icon-transparent.png",
          imageWidth: 190, // doc says 200 but it's not working https://github.com/expo/expo/issues/32515
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: "1ab4c082-bc8a-41b0-826f-fc4d53216d2d",
      },
      ...variantConfig.runtimeConfig,
    },
  };
};
