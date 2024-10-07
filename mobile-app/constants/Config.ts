import { z } from "zod";

const ConfigSchema = z.object({
  apiBaseUrl: z.string().url(),
  googleSignInIosClientId: z.string(),
});

// Expo will replace explicitly "process.env.my_key" by the corresponding env var, so we need to use it in plain text
// We can't do ConfigSchema.parse(process.env) directly
const loadedConfig = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL,
  googleSignInIosClientId: process.env.EXPO_PUBLIC_GOOGLE_SIGN_IN_IOS_CLIENT_ID,
};

export const config = ConfigSchema.parse(loadedConfig);
