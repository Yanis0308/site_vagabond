import {
  fastifyRequestContext,
  requestContext,
} from "@fastify/request-context";
import type { FastifyBaseLogger } from "fastify";
import fp from "fastify-plugin";

declare module "@fastify/request-context" {
  interface RequestContextData {
    log: FastifyBaseLogger;
  }
}

export { requestContext };

export default fp(
  async (fastify) => {
    await fastify.register(fastifyRequestContext, {
      defaultStoreValues: (request) => ({
        log: request.log,
      }),
    });
  },
  {
    name: "request-context",
  },
);
