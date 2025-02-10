import Constants from "expo-constants";
import { z } from "zod";

const ConfigSchema = z.object({
  apiBaseUrl: z.string().url(),
  appleSignInServiceId: z.string(),
  appleSignInRedirectUrl: z.string().url(),
  googleSignInWebClientId: z.string(),
  isLocalDev: z.boolean(),
});

// Expo will replace explicitly "process.env.my_key" by the corresponding env var, so we need to use it in plain text
// We can't do ConfigSchema.parse(process.env) directly
const loadedConfig = {
  isLocalDev: process.env.NODE_ENV === "development",
  ...Constants.expoConfig?.extra,
};

export const config = ConfigSchema.parse(loadedConfig);
