import {
  addSchemasPlugin,
  compressPlugin,
  sensiblePlugin,
} from "@vagabond/api-utils";
import { type FastifyPluginAsync } from "fastify";

import basicAuthPlugin from "./plugins/basic-auth.js";
import scrapeRoute from "./routes/scrape/index.js";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- AppOptions is a placeholder for future options
export interface AppOptions {
  // Place your custom options for app below here.
}

// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {};

const app: FastifyPluginAsync<AppOptions> = async (fastify, opts) => {
  // Register schemas first (needed by routes)
  await fastify.register(addSchemasPlugin, opts);

  // Register basic auth plugin (protects all routes)
  await fastify.register(basicAuthPlugin);

  // Register common plugins from api-utils
  await fastify.register(compressPlugin);
  await fastify.register(sensiblePlugin);

  // Register routes
  await fastify.register(scrapeRoute, { prefix: "api" });
};

export default app;
export { app, options };
