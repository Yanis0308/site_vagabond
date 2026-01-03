import fastifyBasicAuth from "@fastify/basic-auth";
import fp from "fastify-plugin";

export default fp(
  async (fastify) => {
    await fastify.register(fastifyBasicAuth, {
      //eslint-disable-next-line @typescript-eslint/require-await -- validate function is async but we don't need to await it
      validate: async (username: string, password: string) => {
        if (
          username !== fastify.config.basicAuthUser ||
          password !== fastify.config.basicAuthPassword
        ) {
          return new Error("Invalid credentials");
        }
      },
      authenticate: { realm: "data-scraper" },
    });

    // Apply basic auth to all routes
    fastify.addHook("onRequest", fastify.basicAuth);
  },
  {
    name: "basic-auth",
    dependencies: ["custom-config"],
  },
);
