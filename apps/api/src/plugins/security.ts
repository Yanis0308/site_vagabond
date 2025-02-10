import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import fp from "fastify-plugin";

export default fp(
  async (fastify) => {
    await fastify.register(helmet);
    await fastify.register(cors);
  },
  {
    name: "security",
  },
);
