import dotenv from "dotenv";
import fp from "fastify-plugin";
import { z } from "zod";

export const isDev = process.env.NODE_ENV === "development";

// Définition du schéma de configuration
const RawConfigSchema = z.object({
  HEADLESS_MODE: z.string().optional(),
  API_DATABASE_URL: z.string(),
  BASIC_AUTH_USER: z.string(),
  BASIC_AUTH_PASSWORD: z.string(),
});

// Type d'inférence pour TypeScript
export interface Config {
  isDev: boolean;
  port: number;
  headlessMode: boolean;
  databaseUrl: string;
  basicAuthUser: string;
  basicAuthPassword: string;
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

      const config: Config = {
        isDev,
        port: 3234,
        headlessMode: isDev && rawConfig.HEADLESS_MODE === "true",
        databaseUrl: rawConfig.API_DATABASE_URL,
        basicAuthUser: rawConfig.BASIC_AUTH_USER,
        basicAuthPassword: rawConfig.BASIC_AUTH_PASSWORD,
      };

      // Décoration de l'instance Fastify avec la config
      fastify.decorate("config", config);
    } catch (error) {
      fastify.log.error({ error }, "Failed to load configuration");
      if (error instanceof z.ZodError) {
        const errorMessage = `Invalid env variables: ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`;
        throw new Error(errorMessage);
      }
      throw error;
    }
  },
  {
    name: "custom-config",
  },
);
