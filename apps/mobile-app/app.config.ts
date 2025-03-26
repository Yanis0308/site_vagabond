import { type ConfigContext, type ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const buildProfile = process.env.BUILD_PROFILE ?? "";
  const isDevelopmentBuild = buildProfile !== "production";

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
    googleServicesFiles: {
      ios: string | undefined;
      android: string | undefined;
    };
    privateMapboxToken: string | undefined;
    runtimeConfig: {
      apiBaseUrl: string | undefined;
      appleSignInRedirectUrl: string | undefined;
      appleSignInServiceId: string | undefined;
      googleSignInWebClientId: string | undefined;
      publicMapboxToken: string | undefined;
    };
  } = isDevelopmentBuild
    ? {
        appName: "DEV Vagabond",
        packageAndBundleIdentifier: "dev.com.vagabond.explore.tourism",
        googleServicesFiles: {
          ios: process.env.DEV_GOOGLE_SERVICES_PLIST,
          android: process.env.DEV_GOOGLE_SERVICES_JSON,
        },
        privateMapboxToken: process.env.DEV_PRIVATE_MAPBOX_TOKEN,
        runtimeConfig: {
          apiBaseUrl: process.env.DEV_EXPO_PUBLIC_API_URL,
          appleSignInRedirectUrl:
            process.env.DEV_EXPO_PUBLIC_APPLE_SIGN_IN_REDIRECT_URL,
          appleSignInServiceId:
            process.env.DEV_EXPO_PUBLIC_APPLE_SIGN_IN_SERVICE_ID,
          googleSignInWebClientId:
            process.env.DEV_EXPO_PUBLIC_GOOGLE_SIGN_IN_WEB_CLIENT_ID,
          publicMapboxToken: process.env.DEV_PUBLIC_MAPBOX_TOKEN,
        },
      }
    : // We have never tested this before
      {
        appName: "Vagabond",
        packageAndBundleIdentifier: "com.vagabond.explore.tourism",
        googleServicesFiles: {
          ios: process.env.PRD_GOOGLE_SERVICES_PLIST,
          android: process.env.PRD_GOOGLE_SERVICES_JSON,
        },
        privateMapboxToken: process.env.PRD_PRIVATE_MAPBOX_TOKEN,
        runtimeConfig: {
          apiBaseUrl: process.env.PRD_EXPO_PUBLIC_API_URL,
          appleSignInRedirectUrl:
            process.env.PRD_EXPO_PUBLIC_APPLE_SIGN_IN_REDIRECT_URL,
          appleSignInServiceId:
            process.env.PRD_EXPO_PUBLIC_APPLE_SIGN_IN_SERVICE_ID,
          googleSignInWebClientId:
            process.env.PRD_EXPO_PUBLIC_GOOGLE_SIGN_IN_WEB_CLIENT_ID,
          publicMapboxToken: process.env.PRD_PUBLIC_MAPBOX_TOKEN,
        },
      };
  return {
    ...config,
    newArchEnabled: true,
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
