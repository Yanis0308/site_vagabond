import fastifyCompress from "@fastify/compress";
import { type FastifyInstance } from "fastify";
import fp from "fastify-plugin";

export default fp(
  async (fastify: FastifyInstance) => {
    await fastify.register(fastifyCompress);
  },
  { name: "compress" },
);
