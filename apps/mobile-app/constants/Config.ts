import Constants from "expo-constants";
import { z } from "zod";

//TODO: remove zod and use typebox to validate the config
export const RuntimeConfigSchema = z.object({
  apiBaseUrl: z.string().url(),
  cdnUrl: z.string().url(),
  appleSignInServiceId: z.string(),
  appleSignInRedirectUrl: z.string().url(),
  googleSignInWebClientId: z.string(),
  publicMapboxToken: z.string(),
  mapboxStyleUrl: z.string(),
  mapboxTilesetUrl: z.string(),
  vexoApiKey: z.string(),
});

// Expo will replace explicitly "process.env.my_key" by the corresponding env var, so we need to use it in plain text
// We can't do ConfigSchema.parse(process.env) directly
const loadedConfig = {
  ...Constants.expoConfig?.extra,
};

export const config = RuntimeConfigSchema.parse(loadedConfig);
