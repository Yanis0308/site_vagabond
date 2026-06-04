import { type ConfigContext, type ExpoConfig } from "expo/config";
import permissions from "react-native-permissions/expo";
import { type DeepPartial } from "utility-types";
import { z } from "zod";

const RuntimeConfigSchema = z.object({
  apiBaseUrl: z.string().url(),
  cdnUrl: z.string().url(),
  appleSignInServiceId: z.string(),
  appleSignInRedirectUrl: z.string().url(),
  googleSignInWebClientId: z.string(),
  publicMapboxToken: z.string(),
  mapboxStyleUrl: z.string(),
  mapboxBoundariesTilesetUrl: z.string(),
  mapboxPoisTilesetUrl: z.string(),
  isDevEnv: z.boolean(),
  buildProfile: z.enum(["development", "preview", "production"]).optional(),
});

const appConfigSchema = z.object({
  appName: z.string(),
  packageAndBundleIdentifier: z.string(),
  googleServicesFiles: z.object({
    ios: z.string(),
    android: z.string(),
  }),
  privateMapboxToken: z.string(),
  eas: z.object({
    projectId: z.string(),
    updatesUrl: z.string(),
  }),
  runtimeConfig: RuntimeConfigSchema,
});

export default ({ config }: ConfigContext): ExpoConfig => {
  //eslint-disable-next-line no-console -- allow for logger function
  console.log(
    `[AppConfig] buildProfile: ${process.env.BUILD_PROFILE ?? "empty"}`,
  );

  const loadedConfig: DeepPartial<z.infer<typeof appConfigSchema>> = {
    appName: process.env.APP_NAME,
    packageAndBundleIdentifier: process.env.PACKAGE_AND_BUNDLE_IDENTIFIER,
    googleServicesFiles: {
      ios: process.env.GOOGLE_SERVICES_PLIST,
      android: process.env.GOOGLE_SERVICES_JSON,
    },
    privateMapboxToken: process.env.PRIVATE_MAPBOX_TOKEN,
    eas: {
      projectId: process.env.EXPO_EAS_PROJECT_ID,
      updatesUrl: process.env.EXPO_EAS_UPDATES_URL,
    },
    runtimeConfig: {
      apiBaseUrl: process.env.EXPO_PUBLIC_API_URL,
      cdnUrl: process.env.EXPO_PUBLIC_CDN_URL,
      appleSignInRedirectUrl:
        process.env.EXPO_PUBLIC_APPLE_SIGN_IN_REDIRECT_URL,
      appleSignInServiceId: process.env.EXPO_PUBLIC_APPLE_SIGN_IN_SERVICE_ID,
      googleSignInWebClientId:
        process.env.EXPO_PUBLIC_GOOGLE_SIGN_IN_WEB_CLIENT_ID,
      publicMapboxToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN,
      mapboxStyleUrl: process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL,
      mapboxBoundariesTilesetUrl:
        process.env.EXPO_PUBLIC_BOUNDARIES_MAPBOX_TILESET_URL,
      mapboxPoisTilesetUrl: process.env.EXPO_PUBLIC_POIS_MAPBOX_TILESET_URL,
      isDevEnv: process.env.BUILD_PROFILE !== "production",
      buildProfile: process.env.BUILD_PROFILE as
        | "development"
        | "preview"
        | "production"
        | undefined,
    },
  };

  const parsedConfig = appConfigSchema.safeParse(loadedConfig);

  if (!parsedConfig.success) {
    throw new Error("Invalid config: " + parsedConfig.error.message);
  }

  return {
    ...config,
    newArchEnabled: true,
    name: parsedConfig.data.appName, // For Expo Go and standalone app
    slug: "mobile-app", // For Expo EAS project
    owner: "vagabond-app", // Expo account name
    version: "1.2.0",
    // OTA runtime policy is always 1.0.0 for development / preview
    // and fingerprint for production (hashes of native code + app.config.ts + package.json + pnpm-lock.yaml)
    runtimeVersion: parsedConfig.data.runtimeConfig.isDevEnv
      ? "1.0.0"
      : { policy: "fingerprint" },
    updates: {
      fallbackToCacheTimeout: 30000,
      url: parsedConfig.data.eas.updatesUrl,
    },
    orientation: "portrait",
    icon: "./assets/images/full-icon.png",
    scheme: "vagabond-app", // URL Scheme to open the app, here vagabond://mylinkexample
    userInterfaceStyle: "light", // For light / dark mode
    ios: {
      bundleIdentifier: parsedConfig.data.packageAndBundleIdentifier,
      supportsTablet: true,
      infoPlist: {
        CFBundleDevelopmentRegion: "en",
        CFBundleLocalizations: ["en", "fr"],
        CFBundleAllowMixedLocalizations: true,
      },
      // indicate to Expo to configure apple-sign-in in our Apple developer account
      // but after that we manage it with the non expo library @invertase/react-native-apple-authentication
      usesAppleSignIn: true,
      entitlements: {
        "com.apple.developer.applesignin": ["Default"],
        // Required for APNs / push notifications. Value must match the
        // provisioning profile: "development" for the development build,
        // "production" for preview (TestFlight) and production (App Store).
        "aps-environment":
          parsedConfig.data.runtimeConfig.buildProfile === "development"
            ? "development"
            : "production",
      },
      googleServicesFile: parsedConfig.data.googleServicesFiles.ios,
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
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.POST_NOTIFICATIONS",
      ],
      package: parsedConfig.data.packageAndBundleIdentifier,
      googleServicesFile: parsedConfig.data.googleServicesFiles.android,
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      permissions({
        iosPermissions: [
          "LocationWhenInUse",
          "Notifications",
          "Camera",
          "PhotoLibrary",
        ],
      }),
      "expo-router",
      [
        "expo-font",
        {
          fonts: ["assets/fonts/SpaceMono-Regular.ttf"],
        },
      ],
      "expo-location",
      "expo-image-picker",
      "@react-native-google-signin/google-signin",
      [
        "expo-secure-store",
        {
          faceIDPermission:
            "Allow $(PRODUCT_NAME) to access your Face ID biometric data.",
        },
      ],
      "@react-native-firebase/app",
      "@react-native-firebase/crashlytics",
      "@react-native-firebase/auth",
      "@react-native-firebase/messaging",
      "react-native-notify-kit",
      [
        "expo-build-properties",
        {
          // https://github.com/invertase/react-native-firebase/issues/8657#issuecomment-3365508371
          ios: {
            deploymentTarget: "16.0",
            useFrameworks: "static",
            forceStaticLinking: ["RNFBApp"],
          },
        },
      ],
      [
        "@rnmapbox/maps",
        {
          RNMapboxMapsDownloadToken: parsedConfig.data.privateMapboxToken,
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
      "react-native-compressor",
      [
        "expo-file-system",
        {
          supportsOpeningDocumentsInPlace: false,
          enableFileSharing: false,
        },
      ],
      "expo-system-ui",
      "./custom.plugin.js",
    ],
    locales: {
      en: { ios: "./assets/locales/en.json" },
      fr: { ios: "./assets/locales/fr.json" },
    },
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: parsedConfig.data.eas.projectId,
      },
      ...parsedConfig.data.runtimeConfig,
    },
  };
};
