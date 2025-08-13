import Constants from "expo-constants";
import { z } from "zod";

//TODO: remove zod and use typebox to validate the config
const ConfigSchema = z.object({
  apiBaseUrl: z.string().url(),
  cdnUrl: z.string().url(),
  appleSignInServiceId: z.string(),
  appleSignInRedirectUrl: z.string().url(),
  googleSignInWebClientId: z.string(),
  isLocalDev: z.boolean(),
  publicMapboxToken: z.string(),
  vexoApiKey: z.string(),
  vexoApiKeyAdmin: z.string(),
});

export type ConfigType = Partial<z.infer<typeof ConfigSchema>>;

// Expo will replace explicitly "process.env.my_key" by the corresponding env var, so we need to use it in plain text
// We can't do ConfigSchema.parse(process.env) directly
const loadedConfig = {
  isLocalDev: process.env.NODE_ENV === "development",
  ...Constants.expoConfig?.extra,
};

export const config = ConfigSchema.parse(loadedConfig);
