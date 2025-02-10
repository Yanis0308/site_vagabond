import { type ConfigContext, type ExpoConfig } from "expo/config";

// for Github Actions CI checks
const process = { env: {} } as { env: Record<string, string | undefined> };

export default ({ config }: ConfigContext): ExpoConfig => {
  const buildProfile = process.env.BUILD_PROFILE ?? "";
  const isDevelopmentBuild =
    buildProfile !== "preview" && buildProfile !== "production";

  // eslint-disable-next-line no-console -- AppConfig debug logs
  console.log(
    "[AppConfig] buildProfile:",
    buildProfile,
    "| isDevelopmentBuild:",
    isDevelopmentBuild,
  );

  //TODO: on pourrait peut-être vérifier le contenu de process.env avec Zod -> les valeurs sont peut-être remplacées directement dans le code donc attention à bien mentionner chaque process.env.[VARIABLE_NAME] dans le code
  const variantConfig: {
    appName: string;
    packageAndBundleIdentifier: string;
    googleMapsApiKey: string | undefined;
    googleServicesFiles: {
      ios: string | undefined;
      android: string | undefined;
    };
    runtimeConfig: {
      apiBaseUrl: string | undefined;
      appleSignInRedirectUrl: string | undefined;
      appleSignInServiceId: string | undefined;
      googleSignInWebClientId: string | undefined;
    };
  } = isDevelopmentBuild
    ? {
        appName: "DEV Vagabond",
        packageAndBundleIdentifier: "dev.com.vagabond.explore.tourism",
        googleMapsApiKey: process.env.DEV_GOOGLE_MAPS_API_KEY,
        googleServicesFiles: {
          ios: process.env.DEV_GOOGLE_SERVICES_PLIST,
          android: process.env.DEV_GOOGLE_SERVICES_JSON,
        },
        runtimeConfig: {
          apiBaseUrl: process.env.DEV_EXPO_PUBLIC_API_URL,
          appleSignInRedirectUrl:
            process.env.DEV_EXPO_PUBLIC_APPLE_SIGN_IN_REDIRECT_URL,
          appleSignInServiceId:
            process.env.DEV_EXPO_PUBLIC_APPLE_SIGN_IN_SERVICE_ID,
          googleSignInWebClientId:
            process.env.DEV_EXPO_PUBLIC_GOOGLE_SIGN_IN_WEB_CLIENT_ID,
        },
      }
    : {
        appName: "Vagabond",
        packageAndBundleIdentifier: "com.vagabond.explore.tourism",
        googleMapsApiKey: process.env.TST_GOOGLE_MAPS_API_KEY,
        googleServicesFiles: {
          ios: process.env.TST_GOOGLE_SERVICES_PLIST,
          android: process.env.TST_GOOGLE_SERVICES_JSON,
        },
        runtimeConfig: {
          apiBaseUrl: process.env.TST_EXPO_PUBLIC_API_URL,
          appleSignInRedirectUrl:
            process.env.TST_EXPO_PUBLIC_APPLE_SIGN_IN_REDIRECT_URL,
          appleSignInServiceId:
            process.env.TST_EXPO_PUBLIC_APPLE_SIGN_IN_SERVICE_ID,
          googleSignInWebClientId:
            process.env.TST_EXPO_PUBLIC_GOOGLE_SIGN_IN_WEB_CLIENT_ID,
        },
      };
  return {
    ...config,
    newArchEnabled: false, // Disable new architecture to avoid issues with react-native-maps - 07/02/2025
    name: variantConfig.appName, // For Expo Go and standalone app
    slug: "mobile-app", // For Expo EAS project
    owner: "vagabond-app", // Expo account name
    version: "1.0.0",
    runtimeVersion: "1.0.0", // For Expo OTA updates
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
        googleMapsApiKey: variantConfig.googleMapsApiKey,
        usesNonExemptEncryption: false,
      },
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
      package: variantConfig.packageAndBundleIdentifier,
      config: {
        googleMaps: {
          apiKey: variantConfig.googleMapsApiKey,
        },
      },
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
      "@react-native-firebase/auth",
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
          },
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
