import "server-only";

import { z } from "zod";

const privateEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PAYLOAD_SECRET: z.string().min(1),
});

const parsed = privateEnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
});

export const privateEnv = {
  databaseUrl: parsed.DATABASE_URL,
  payloadSecret: parsed.PAYLOAD_SECRET,
} as const;
