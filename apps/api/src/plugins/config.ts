import { type UserFeedbackCategory } from "@vagabond/shared-utils";
import dotenv from "dotenv";
import fp from "fastify-plugin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

export const isDev = process.env.NODE_ENV === "development";

// Définition du schéma de configuration
const RawConfigSchema = z.object({
  //NODE_ENV: z.enum(["development", "production", "test"]),
  //PORT: z.string().transform(Number),
  FIREBASE_ADMIN_SERVICE_ACCOUNT_FILE_BASE64: z.string(),
  API_DATABASE_URL: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_ENDPOINT_URL_S3: z.string(),
  AWS_ENDPOINT_URL_IAM: z.string(),
  AWS_REGION: z.string(),
  S3_BUCKET_NAME: z.string(),
  CDN_URL: z.string(),
  SLACK_BOT_AUTH_TOKEN: z.string(),
  SLACK_CHANNEL_SIGNUPS: z.string(),
  SLACK_CHANNEL_POI_VALIDATIONS: z.string(),
  SLACK_CHANNEL_APP_REVIEWS: z.string(),
  SLACK_CHANNEL_POI_REPORTS: z.string(),
  SLACK_CHANNEL_PLACE_SUGGESTIONS: z.string(),
  SLACK_CHANNEL_USER_FEEDBACK: z.string(),
  DATA_SCRAPER_URL: z.string(),
  DATA_SCRAPER_BASIC_AUTH_USER: z.string(),
  DATA_SCRAPER_BASIC_AUTH_PASSWORD: z.string(),
  JINA_API_KEY: z.string(),
  GEMINI_API_KEY: z.string(),
  GROQ_API_KEY: z.string(),
  SENTRY_DSN: z.string(),
  SENTRY_ENVIRONMENT: z.string(),
  APP_ENV: z.enum(["development", "production"]).optional(),
  FLY_APP_NAME: z.string().optional(),
  FLY_VM_MEMORY_MB: z.coerce.number().int().positive().default(1024),
});

// Type d'inférence pour TypeScript
export interface Config {
  isDev: boolean;
  isDevServer: boolean;
  appServerName: string | undefined;
  serverMemoryMb: number;
  firebaseAdminServiceAccountFilePath: string;
  cdnUrl: string;
  s3: {
    bucketName: string;
  };
  slack: {
    botToken: string;
    channelSignups: string;
    channelPoiValidations: string;
    channelAppReviews: string;
    channelPoiReports: string;
    channelPlaceSuggestions: string;
    channelUserFeedbackByCategory: Record<UserFeedbackCategory, string>;
  };
  dataScraper: {
    url: string;
    basicAuthUser: string;
    basicAuthPassword: string;
  };
  jina: {
    apiKey: string;
  };
  gemini: {
    apiKey: string;
  };
  groq: {
    apiKey: string;
  };
}

// Déclaration pour étendre l'interface Fastify
declare module "fastify" {
  interface FastifyInstance {
    config: Config;
  }
}

export default fp(
  (fastify) => {
    // Chargement des variables d'environnement
    dotenv.config();

    try {
      // Validation de la configuration
      const rawConfig = RawConfigSchema.parse(process.env);

      // Write the Firebase Admin Service Account file in the current directory "plugins"
      const firebaseAdminServiceAccountFilePath = path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        "firebase-admin-service-account.json",
      );
      fs.writeFileSync(
        firebaseAdminServiceAccountFilePath,
        Buffer.from(
          rawConfig.FIREBASE_ADMIN_SERVICE_ACCOUNT_FILE_BASE64,
          "base64",
        ).toString("utf-8"),
      );

      const config: Config = {
        isDev,
        isDevServer: rawConfig.APP_ENV === "development",
        appServerName: rawConfig.FLY_APP_NAME,
        serverMemoryMb: rawConfig.FLY_VM_MEMORY_MB,
        firebaseAdminServiceAccountFilePath,
        cdnUrl: rawConfig.CDN_URL,
        s3: {
          bucketName: rawConfig.S3_BUCKET_NAME,
        },
        slack: {
          botToken: rawConfig.SLACK_BOT_AUTH_TOKEN,
          channelSignups: rawConfig.SLACK_CHANNEL_SIGNUPS,
          channelPoiValidations: rawConfig.SLACK_CHANNEL_POI_VALIDATIONS,
          channelAppReviews: rawConfig.SLACK_CHANNEL_APP_REVIEWS,
          channelPoiReports: rawConfig.SLACK_CHANNEL_POI_REPORTS,
          channelPlaceSuggestions: rawConfig.SLACK_CHANNEL_PLACE_SUGGESTIONS,
          channelUserFeedbackByCategory: {
            POI_REPORT: rawConfig.SLACK_CHANNEL_POI_REPORTS,
            PLACE_SUGGESTION: rawConfig.SLACK_CHANNEL_PLACE_SUGGESTIONS,
            BUG: rawConfig.SLACK_CHANNEL_USER_FEEDBACK,
            SUGGESTION: rawConfig.SLACK_CHANNEL_USER_FEEDBACK,
            INCOMPREHENSION: rawConfig.SLACK_CHANNEL_USER_FEEDBACK,
            OTHER: rawConfig.SLACK_CHANNEL_USER_FEEDBACK,
          },
        },
        dataScraper: {
          url: rawConfig.DATA_SCRAPER_URL,
          basicAuthUser: rawConfig.DATA_SCRAPER_BASIC_AUTH_USER,
          basicAuthPassword: rawConfig.DATA_SCRAPER_BASIC_AUTH_PASSWORD,
        },
        jina: {
          apiKey: rawConfig.JINA_API_KEY,
        },
        gemini: {
          apiKey: rawConfig.GEMINI_API_KEY,
        },
        groq: {
          apiKey: rawConfig.GROQ_API_KEY,
        },
      };

      // Décoration de l'instance Fastify avec la config
      fastify.decorate("config", config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid env variables: ${error.message}`);
      }
      throw error;
    }
  },
  {
    name: "custom-config",
  },
);
