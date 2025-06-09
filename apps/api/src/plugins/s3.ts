import { S3Client } from "@aws-sdk/client-s3";
import { type FastifyInstance } from "fastify";
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyInstance {
    s3: S3Client;
  }
}

export default fp(
  function s3(fastify: FastifyInstance) {
    const decoratorName = "s3";

    // We need to check if this name is already being used
    if (fastify.hasDecorator(decoratorName)) {
      throw new Error(`The plugin ${decoratorName} is already registered`);
    }

    // All params are loaded from env variables
    const s3 = new S3Client({
      forcePathStyle: false,
    });

    fastify.decorate(decoratorName, s3);
  },
  {
    name: "fastify-s3",
    dependencies: ["custom-config"],
  },
);
