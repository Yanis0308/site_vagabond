import fastifyMultipart from "@fastify/multipart";
import { type FastifyInstance } from "fastify";
import fp from "fastify-plugin";

export default fp(
  async (fastify: FastifyInstance) => {
    await fastify.register(fastifyMultipart, {
      limits: {
        // fileSize limit can truncate file instead of triggering error
        fileSize: 10 * 1024 * 1024, // 10MB
        fields: 10, // Max number of non-file fields
        files: 1, // Max number of file fields
        parts: 1, // For multipart forms, the max number of parts (fields + files
      },
    });
  },
  { name: "multipart" },
);
