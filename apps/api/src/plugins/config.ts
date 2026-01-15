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
  DATA_SCRAPER_URL: z.string(),
  DATA_SCRAPER_BASIC_AUTH_USER: z.string(),
  DATA_SCRAPER_BASIC_AUTH_PASSWORD: z.string(),
  JINA_API_KEY: z.string(),
  GEMINI_API_KEY: z.string(),
  WIKIMEDIA_OAUTH2_CLIENT_ID: z.string(),
  WIKIMEDIA_OAUTH2_CLIENT_SECRET: z.string(),
});

// Type d'inférence pour TypeScript
export interface Config {
  isDev: boolean;
  firebaseAdminServiceAccountFilePath: string;
  cdnUrl: string;
  s3: {
    bucketName: string;
  };
  slack: {
    botToken: string;
    channelSignups: string;
    channelPoiValidations: string;
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
  wikimedia: {
    oauth2: {
      clientId: string;
      clientSecret: string;
    };
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
        firebaseAdminServiceAccountFilePath,
        cdnUrl: rawConfig.CDN_URL,
        s3: {
          bucketName: rawConfig.S3_BUCKET_NAME,
        },
        slack: {
          botToken: rawConfig.SLACK_BOT_AUTH_TOKEN,
          channelSignups: rawConfig.SLACK_CHANNEL_SIGNUPS,
          channelPoiValidations: rawConfig.SLACK_CHANNEL_POI_VALIDATIONS,
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
        wikimedia: {
          oauth2: {
            clientId: rawConfig.WIKIMEDIA_OAUTH2_CLIENT_ID,
            clientSecret: rawConfig.WIKIMEDIA_OAUTH2_CLIENT_SECRET,
          },
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
