import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const isDevelopmentBuild = ["development-simulator", "development"].includes(
    process.env.EAS_BUILD_PROFILE ?? "",
  );
  return {
    ...config,
    name: isDevelopmentBuild ? "dev-vagabond-app" : "vagabond-app", // For Expo Go and standalone app
    slug: "mobile-app", // For Expo EAS project
    owner: "vagabond-app", // Expo account name
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "vagabond-app", // URL Scheme to open the app, here vagabond://mylinkexample
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      bundleIdentifier: isDevelopmentBuild
        ? "dev.com.vagabond.explore.tourism"
        : "com.vagabond.explore.tourism",
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      permissions: [
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
      ],
      package: isDevelopmentBuild
        ? "dev.com.vagabond.explore.tourism"
        : "com.vagabond.explore.tourism",
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
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
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme: process.env.GOOGLE_SIGN_IN_IOS_REVERSED_CLIENT_ID,
        },
      ],
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
    },
  };
};
