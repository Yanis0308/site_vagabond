import "dotenv/config";
import { z } from "zod";

const ConfigSchema = z.object({
  STRAPI_BASE_URL: z.string(),
  STRAPI_API_KEY: z.string(),
});

export const config = ConfigSchema.parse(process.env);
