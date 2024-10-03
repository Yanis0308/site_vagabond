import { z } from "zod";

const ConfigSchema = z.object({
  EXPO_PUBLIC_API_URL: z.string().url(),
  EXPO_PUBLIC_GOOGLE_SIGN_IN_IOS_CLIENT_ID: z.string(),
});

export const config = ConfigSchema.parse(process.env);
