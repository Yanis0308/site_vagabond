import dotenv from "dotenv";
import fp from "fastify-plugin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

// Définition du schéma de configuration
const RawConfigSchema = z.object({
  //NODE_ENV: z.enum(["development", "production", "test"]),
  //PORT: z.string().transform(Number),
  FIREBASE_ADMIN_SERVICE_ACCOUNT_FILE_BASE64: z.string(),
  API_DATABASE_URL: z.string(),
});

// Type d'inférence pour TypeScript
export interface Config {
  firebaseAdminServiceAccountFilePath: string;
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

      const config = {
        firebaseAdminServiceAccountFilePath,
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
